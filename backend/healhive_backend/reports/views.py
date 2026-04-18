from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import User, TherapistProfile, PatientProfile
from ai_chatbot.services.crew_agents import CrewAIEmailAgents
from .models import AssessmentReport, TherapyRequest
from .serializers import AssessmentReportSerializer, AssessmentReportCreateSerializer, TherapyRequestSerializer


class ReportsView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request):
        serializer = AssessmentReportCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=400)

        report = serializer.save()
        severity = (report.severity or '').upper()
        if severity in {'MEDIUM', 'HIGH'}:
            TherapyRequest.objects.get_or_create(
                report=report,
                defaults={
                    'user': report.user,
                    'status': TherapyRequest.STATUS_PENDING,
                },
            )

        return Response({'success': True, 'reportId': report.id}, status=201)

    def get(self, request):
        if request.user.role not in [User.ROLE_THERAPIST, User.ROLE_ADMIN]:
            return Response({'success': False, 'error': 'Access restricted to therapists and admins.'}, status=403)

        if request.user.role == User.ROLE_THERAPIST:
            reports = AssessmentReport.objects.select_related('assigned_therapist__user').filter(
                assigned_therapist__user=request.user
            )[:100]
        else:
            reports = AssessmentReport.objects.all()[:100]

        return Response({'success': True, 'reports': AssessmentReportSerializer(reports, many=True).data})


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        if request.user.role not in [User.ROLE_THERAPIST, User.ROLE_ADMIN]:
            return Response({'success': False, 'error': 'Access restricted to therapists and admins.'}, status=403)

        try:
            report = AssessmentReport.objects.get(id=report_id)
        except AssessmentReport.DoesNotExist:
            return Response({'success': False, 'error': 'Report not found.'}, status=404)

        if request.user.role == User.ROLE_THERAPIST and (
            not report.assigned_therapist or report.assigned_therapist.user_id != request.user.id
        ):
            return Response({'success': False, 'error': 'Report visible only to the assigned therapist.'}, status=403)

        return Response({'success': True, 'report': AssessmentReportSerializer(report).data})


class AdminTherapyRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        requests_qs = TherapyRequest.objects.select_related(
            'user', 'assigned_therapist__user', 'report'
        ).all()
        return Response({'success': True, 'requests': TherapyRequestSerializer(requests_qs, many=True).data})


class AdminAssignTherapistView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, request_id):
        if request.user.role != User.ROLE_ADMIN:
            return Response({'success': False, 'error': 'Admin access required.'}, status=403)

        therapist_id = request.data.get('therapist_id')
        if not therapist_id:
            return Response({'success': False, 'error': 'therapist_id is required.'}, status=400)

        try:
            therapy_request = TherapyRequest.objects.select_related('report', 'user').get(id=request_id)
        except TherapyRequest.DoesNotExist:
            return Response({'success': False, 'error': 'Therapy request not found.'}, status=404)

        try:
            therapist = TherapistProfile.objects.select_related('user').get(id=therapist_id, is_verified=True)
        except TherapistProfile.DoesNotExist:
            return Response({'success': False, 'error': 'Verified therapist not found.'}, status=404)

        therapy_request.assigned_therapist = therapist
        therapy_request.status = TherapyRequest.STATUS_ASSIGNED
        therapy_request.save(update_fields=['assigned_therapist', 'status', 'updated_at'])

        report = therapy_request.report
        report.assigned_therapist = therapist
        report.save(update_fields=['assigned_therapist'])

        if therapy_request.user:
            patient_profile, _ = PatientProfile.objects.get_or_create(user=therapy_request.user)
            patient_profile.assigned_therapist = therapist
            patient_profile.save(update_fields=['assigned_therapist'])

        CrewAIEmailAgents().send_therapist_assignment_email(report=report, therapy_request=therapy_request)

        return Response({'success': True, 'request': TherapyRequestSerializer(therapy_request).data})
