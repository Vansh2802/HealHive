from django.urls import path

from .views import therapist_chat_reports


urlpatterns = [
    path('therapist/reports', therapist_chat_reports, name='therapist-chat-reports'),
]
