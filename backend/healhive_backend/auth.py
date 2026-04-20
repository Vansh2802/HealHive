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

# Load env
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


def main() -> None:
    client_config = _build_client_config()
    credentials = None

    print(f'Looking for token at: {TOKEN_FILE}')
    print(f'Token exists: {TOKEN_FILE.exists()}')
    print(f'Current working directory: {Path.cwd()}')
    if Path.cwd() != BASE_DIR:
        print(f'Note: Recommended run location is: {BASE_DIR}')

    # STEP 1: Load existing token
    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        print('Reusing existing token.json')

    # STEP 2: Refresh if expired
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
        print('✅ Token refreshed successfully')
        return

    if credentials and credentials.valid:
        print('✅ Existing token is valid. No new OAuth flow needed.')
        return

    # STEP 3: If no valid token → run OAuth
    if not credentials or not credentials.valid:
        flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        credentials = flow.run_local_server(port=0)

        TOKEN_FILE.write_text(credentials.to_json(), encoding='utf-8')
        print(f'✅ Token generated successfully at: {TOKEN_FILE}')


if __name__ == '__main__':
    main()