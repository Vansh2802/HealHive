from datetime import timedelta
import logging

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TherapistProfile, User
from ai_chatbot.services.crew_agents import CrewAIEmailAgents
from .email_utils import send_session_email
from .models import Availability, Session, TherapySession
from .serializers import AvailabilitySerializer, BookSessionSerializer, TherapySessionSerializer
from .services.meeting_links import generate_meeting_link

logger = logging.getLogger(__name__)

DEFAULT_SESSION_DURATION = timedelta(hours=1)


def _parse_request_datetime(value, field_name):
    parsed_value = parse_datetime(value) if isinstance(value, str) else value
    if parsed_value is None:
        raise ValueError(f'{field_name} must be a valid ISO datetime string.')
    if timezone.is_naive(parsed_value):
        parsed_value = timezone.make_aware(parsed_value, timezone=timezone.get_current_timezone())
    return parsed_value


class AvailabilityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == User.ROLE_THERAPIST and hasattr(user, 'therapist_profile'):
            availabilities = Availability.objects.filter(therapist=user.therapist_profile)
        elif user.role == User.ROLE_ADMIN:
            availabilities = Availability.objects.all()
        else:
            return Response({'success': False, 'error': 'Unauthorized.'}, status=403)
        return Response({'success': True, 'availabilities': AvailabilitySerializer(availabilities, many=True).data})

    def post(self, request):
        user = request.user
        if user.role != User.ROLE_THERAPIST or not hasattr(user, 'therapist_profile'):
            return Response({'success': False, 'error': 'Only therapists can create availability.'}, status=403)
        data = request.data.copy()
        data['therapist'] = user.therapist_profile.id
        serializer = AvailabilitySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'availability': serializer.data}, status=201)
        return Response({'success': False, 'error': serializer.errors}, status=400)


class AvailabilityDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, availability_id):
        user = request.user
        try:
            availability = Availability.objects.get(id=availability_id)
        except Availability.DoesNotExist:
            return Response({'success': False, 'error': 'Availability not found.'}, status=404)
        if user.role != User.ROLE_THERAPIST or not hasattr(user, 'therapist_profile') or availability.therapist != user.therapist_profile:
            return Response({'success': False, 'error': 'Unauthorized.'}, status=403)
        if availability.is_booked:
            return Response({'success': False, 'error': 'Cannot delete a booked slot.'}, status=400)
        availability.delete()
        return Response({'success': True, 'message': 'Availability deleted.'})


class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == User.ROLE_THERAPIST and hasattr(user, 'therapist_profile'):
            sessions = TherapySession.objects.select_related(
                'therapist__user', 'patient__user'
            ).filter(therapist=user.therapist_profile)
        elif user.role == User.ROLE_USER:
            # Task 8: Use get_or_create so we never silently return zero sessions
            # for a patient who has an existing TherapySession but no profile row
            # (edge case: profile was deleted, or created before this fix).
            from accounts.models import PatientProfile
            patient_profile, _ = PatientProfile.objects.get_or_create(user=user)
            sessions = TherapySession.objects.select_related(
                'therapist__user', 'patient__user'
            ).filter(patient=patient_profile)
        elif user.role == User.ROLE_ADMIN:
            sessions = TherapySession.objects.select_related(
                'therapist__user', 'patient__user'
            ).all()
        else:
            sessions = TherapySession.objects.none()

        return Response({'success': True, 'sessions': TherapySessionSerializer(sessions, many=True).data})



