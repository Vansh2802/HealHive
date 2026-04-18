from realtime_chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from video_calls.routing import websocket_urlpatterns as video_websocket_urlpatterns

# Aggregate websocket routes in one place so ASGI can route both video and chat.
websocket_urlpatterns = [
    *video_websocket_urlpatterns,
    *chat_websocket_urlpatterns,
]
