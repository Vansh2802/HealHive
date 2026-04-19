"""One-time Google OAuth bootstrap for HealHive Calendar integration.

Set your Google OAuth values in environment variables.
Run `python auth.py` once to generate token.json for future API calls.

Security notes:
- token.json is a local secret file and must not be committed.
- client_id and client_secret must never be hardcoded in app business logic.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow


SCOPES = ['https://www.googleapis.com/auth/calendar.events']
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent.parent
TOKEN_FILE = BASE_DIR / 'token.json'

# Load env from both repository root and backend folder.
load_dotenv(ROOT_DIR / '.env')
load_dotenv(BASE_DIR / '.env')


def _build_client_config() -> dict:
    """Build Google OAuth client config from environment variables."""
    client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
    project_id = os.getenv('GOOGLE_PROJECT_ID', 'healhive').strip() or 'healhive'

    if not client_id or not client_secret:
        raise ValueError(
            'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env. '
            'Set both values and run python auth.py once.'
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


def main() -> None:
    client_config = _build_client_config()

    credentials = None
    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
            print('Token generated successfully')
            return

            # Run browser OAuth flow once; token.json is reused by backend service code.
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    credentials = flow.run_local_server(port=0)
    TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
    print('Token generated successfully')


if __name__ == '__main__':
    main()