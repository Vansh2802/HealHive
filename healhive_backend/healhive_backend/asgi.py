import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healhive_backend.settings')

from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from video_calls.middleware import JWTAuthMiddleware
from healhive_backend.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        'http': django_asgi_app,
        'websocket': AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                JWTAuthMiddleware(
                    URLRouter(websocket_urlpatterns)
                )
            )
        ),
    }
)
