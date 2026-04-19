from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import TherapistProfile, User
from ai_chatbot.services.crew_agents import CrewAIEmailAgents
from .email_utils import send_session_email
from .models import Availability, Session, TherapySession
from .serializers import AvailabilitySerializer, BookSessionSerializer, TherapySessionSerializer
from .services.google_calendar import GoogleCalendarError, create_google_meet


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
        elif user.role == User.ROLE_USER and hasattr(user, 'patient_profile'):
            sessions = TherapySession.objects.select_related(
                'therapist__user', 'patient__user'
            ).filter(patient=user.patient_profile)
        elif user.role == User.ROLE_ADMIN:
            sessions = TherapySession.objects.select_related(
                'therapist__user', 'patient__user'
            ).all()
        else:
            sessions = TherapySession.objects.none()

        return Response({'success': True, 'sessions': TherapySessionSerializer(sessions, many=True).data})


class BookSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.ROLE_USER:
            return Response({'success': False, 'error': 'Only patients can book sessions.'}, status=403)

        if hasattr(request.user, 'patient_profile') and request.user.patient_profile.assigned_therapist:
            assigned_therapist_id = request.user.patient_profile.assigned_therapist_id
            requested_therapist_id = request.data.get('therapist_id')
            if int(requested_therapist_id or 0) != int(assigned_therapist_id):
                return Response(
                    {'success': False, 'error': 'Please book with your assigned therapist.'},
                    status=400,
                )

        serializer = BookSessionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=400)

        session = serializer.save()
        start_time = session.session_time
        end_time = start_time + DEFAULT_SESSION_DURATION

        try:
            # Place credentials.json beside manage.py or point GOOGLE_CREDENTIALS_FILE to it.
            meeting_link = create_google_meet(
                start_time=start_time,
                end_time=end_time,
                user_email=request.user.email,
                therapist_email=session.therapist.user.email,
            )
        except (FileNotFoundError, GoogleCalendarError, ValueError) as exc:
            session.delete()
            return Response({'success': False, 'error': str(exc)}, status=502)

        session.meeting_link = meeting_link
        session.session_end_time = end_time
        session.save(update_fields=['meeting_link', 'session_end_time'])
        send_session_email(session)

        return Response({'success': True, 'session': TherapySessionSerializer(session).data}, status=201)


class CreateSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = request.data

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

        try:
            # Token refresh and OAuth flow are handled inside the Google Calendar service.
            meeting_link = create_google_meet(
                start_time=start_time,
                end_time=end_time,
                user_email=user.email,
                therapist_email=therapist.user.email,
            )
        except FileNotFoundError as exc:
            return Response({'success': False, 'error': str(exc)}, status=500)
        except (GoogleCalendarError, ValueError) as exc:
            return Response({'success': False, 'error': str(exc)}, status=502)

        session = Session.objects.create(
            user=user,
            therapist=therapist,
            meeting_link=meeting_link,
            scheduled_time=start_time,
        )

        return Response(
            {
                'success': True,
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
            base_url = request.build_absolute_uri('/').rstrip('/')
            session.meeting_link = f"{base_url}/video-call/{session.room_id}/"
            session.save(update_fields=['meeting_link'])

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
