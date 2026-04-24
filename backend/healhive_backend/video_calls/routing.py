from django.urls import path
from .consumers import VideoCallConsumer

websocket_urlpatterns = [
    path('ws/video-call/<str:room_id>/', VideoCallConsumer.as_asgi()),
]
