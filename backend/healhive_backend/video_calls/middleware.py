"""JWT authentication middleware for Django Channels WebSocket connections.

Security contract
-----------------
* Token MUST be supplied as the ``token`` query-string parameter.
* The token is validated using simplejwt's ``AccessToken`` — the exact same
  library and settings used by DRF HTTP authentication, so there is no
  duplicated validation logic.
* If the token is absent, expired, or otherwise invalid the WebSocket
  handshake is rejected immediately with close code 4001 (authentication
  failure) *before* any consumer ``connect()`` logic runs.
* On success the authenticated ``User`` instance is attached to
  ``scope["user"]`` so consumers can check identity via ``self.scope["user"]``.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from accounts.models import User


@database_sync_to_async
def _resolve_user_from_token(raw_token: str):
    """Return the User for *raw_token*, or raise TokenError/InvalidToken."""
    access = AccessToken(raw_token)          # validates signature + expiry
    user_id = access.get("user_id")
    return User.objects.get(id=user_id)     # raises User.DoesNotExist if gone


class JWTAuthMiddleware:
    """Channels ASGI middleware that enforces JWT authentication on WS connects.

    Rejects unauthenticated connections with WebSocket close code 4001 so that
    no consumer code ever runs without a verified user identity.  This is
    especially important for the real-time chat channel which may carry
    sensitive mental-health data.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Only enforce on WebSocket connections; pass HTTP through untouched.
        if scope.get("type") != "websocket":
            return await self.inner(scope, receive, send)

        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        raw_token = query_params.get("token", [None])[0]

        if not raw_token:
            await _reject_websocket(send, code=4001, reason="Authentication token required")
            return

        try:
            scope["user"] = await _resolve_user_from_token(raw_token)
        except (InvalidToken, TokenError, User.DoesNotExist):
            await _reject_websocket(send, code=4001, reason="Invalid or expired token")
            return

        return await self.inner(scope, receive, send)


async def _reject_websocket(send, *, code: int, reason: str):
    """Complete the WebSocket handshake and immediately close with *code*."""
    await send({"type": "websocket.close", "code": code, "reason": reason})
