from django.urls import path
from .views import RegisterView, LoginView, MeView, TherapistsListView, TherapistsAllView, AdminDashboardView, AdminTherapistReviewView, AdminReportReviewView, AdminSessionsView

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('me', MeView.as_view(), name='me'),
    path('therapists', TherapistsListView.as_view(), name='therapists-list'),
    path('therapists/all', TherapistsAllView.as_view(), name='therapists-all'),
    path('admin/dashboard', AdminDashboardView.as_view(), name='admin-dashboard-api'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard-api-slash'),
    path('admin/therapists/<int:therapist_id>/review', AdminTherapistReviewView.as_view(), name='admin-therapist-review-api'),
    path('therapists/<int:therapist_id>/verify', AdminTherapistReviewView.as_view(), name='admin-therapist-verify-api'),
    path('admin/reports/<int:report_id>/review', AdminReportReviewView.as_view(), name='admin-report-review-api'),
    path('admin/sessions', AdminSessionsView.as_view(), name='admin-sessions-api'),
    path('admin/sessions/', AdminSessionsView.as_view(), name='admin-sessions-api-slash'),
]