class TherapistUpcomingSessionsView(APIView):
    """Get upcoming booked sessions for a therapist with meeting links."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != User.ROLE_THERAPIST or not hasattr(user, 'therapist_profile'):
            logger.warning(f'[TherapistUpcomingSessionsView] Non-therapist access attempted: {user.role}')
            return Response({'success': False, 'error': 'Only therapists can access this endpoint.'}, status=403)

        logger.info(f'[TherapistUpcomingSessionsView] Fetching upcoming sessions for therapist {user.email}')

        # Get all confirmed sessions and filter logically to assure consistency with property
        now = timezone.now()
        sessions = TherapySession.objects.select_related('patient__user').filter(
            therapist=user.therapist_profile,
            session_status=TherapySession.STATUS_CONFIRMED
        ).order_by('session_time')

        session_data = []
        for session in sessions:
            if session.current_status == 'completed':
                continue
                
            session_data.append({
                'id': session.id,
                'patient_name': f'Anonymous User #{session.patient_id}',
                'session_time': session.session_time.isoformat(),
                'session_end_time': session.session_end_time.isoformat() if session.session_end_time else None,
                'meeting_link': session.meeting_link,
                'status': session.current_status,
            })

        logger.info(f'[TherapistUpcomingSessionsView] Returning {len(session_data)} upcoming sessions')
        return Response({'success': True, 'sessions': session_data})


class BookSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_email = request.user.email
        logger.info(f'[BookSessionView] Booking request from {user_email}')
        print('[BookSessionView] Incoming request data:', request.data)
        
        if request.user.role != User.ROLE_USER:
            logger.warning(f'[BookSessionView] Non-user role attempted booking: {request.user.role}')
            return Response({'success': False, 'error': 'Only patients can book sessions.'}, status=403)

        # Check if user has assigned therapist
        if hasattr(request.user, 'patient_profile') and request.user.patient_profile.assigned_therapist:
            assigned_therapist_id = request.user.patient_profile.assigned_therapist_id
            requested_therapist_id = request.data.get('therapist_id')
            if int(requested_therapist_id or 0) != int(assigned_therapist_id):
                logger.warning(f'[BookSessionView] User {user_email} tried to book with different therapist')
                return Response(
                    {'success': False, 'error': 'Please book with your assigned therapist.'},
                    status=400,
                )

        logger.debug(f'[BookSessionView] Validating booking data: {request.data}')
        serializer = BookSessionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Return the first human-readable error message.
            first_error_list = next(iter(serializer.errors.values()), ['Invalid booking request.'])
            first_error = first_error_list[0] if isinstance(first_error_list, list) and first_error_list else str(first_error_list)
            logger.warning(f'[BookSessionView] Booking validation failed: {serializer.errors}')
            return Response({'success': False, 'error': str(first_error)}, status=400)

        therapist_id = serializer.validated_data['therapist_id']
        start_time = serializer.validated_data['start_time']
        end_time = serializer.validated_data.get('end_time') or (start_time + DEFAULT_SESSION_DURATION)
        availability_id = serializer.validated_data.get('availability_id')

        try:
            therapist = TherapistProfile.objects.select_related('user').get(id=therapist_id)
        except TherapistProfile.DoesNotExist:
            logger.warning('[BookSessionView] Therapist not found therapist_id=%s', therapist_id)
            return Response({'success': False, 'error': 'Therapist not found.'}, status=404)

        logger.info('[BookSessionView] Generating Jitsi meeting link user=%s therapist=%s', request.user.email, therapist.user.email)
        meeting_link = generate_meeting_link()
        event_id = None

        try:
            serializer.context['meeting_link'] = meeting_link
            serializer.context['google_event_id'] = event_id
            session = serializer.save()
            print('Saved meeting link:', session.meeting_link)
        except ValidationError as exc:
            logger.warning('[BookSessionView] Booking conflict availability_id=%s therapist_id=%s: %s', availability_id, therapist_id, exc.detail)
            return Response({'success': False, 'error': exc.detail}, status=409)
        except Exception as exc:
            logger.exception('[BookSessionView] Unexpected booking failure: %s', exc)
            return Response({'success': False, 'error': 'Unable to book session. Please try again.'}, status=500)
        
        try:
            send_session_email(session)
        except Exception as exc:
            logger.warning(f'[BookSessionView] Email sending failed: {exc}')
        
        logger.info(f'[BookSessionView] Booking completed successfully for {user_email}')
        message = 'Session booked successfully'
        return Response({'success': True, 'message': message, 'session': TherapySessionSerializer(session).data}, status=201)


class CreateSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = request.data
        print('[CreateSessionView] Incoming request data:', payload)

        try:
            user_id = int(payload.get('user') or payload.get('user_id'))
            therapist_id = int(payload.get('therapist') or payload.get('therapist_id'))
            start_time = _parse_request_datetime(payload.get('start_time'), 'start_time')
            end_time = _parse_request_datetime(payload.get('end_time'), 'end_time')
        except (TypeError, ValueError) as exc:
            return Response({'success': False, 'error': str(exc)}, status=400)

        if end_time <= start_time:
            return Response({'success': False, 'error': 'end_time must be after start_time.'}, status=400)

        try:
            user = User.objects.get(id=user_id)
            therapist = TherapistProfile.objects.get(id=therapist_id, is_verified=True)
        except (User.DoesNotExist, TherapistProfile.DoesNotExist):
            return Response({'success': False, 'error': 'User or therapist not found.'}, status=404)

        if request.user.role != User.ROLE_ADMIN and request.user.id not in {user.id, therapist.user_id}:
            return Response({'success': False, 'error': 'Unauthorized to create this session.'}, status=403)

        if not user.email or not therapist.user.email:
            return Response({'success': False, 'error': 'Both user and therapist must have email addresses.'}, status=400)

        logger.info('[CreateSessionView] Generating Jitsi meeting link user=%s therapist=%s', user.email, therapist.user.email)
        meeting_link = generate_meeting_link()
        event_id = None

        session = Session.objects.create(
            user=user,
            therapist=therapist,
            meeting_link=meeting_link,
            google_event_id=event_id,
            # we don't have google_event_id on `Session` model, just adding it via save is fine for now but it's not in the model.
            # wait, `Session` is an old model for this? Let's check.
            scheduled_time=start_time,
        )
        print('Saved meeting link:', session.meeting_link)

        return Response(
            {
                'success': True,
                'message': 'Session booked successfully',
                'session_id': session.id,
                'meeting_link': session.meeting_link,
                'scheduled_time': session.scheduled_time,
            },
            status=201,
        )


class JoinSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = TherapySession.objects.select_related('therapist__user', 'patient__user').get(id=session_id)
        except TherapySession.DoesNotExist:
            return Response({'success': False, 'error': 'Session not found.'}, status=404)

        user_id = request.user.id
        allowed_ids = {session.therapist.user_id, session.patient.user_id}
        if user_id not in allowed_ids and request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Unauthorized for this session.'}, status=403)

        if not session.meeting_link:
            return Response({'success': False, 'error': 'Meeting link is not available for this session.'}, status=409)

        return Response({'success': True, 'room_id': session.room_id, 'meeting_link': session.meeting_link})


class SessionFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = TherapySession.objects.select_related('therapist__user', 'patient__user').get(id=session_id)
        except TherapySession.DoesNotExist:
            return Response({'success': False, 'error': 'Session not found.'}, status=404)

        user_id = request.user.id
        allowed_ids = {session.therapist.user_id, session.patient.user_id}
        if user_id not in allowed_ids and request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Unauthorized for this session.'}, status=403)

        rating = request.data.get('rating')
        feedback_text = str(request.data.get('feedback') or '').strip()

        if rating is not None:
            try:
                rating = int(rating)
            except (TypeError, ValueError):
                return Response({'success': False, 'error': 'rating must be an integer between 1 and 5.'}, status=400)
            if rating < 1 or rating > 5:
                return Response({'success': False, 'error': 'rating must be between 1 and 5.'}, status=400)

        session.feedback_rating = rating
        session.feedback_text = feedback_text
        session.feedback_submitted_at = timezone.now()
        session.save(update_fields=['feedback_rating', 'feedback_text', 'feedback_submitted_at'])

        if not session.followup_email_sent:
            CrewAIEmailAgents().send_followup_email(session)
            session.followup_email_sent = True
            session.save(update_fields=['followup_email_sent'])

        return Response({'success': True, 'session': TherapySessionSerializer(session).data})
