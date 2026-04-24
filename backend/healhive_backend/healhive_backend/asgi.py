import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healhive_backend.settings')

from channels.auth import AuthMiddlewareStack
from channels.security.websocket import OriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from video_calls.middleware import JWTAuthMiddleware
from healhive_backend.routing import websocket_urlpatterns

ALLOWED_WEBSOCKET_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'ALLOWED_WEBSOCKET_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5176,http://127.0.0.1:5176',
    ).split(',')
    if origin.strip()
]

application = ProtocolTypeRouter(
    {
        'http': django_asgi_app,
        'websocket': OriginValidator(
            AuthMiddlewareStack(
                JWTAuthMiddleware(
                    URLRouter(websocket_urlpatterns)
                )
            )
            ,
            ALLOWED_WEBSOCKET_ORIGINS,
        ),
    }
)
