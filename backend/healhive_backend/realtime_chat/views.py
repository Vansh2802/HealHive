import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from accounts.models import User

from .models import ChatSession

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def therapist_chat_reports(request):
    if request.user.role != User.ROLE_THERAPIST:
        return Response({'success': False, 'error': 'Therapist access required.'}, status=403)

    sessions = (
        ChatSession.objects.filter(completed=True, report_visible_to_therapist=True)
        .exclude(final_report={})
        .order_by('-severity_score', '-updated_at')[:200]
    )

    reports = []
    for session in sessions:
        report = dict(session.final_report or {})
        reports.append(
            {
                'id': session.id,
                'session_id': session.session_id,
                'anonymous_user_id': session.anonymous_user_id,
                'severity_score': session.severity_score,
                'severity_level': session.severity_level,
                'current_stage': session.current_stage,
                'created_at': session.created_at,
                'updated_at': session.updated_at,
                'report': report,
            }
        )

    return Response({'success': True, 'reports': reports})


@api_view(['GET'])
@permission_classes([AllowAny])
def chat_history(request):
    """
    Task 7: GET /api/realtime-chat/history?session_id=<id>&limit=<n>

    Returns the last N messages for a session from MongoDB so the frontend can
    replay context after a WebSocket reconnect.  Open to unauthenticated
    requests because the chat is anonymous — session_id itself is the access
    credential (it is a cryptographically random UUID-based string).
    """
    session_id = (request.GET.get('session_id') or '').strip()
    if not session_id:
        return Response({'success': False, 'error': 'session_id is required.'}, status=400)

    try:
        limit = max(1, min(50, int(request.GET.get('limit', 10))))
    except (TypeError, ValueError):
        limit = 10

    try:
        from pymongo import MongoClient
        from django.conf import settings

        # Use a synchronous PyMongo client for the REST view (Motor is async-only)
        client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=3000,
        )
        collection = client[settings.MONGODB_DATABASE][settings.MONGODB_MESSAGES_COLLECTION]
        cursor = (
            collection
            .find({'session_id': session_id}, {'_id': 0})
            .sort('timestamp', -1)
            .limit(limit)
        )
        messages = list(cursor)
        messages.reverse()  # Return in chronological order
        client.close()

        # Serialize datetime objects to ISO strings for JSON
        for msg in messages:
            if 'timestamp' in msg and hasattr(msg['timestamp'], 'isoformat'):
                msg['timestamp'] = msg['timestamp'].isoformat()

        return Response({'success': True, 'messages': messages})

    except Exception as exc:
        logger.warning('[chat_history] Failed to fetch history session_id=%s: %s', session_id, exc)
        return Response({'success': True, 'messages': []})

