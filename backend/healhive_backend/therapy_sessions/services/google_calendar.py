"""Google Calendar integration for HealHive therapy sessions.

Run backend/healhive_backend/auth.py once after setting GOOGLE_CLIENT_ID and
GOOGLE_CLIENT_SECRET in .env. That generates token.json, which is reused
automatically so users do not re-authenticate on every booking.

Never commit token.json to GitHub.
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone
from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar.events']
TIMEZONE_NAME = 'Asia/Kolkata'


class GoogleCalendarError(RuntimeError):
    """Raised when the Google Calendar API cannot complete the request."""


def _resolve_token_path() -> Path:
    return Path(settings.BASE_DIR) / 'token.json'


def get_google_credentials() -> Credentials:
    """Load and refresh the stored token for Google Calendar access.

    token.json must already exist. Run backend/healhive_backend/auth.py once to
    create it after setting GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
    """

    token_path = _resolve_token_path()

    if not token_path.exists():
        raise FileNotFoundError('token.json not found. Run python auth.py once after setting GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.')

    try:
        credentials = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    except ValueError as exc:
        raise GoogleCalendarError(f'Invalid token.json file: {exc}') from exc

    if credentials.valid:
        return credentials

    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
            token_path.write_text(credentials.to_json(), encoding='utf-8')
            return credentials
        except RefreshError as exc:
            raise GoogleCalendarError(f'Google token refresh failed: {exc}') from exc
        except OSError as exc:
            raise GoogleCalendarError(f'Unable to persist refreshed token.json: {exc}') from exc

    raise GoogleCalendarError('Token is invalid. Run python auth.py once')


def _ensure_aware(value):
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone=ZoneInfo(TIMEZONE_NAME))
    return value.astimezone(ZoneInfo(TIMEZONE_NAME))


def _format_event_time(value) -> str:
    return _ensure_aware(value).isoformat()


def create_google_meet(start_time, end_time, user_email, therapist_email):
    """Create a Google Calendar event and return the generated Google Meet link."""

    credentials = get_google_credentials()

    try:
        service = build('calendar', 'v3', credentials=credentials, cache_discovery=False)

        event = {
            'summary': 'HealHive Therapy Session',
            'start': {
                'dateTime': _format_event_time(start_time),
                'timeZone': TIMEZONE_NAME,
            },
            'end': {
                'dateTime': _format_event_time(end_time),
                'timeZone': TIMEZONE_NAME,
            },
            'attendees': [
                {'email': user_email},
                {'email': therapist_email},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': uuid.uuid4().hex,
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'},
                }
            },
        }

        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
        ).execute()

        meet_link = created_event.get('hangoutLink')
        if not meet_link:
            conference_data = created_event.get('conferenceData', {})
            entry_points = conference_data.get('entryPoints', [])
            for entry_point in entry_points:
                if entry_point.get('entryPointType') == 'video' and entry_point.get('uri'):
                    meet_link = entry_point['uri']
                    break

        if not meet_link:
            raise GoogleCalendarError('Google Calendar did not return a Meet link.')

        return meet_link
    except HttpError as exc:
        logger.exception('Google Calendar API error')
        raise GoogleCalendarError(f'Google Calendar API error: {exc}') from exc
    except OSError as exc:
        logger.exception('Google Calendar token persistence failed')
        raise GoogleCalendarError(f'Google Calendar token error: {exc}') from exc