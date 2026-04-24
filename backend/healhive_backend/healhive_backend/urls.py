from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from reports.views import ReportsView, ReportDetailView, AdminTherapyRequestListView, AdminAssignTherapistView
from therapy_sessions.views import AvailabilityDeleteView, AvailabilityListCreateView
from therapy_sessions.views import TherapistUpcomingSessionsView
from video_calls.views import video_room_view


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(_request):
    return Response({'status': 'ok', 'service': 'HealHive API'})


urlpatterns = [
    path('', RedirectView.as_view(pattern_name='chatbot-home', permanent=False), name='root'),
    path('admin/', admin.site.urls),
    path('api/health', health_check, name='health-check'),
    path('api/', include('accounts.urls')),
    path('api/reports', ReportsView.as_view(), name='reports'),
    path('api/reports/<int:report_id>', ReportDetailView.as_view(), name='report-detail'),
    path('api/reports/admin/therapy-requests', AdminTherapyRequestListView.as_view(), name='admin-therapy-requests'),
    path('api/reports/admin/therapy-requests/<int:request_id>/assign', AdminAssignTherapistView.as_view(), name='admin-assign-therapist'),
    path('api/sessions/', include('therapy_sessions.urls')),
    path('api/therapist/sessions', TherapistUpcomingSessionsView.as_view(), name='therapist-sessions'),
    # Backward-compatible aliases for legacy frontend calls.
    path('api/therapists/my/availability', AvailabilityListCreateView.as_view(), name='therapist-my-availability'),
    path('api/therapists/my/availability/', AvailabilityListCreateView.as_view(), name='therapist-my-availability-slash'),
    path('api/therapists/my/availability/<int:availability_id>', AvailabilityDeleteView.as_view(), name='therapist-my-availability-delete'),
    path('api/therapists/my/availability/<int:availability_id>/', AvailabilityDeleteView.as_view(), name='therapist-my-availability-delete-slash'),
    path('session/<str:room_id>', video_room_view, name='session-room'),
    path('video-call/', include('video_calls.urls')),
    path('api/realtime-chat/', include('realtime_chat.urls')),
    path('', include('ai_chatbot.urls')),
]
