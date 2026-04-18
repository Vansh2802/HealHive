from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, render
from therapy_sessions.models import TherapySession


def video_room_view(request, room_id):
    raw_header = request.META.get('HTTP_AUTHORIZATION', '')
    query_token = request.GET.get('token')

    user = None
    auth = JWTAuthentication()
    try:
        if raw_header.startswith('Bearer '):
            validated = auth.get_validated_token(raw_header.split(' ', 1)[1])
            user = auth.get_user(validated)
        elif query_token:
            validated = auth.get_validated_token(query_token)
            user = auth.get_user(validated)
    except (InvalidToken, TokenError):
        return HttpResponseForbidden('Invalid or expired token')

    if user is None or not user.is_authenticated:
        return HttpResponseForbidden('Unauthorized')

    session = get_object_or_404(
        TherapySession.objects.select_related('therapist__user', 'patient__user'),
        room_id=room_id,
    )

    allowed_ids = {session.therapist.user_id, session.patient.user_id}
    if user.id not in allowed_ids:
        return HttpResponseForbidden('Unauthorized for this room')

    return render(
        request,
        'video_call.html',
        {
            'room_id': session.room_id,
            'session_id': session.id,
            'display_name': user.full_name,
            'token': query_token or raw_header.replace('Bearer ', ''),
        },
    )
