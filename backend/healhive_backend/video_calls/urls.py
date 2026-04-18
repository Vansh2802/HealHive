from django.urls import path
from .views import video_room_view

urlpatterns = [
    path('<str:room_id>/', video_room_view, name='video-room'),
]
