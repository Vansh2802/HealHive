from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, TherapistProfile
from .serializers import RegisterSerializer, LoginSerializer, AuthUserSerializer, generate_access_token
from reports.models import AssessmentReport
from therapy_sessions.models import TherapySession


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=400)

        user = serializer.save()
        token = generate_access_token(user)
        return Response({'success': True, 'token': token, 'user': AuthUserSerializer(user).data}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            first_error = next(iter(serializer.errors.values()))[0]
            return Response({'success': False, 'error': str(first_error)}, status=401)

        user = serializer.validated_data['user']
        token = generate_access_token(user)
        return Response({'success': True, 'token': token, 'user': AuthUserSerializer(user).data})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'success': True, 'user': AuthUserSerializer(request.user).data})


class TherapistsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        therapists = TherapistProfile.objects.select_related('user').filter(is_verified=True)

        if request.user.role == User.ROLE_USER and hasattr(request.user, 'patient_profile'):
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
            }
            for t in therapists
        ]
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
                'isActive': t.user.is_active,
                'createdAt': t.user.created_at,
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
            'activeTherapists': TherapistProfile.objects.filter(is_verified=True, user__is_active=True).count(),
            'totalSessions': TherapySession.objects.count(),
            'pendingVerifications': TherapistProfile.objects.filter(is_verified=False, user__is_active=True).count(),
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
        if request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        try:
            profile = TherapistProfile.objects.select_related('user').get(id=therapist_id)
        except TherapistProfile.DoesNotExist:
            return Response({'success': False, 'error': 'Therapist not found.'}, status=404)

        action = request.data.get('action')
        if action == 'approve':
            profile.is_verified = True
            profile.save(update_fields=['is_verified'])
            profile.user.is_active = True
            profile.user.save(update_fields=['is_active'])
        elif action == 'reject':
            profile.is_verified = False
            profile.save(update_fields=['is_verified'])
            profile.user.is_active = False
            profile.user.save(update_fields=['is_active'])
        else:
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
