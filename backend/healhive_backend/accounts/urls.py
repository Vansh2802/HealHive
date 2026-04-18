from django.urls import path
from .views import RegisterView, LoginView, MeView, TherapistsListView, AdminDashboardView, AdminTherapistReviewView, AdminReportReviewView

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('me', MeView.as_view(), name='me'),
    path('therapists', TherapistsListView.as_view(), name='therapists-list'),
    path('admin/dashboard', AdminDashboardView.as_view(), name='admin-dashboard-api'),
    path('admin/therapists/<int:therapist_id>/review', AdminTherapistReviewView.as_view(), name='admin-therapist-review-api'),
    path('admin/reports/<int:report_id>/review', AdminReportReviewView.as_view(), name='admin-report-review-api'),
]
