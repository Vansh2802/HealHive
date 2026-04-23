from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User

from .models import ChatSession


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
