from django.urls import path
from .views import (
    signup_view,
    EmailLoginView,
    logout_view,
    user_dashboard,
    chatbot_home,
    therapist_dashboard,
    admin_dashboard,
    reports_view,
    chat_message_api,
    conversation_messages_api,
    public_chat_message_api,
)

urlpatterns = [
    path('auth/signup/', signup_view, name='chatbot-signup'),
    path('auth/login/', EmailLoginView.as_view(), name='chatbot-login'),
    path('auth/logout/', logout_view, name='chatbot-logout'),
    path('user/dashboard/', user_dashboard, name='user-dashboard'),
    path('chatbot/', chatbot_home, name='chatbot-home'),
    path('therapist/dashboard/', therapist_dashboard, name='therapist-dashboard'),
    path('admin-panel/dashboard/', admin_dashboard, name='admin-dashboard'),
    path('chatbot/reports/', reports_view, name='chatbot-reports'),
    path('chatbot/api/message/', chat_message_api, name='chatbot-message-api'),
    path('api/chatbot/message', public_chat_message_api, name='public-chatbot-message-api'),
    path('chatbot/api/conversations/<int:conversation_id>/messages/', conversation_messages_api, name='chatbot-conversation-messages-api'),
]
