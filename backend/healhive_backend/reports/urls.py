from django.urls import path
from .views import ReportsView, ReportDetailView, AdminTherapyRequestListView, AdminAssignTherapistView

urlpatterns = [
    path('', ReportsView.as_view(), name='reports'),
    path('<int:report_id>', ReportDetailView.as_view(), name='report-detail'),
    path('admin/therapy-requests', AdminTherapyRequestListView.as_view(), name='admin-therapy-requests'),
    path('admin/therapy-requests/<int:request_id>/assign', AdminAssignTherapistView.as_view(), name='admin-assign-therapist'),
]
