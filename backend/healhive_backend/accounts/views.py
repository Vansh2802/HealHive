from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
import logging

from .models import User, TherapistProfile
from .serializers import RegisterSerializer, LoginSerializer, AuthUserSerializer, generate_access_token
from reports.models import AssessmentReport
from therapy_sessions.models import TherapySession

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            first_error_list = next(iter(serializer.errors.values()), ['Signup failed. Please try again.'])
            first_error = first_error_list[0] if isinstance(first_error_list, list) and first_error_list else str(first_error_list)
            logger.warning(f'[RegisterView] Signup failed: {first_error}')
            return Response({'success': False, 'error': str(first_error)}, status=400)

        user = serializer.save()
        logger.info(f'[RegisterView] User created: {user.email}, role: {user.role}')

        if user.role == User.ROLE_THERAPIST:
            profile = user.therapist_profile
            logger.info(f'[RegisterView] TherapistProfile created: {profile.id}, is_verified={profile.is_verified}, is_approved={profile.is_approved}')
            logger.info(f'[RegisterView] Therapist pending approval: {user.email}')
            return Response(
                {
                    'success': True,
                    'token': None,
                    'message': 'Application submitted. Awaiting admin approval.',
                    'user': AuthUserSerializer(user).data,
                },
                status=201,
            )

        token = generate_access_token(user)
        logger.info(f'[RegisterView] User login token generated: {user.email}')
        return Response({'success': True, 'token': token, 'user': AuthUserSerializer(user).data}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            first_error_list = next(iter(serializer.errors.values()), ['Login failed.'])
            first_error = first_error_list[0] if isinstance(first_error_list, list) and first_error_list else str(first_error_list)
            logger.warning('[LoginView] Login failed email=%s role=%s error=%s', request.data.get('email'), request.data.get('role'), first_error)
            return Response({'success': False, 'error': str(first_error)}, status=401)

        user = serializer.validated_data['user']
        token = generate_access_token(user)
        
        # Log therapy status for debugging
        if user.role == User.ROLE_THERAPIST:
            profile = user.therapist_profile
            logger.info(f'[LoginView] Therapist login: {user.email}, status: is_approved={profile.is_approved}, is_verified={profile.is_verified}, is_rejected={profile.is_rejected}')
        else:
            logger.info(f'[LoginView] User login: {user.email}, role: {user.role}')
            
        return Response({'success': True, 'token': token, 'user': AuthUserSerializer(user).data})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'success': True, 'user': AuthUserSerializer(request.user).data})


class TherapistsListView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access to view available therapists

    def get(self, request):
        therapists = TherapistProfile.objects.select_related('user').prefetch_related('availabilities').filter(
            Q(is_approved=True) | Q(is_verified=True)
        )

        # Filter for assigned therapist if user is authenticated
        if request.user.is_authenticated and request.user.role == User.ROLE_USER and hasattr(request.user, 'patient_profile'):
            assigned = request.user.patient_profile.assigned_therapist
            if assigned:
                therapists = therapists.filter(id=assigned.id)

        data = [
            {
                'id': t.id,
                'userId': t.user_id,
                'name': t.user.full_name,
                'specialization': t.specialization,
                'bio': t.bio,
                'universityName': t.university_name,
                'isApproved': t.is_approved,
                'isRejected': t.is_rejected,
                'applicationDate': t.application_date,
                'approvalDate': t.approval_date,
                'availability': [
                    {
                        '_id': slot.id,
                        'id': slot.id,
                        'date': slot.start_time.date().isoformat(),
                        'startTime': slot.start_time.isoformat(),
                        'endTime': slot.end_time.isoformat(),
                        'isBooked': slot.is_booked,
                    }
                    for slot in t.availabilities.all()
                ],
            }
            for t in therapists
        ]
        return Response({'success': True, 'therapists': data})


