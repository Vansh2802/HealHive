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
    logger.debug(f'[GoogleCalendar] Resolving token at: {token_path}')

    if not token_path.exists():
        error_msg = (
            f'token.json not found at {token_path}. '
            'Run: cd backend/healhive_backend && python auth.py '
            'after creating credentials.json.'
        )
        logger.error('[GoogleCalendar] %s', error_msg)
        raise FileNotFoundError(error_msg)

    try:
        logger.debug(f'[GoogleCalendar] Loading credentials from {token_path}')
        credentials = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    except ValueError as exc:
        logger.error(f'[GoogleCalendar] Invalid token.json file: {exc}')
        raise GoogleCalendarError(f'Invalid token.json file: {exc}') from exc

    if credentials.valid:
        logger.debug('[GoogleCalendar] Token is valid')
        return credentials

    if credentials.expired and credentials.refresh_token:
        try:
            logger.info('[GoogleCalendar] Token expired, auto-refreshing...')
            credentials.refresh(Request())
            token_path.write_text(credentials.to_json(), encoding='utf-8')
            logger.info('[GoogleCalendar] Token refreshed successfully')
            return credentials
        except RefreshError as exc:
            logger.error(f'[GoogleCalendar] Token refresh failed: {exc}')
            raise GoogleCalendarError(f'Google token refresh failed: {exc}') from exc
        except OSError as exc:
            logger.error(f'[GoogleCalendar] Unable to persist refreshed token: {exc}')
            raise GoogleCalendarError(f'Unable to persist refreshed token.json: {exc}') from exc

    error_msg = 'Token is invalid or missing refresh_token. Run python auth.py again.'
    logger.error(f'[GoogleCalendar] {error_msg}')
    raise GoogleCalendarError(error_msg)


def _ensure_aware(value):
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone=ZoneInfo(TIMEZONE_NAME))
    return value.astimezone(ZoneInfo(TIMEZONE_NAME))


def _format_event_time(value) -> str:
    return _ensure_aware(value).isoformat()


def create_google_meet(start_time, end_time, user_email, therapist_email):
    """Create a Google Calendar event and return the generated Google Meet link.
    
    Args:
        start_time: Session start datetime
        end_time: Session end datetime
        user_email: Patient email
        therapist_email: Therapist email
    
    Returns:
        tuple: (Google Meet link, Google Calendar Event ID)
        
    Raises:
        FileNotFoundError: If token.json is missing
        GoogleCalendarError: If Calendar API fails
    """
    logger.info(f'[GoogleCalendar] Creating Meet for {user_email} with {therapist_email}')
    
    try:
        credentials = get_google_credentials()
    except FileNotFoundError as exc:
        logger.error(f'[GoogleCalendar] {exc}')
        raise

    try:
        logger.debug('[GoogleCalendar] Building Calendar service')
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

        logger.debug(f'[GoogleCalendar] Inserting event into primary calendar')
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
        ).execute()

        meet_link = created_event.get('hangoutLink')
        if not meet_link:
            logger.debug('[GoogleCalendar] hangoutLink not in response, checking entryPoints')
            conference_data = created_event.get('conferenceData', {})
            entry_points = conference_data.get('entryPoints', [])
            for entry_point in entry_points:
                if entry_point.get('entryPointType') == 'video' and entry_point.get('uri'):
                    meet_link = entry_point['uri']
                    logger.debug(f'[GoogleCalendar] Found Meet link from entryPoints')
                    break

        if not meet_link:
            error_msg = 'Google Calendar did not return a Meet link. Check Google account settings.'
            logger.error(f'[GoogleCalendar] {error_msg}')
            logger.debug(f'[GoogleCalendar] Conference data: {created_event.get("conferenceData")}')
            raise GoogleCalendarError(error_msg)

        event_id = created_event.get('id')
        logger.info(f'[GoogleCalendar] Successfully created Meet link with event ID {event_id}')
        return meet_link, event_id
    except OSError as exc:
        logger.exception('Google Calendar token persistence failed')
        raise GoogleCalendarError(f'Google Calendar token error: {exc}') from exc
    except HttpError as exc:
        error_msg = f'Google Calendar API error (HTTP {exc.resp.status}): {exc.content.decode()}'
        logger.error(f'[GoogleCalendar] {error_msg}')
        raise GoogleCalendarError(f'Google Calendar API error: Check API quota and permissions') from exc
    except Exception as exc:
        logger.exception(f'[GoogleCalendar] Unexpected error creating Meet')
        raise GoogleCalendarError(f'Unexpected error: {exc}') from exc