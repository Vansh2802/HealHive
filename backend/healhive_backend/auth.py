"""One-time Google OAuth bootstrap for HealHive Calendar integration.

Run python auth.py once to generate token.json for future API calls.

Security notes:
- credentials.json and token.json are local secret files and must not be committed.
- client_id and client_secret must never be hardcoded in app business logic.
"""

from __future__ import annotations

import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow


SCOPES = ['https://www.googleapis.com/auth/calendar.events']
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent.parent
CREDENTIALS_FILE = BASE_DIR / 'credentials.json'
TOKEN_FILE = BASE_DIR / 'token.json'

load_dotenv(ROOT_DIR / '.env')
load_dotenv(BASE_DIR / '.env')


def _build_client_config() -> dict:
    client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
    project_id = os.getenv('GOOGLE_PROJECT_ID', 'healhive').strip() or 'healhive'

    if not client_id or not client_secret:
        raise ValueError(
            'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.'
        )

    return {
        'installed': {
            'client_id': client_id,
            'project_id': project_id,
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_secret': client_secret,
            'redirect_uris': ['http://localhost'],
        }
    }


def ensure_credentials_file() -> None:
    """Create credentials.json automatically when it does not exist."""
    if CREDENTIALS_FILE.exists():
        return

    credentials_payload = _build_client_config()
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