class TherapistsAllView(APIView):
    """Fetch all therapists (for admin dashboard)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.ROLE_ADMIN:
            logger.warning(f'[TherapistsAllView] Non-admin user {request.user.email} attempted access')
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        therapists = TherapistProfile.objects.select_related('user').all().order_by('-user__created_at')
        logger.info(f'[TherapistsAllView] Fetching all therapists: {therapists.count()} total')
        
        # Count by status
        pending = therapists.filter(is_approved=False, is_rejected=False, is_verified=False).count()
        approved = therapists.filter(is_approved=True).count() or therapists.filter(is_verified=True).count()
        rejected = therapists.filter(is_rejected=True).count()
        logger.info(f'[TherapistsAllView] Status breakdown - Pending: {pending}, Approved: {approved}, Rejected: {rejected}')
        
        # Format therapists with proper structure for admin dashboard
        data = [
            {
                '_id': t.id,
                'id': t.id,
                'userId': t.user_id,
                'name': t.user.full_name,
                'email': t.user.email,
                'specialization': t.specialization,
                'bio': t.bio,
                'licenseNumber': t.license_number,
                'universityName': t.university_name,
                'verified': t.is_approved or t.is_verified,
                'isApproved': t.is_approved,
                'isRejected': t.is_rejected,
                'isActive': t.user.is_active,
                'createdAt': t.user.created_at,
                'applicationDate': t.application_date,
                'approvalDate': t.approval_date,
            }
            for t in therapists
        ]
        logger.debug(f'[TherapistsAllView] Returning {len(data)} therapists')
        return Response({'success': True, 'therapists': data})


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        therapists = TherapistProfile.objects.select_related('user').all().order_by('-user__created_at')
        therapist_data = [
            {
                'id': t.id,
                'userId': t.user_id,
                'name': t.user.full_name,
                'email': t.user.email,
                'specialization': t.specialization,
                'bio': t.bio,
                'licenseNumber': t.license_number,
                'universityName': t.university_name,
                'verified': t.is_verified,
                'isApproved': t.is_approved,
                'isRejected': t.is_rejected,
                'isActive': t.user.is_active,
                'createdAt': t.user.created_at,
                'applicationDate': t.application_date,
                'approvalDate': t.approval_date,
            }
            for t in therapists
        ]

        reports = AssessmentReport.objects.all()[:100]
        flags = [
            {
                'id': report.id,
                'chatSessionId': report.session_id,
                'timestamp': report.created_at,
                'severity': (report.severity or 'medium').lower(),
                'reason': 'High-risk conversation detected' if (report.severity or '').lower() in ['high', 'high-risk'] else 'Therapist review recommended',
                'status': report.status,
                'snippet': report.user_message[:220],
            }
            for report in reports
        ]

        metrics = {
            'totalUsers': User.objects.filter(role=User.ROLE_USER).count(),
            'totalTherapists': TherapistProfile.objects.count(),
            'activeTherapists': TherapistProfile.objects.filter(
                Q(is_approved=True) | Q(is_verified=True),
                user__is_active=True,
            ).count(),
            'approvedTherapists': TherapistProfile.objects.filter(Q(is_approved=True) | Q(is_verified=True)).count(),
            'pendingTherapists': TherapistProfile.objects.filter(
                is_approved=False,
                is_rejected=False,
                is_verified=False,
            ).count(),
            'totalSessions': TherapySession.objects.count(),
            'pendingVerifications': TherapistProfile.objects.filter(
                is_approved=False,
                is_rejected=False,
                is_verified=False,
            ).count(),
            'highRiskFlags': AssessmentReport.objects.filter(severity__iregex=r'^(high|high-risk)$').count(),
            'avgSessionRating': 4.8,
        }

        return Response({
            'success': True,
            'flags': flags,
            'therapists': therapist_data,
            'metrics': metrics,
        })


class AdminTherapistReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, therapist_id):
        return self._handle_review(request, therapist_id)

    def put(self, request, therapist_id):
        """Support PUT method for frontend compatibility"""
        return self._handle_review(request, therapist_id)

    def _handle_review(self, request, therapist_id):
        if request.user.role != User.ROLE_ADMIN:
            logger.warning(f'[AdminTherapistReviewView] Non-admin user {request.user.email} attempted review')
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        try:
            profile = TherapistProfile.objects.select_related('user').get(id=therapist_id)
        except TherapistProfile.DoesNotExist:
            logger.warning(f'[AdminTherapistReviewView] Therapist {therapist_id} not found')
            return Response({'success': False, 'error': 'Therapist not found.'}, status=404)

        action = request.data.get('action')
        logger.info(f'[AdminTherapistReviewView] Admin {request.user.email} attempting to {action} therapist {profile.user.email}')
        
        if action == 'approve':
            profile.is_approved = True
            profile.is_rejected = False
            profile.is_verified = True
            profile.approval_date = timezone.now()
            profile.save(update_fields=['is_approved', 'is_rejected', 'is_verified', 'approval_date'])
            profile.user.is_active = True
            profile.user.save(update_fields=['is_active'])
            logger.info(f'[AdminTherapistReviewView] Therapist {profile.user.email} approved - is_verified={profile.is_verified}, is_approved={profile.is_approved}')
        elif action == 'reject':
            profile.is_approved = False
            profile.is_rejected = True
            profile.is_verified = False
            profile.approval_date = None
            profile.save(update_fields=['is_approved', 'is_rejected', 'is_verified', 'approval_date'])
            profile.user.is_active = False
            profile.user.save(update_fields=['is_active'])
            logger.info(f'[AdminTherapistReviewView] Therapist {profile.user.email} rejected')
        else:
            logger.warning(f'[AdminTherapistReviewView] Invalid action: {action}')
            return Response({'success': False, 'error': 'Invalid review action.'}, status=400)

        return Response({'success': True})


class AdminReportReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, report_id):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        try:
            report = AssessmentReport.objects.get(id=report_id)
        except AssessmentReport.DoesNotExist:
            return Response({'success': False, 'error': 'Report not found.'}, status=404)

        report.status = AssessmentReport.STATUS_REVIEWED
        report.save(update_fields=['status'])
        return Response({'success': True})
