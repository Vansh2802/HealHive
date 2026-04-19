"""One-time Google OAuth bootstrap for HealHive Calendar integration.

Paste your Google OAuth values in CLIENT_ID and CLIENT_SECRET below.
Run `python auth.py` once to generate token.json for future API calls.

Security notes:
- credentials.json and token.json are local secret files and must not be committed.
- client_id and client_secret must never be hardcoded in app business logic.
"""

from __future__ import annotations

import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow


SCOPES = ['https://www.googleapis.com/auth/calendar.events']
BASE_DIR = Path(__file__).resolve().parent
CREDENTIALS_FILE = BASE_DIR / 'credentials.json'
TOKEN_FILE = BASE_DIR / 'token.json'

# Paste your client_id and client_secret here.
CLIENT_ID = ''
CLIENT_SECRET = ''


def ensure_credentials_file() -> None:
    """Create credentials.json automatically when it does not exist."""
    if CREDENTIALS_FILE.exists():
        return

    if not CLIENT_ID.strip() or not CLIENT_SECRET.strip():
        raise ValueError(
            'Missing CLIENT_ID or CLIENT_SECRET in auth.py. '
            'Paste your values and run python auth.py once.'
        )

    credentials_payload = {
        'installed': {
            'client_id': CLIENT_ID.strip(),
            'project_id': 'healhive',
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_secret': CLIENT_SECRET.strip(),
            'redirect_uris': ['http://localhost'],
        }
    }
    CREDENTIALS_FILE.write_text(json.dumps(credentials_payload, indent=2), encoding='utf-8')


def main() -> None:
    # credentials.json is stored next to manage.py (backend/healhive_backend).
    ensure_credentials_file()

    if not CREDENTIALS_FILE.exists():
        raise FileNotFoundError('credentials.json not found. Please add your Google OAuth credentials.')

    credentials = None
    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
            print('Token generated successfully')
            return

    flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), SCOPES)
    credentials = flow.run_local_server(port=0)
    TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
    print(f'✅ Token generated successfully at: {TOKEN_FILE}')
    print('📝 Backend will automatically use this token for Google Calendar API calls')


if __name__ == '__main__':
    main()