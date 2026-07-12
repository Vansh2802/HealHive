from django.urls import path

from .views import therapist_chat_reports, chat_history


urlpatterns = [
    path('therapist/reports', therapist_chat_reports, name='therapist-chat-reports'),
    path('history', chat_history, name='chat-history'),
]
