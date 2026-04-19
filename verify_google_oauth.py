#!/usr/bin/env python3
"""Verify Google OAuth setup is correct and token.json can be found by both auth.py and Django."""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / 'backend' / 'healhive_backend'
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(backend_path.parent))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healhive_backend.settings')
import django
django.setup()

from django.conf import settings
from google.oauth2.credentials import Credentials

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_django_base_dir():
    """Verify Django BASE_DIR."""
    django_base = Path(settings.BASE_DIR)
    print(f'{BLUE}Django BASE_DIR:{RESET} {django_base}')
    return django_base

def check_auth_py_base_dir():
    """Verify auth.py BASE_DIR."""
    # auth.py is at backend/healhive_backend/auth.py
    # parent.parent gives backend/healhive_backend (same as manage.py)
    auth_file = backend_path / 'auth.py'
    auth_base = auth_file.resolve().parent.parent
    print(f'{BLUE}auth.py BASE_DIR:{RESET} {auth_base}')
    return auth_base

def check_token_paths():
    """Check where token.json should be saved."""
    django_base = check_django_base_dir()
    auth_base = check_auth_py_base_dir()
    
    django_token = django_base / 'token.json'
    auth_token = auth_base / 'token.json'
    
    print(f'{BLUE}Django expects token at:{RESET} {django_token}')
    print(f'{BLUE}auth.py saves token at:{RESET} {auth_token}')
    
    if django_token == auth_token:
        print(f'{GREEN}✅ Paths match! Both use same location.{RESET}')
        return str(django_token)
    else:
        print(f'{RED}❌ Path mismatch! Django and auth.py use different locations.{RESET}')
        return None

def check_token_exists(token_path):
    """Check if token.json exists."""
    token_file = Path(token_path)
    if token_file.exists():
        size = token_file.stat().st_size
        print(f'{GREEN}✅ token.json found at {token_file}{RESET}')
        print(f'   Size: {size} bytes')
        
        # Try to load it
        try:
            credentials = Credentials.from_authorized_user_file(str(token_file), ['https://www.googleapis.com/auth/calendar.events'])
            if credentials.valid:
                print(f'{GREEN}✅ Token is valid{RESET}')
                return True
            elif credentials.expired:
                print(f'{YELLOW}⚠️  Token is expired (but can be refreshed){RESET}')
                return True
            else:
                print(f'{RED}❌ Token is invalid{RESET}')
                return False
        except Exception as e:
            print(f'{RED}❌ Could not load token: {e}{RESET}')
            return False
    else:
        print(f'{RED}❌ token.json not found at {token_file}{RESET}')
        return False

def check_env_variables():
    """Check if Google OAuth env vars are set."""
    client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
    project_id = os.getenv('GOOGLE_PROJECT_ID', '').strip()
    
    print(f'{BLUE}Environment Variables:{RESET}')
    
    checks = [
        ('GOOGLE_CLIENT_ID', client_id),
        ('GOOGLE_CLIENT_SECRET', client_secret),
        ('GOOGLE_PROJECT_ID', project_id),
    ]
    
    all_set = True
    for key, val in checks:
        if val:
            print(f'  {GREEN}✅ {key}{RESET} is set')
        else:
            print(f'  {RED}❌ {key}{RESET} is not set')
            all_set = False
    
    return all_set

def main():
    print(f'\n{BLUE}{"="*60}{RESET}')
    print(f'{BLUE}HealHive Google OAuth Verification{RESET}')
    print(f'{BLUE}{"="*60}{RESET}\n')
    
    # Step 1: Check env variables
    print('Step 1: Checking environment variables...')
    env_ok = check_env_variables()
    print()
    
    # Step 2: Check paths match
    print('Step 2: Checking token.json paths...')
    token_path = check_token_paths()
    print()
    
    if not token_path:
        print(f'{RED}❌ Path mismatch detected! Please re-run backend server.{RESET}\n')
        return False
    
    # Step 3: Check if token exists
    print('Step 3: Checking if token.json exists...')
    token_exists = check_token_exists(token_path)
    print()
    
    # Summary
    print(f'{BLUE}{"="*60}{RESET}')
    print(f'{BLUE}Summary:{RESET}')
    print(f'{BLUE}{"="*60}{RESET}')
    
    if not env_ok:
        print(f'\n{RED}❌ Missing environment variables!{RESET}')
        print(f'   Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET to .env\n')
        return False
    
    if not token_exists:
        print(f'\n{YELLOW}⚠️  token.json not found!{RESET}')
        print(f'   Run: cd backend/healhive_backend && python auth.py')
        print(f'   This will generate token.json via Google OAuth flow\n')
        return False
    
    print(f'\n{GREEN}✅ All checks passed! Google OAuth is properly configured.{RESET}')
    print(f'{GREEN}You can now book sessions and Google Meet links will be generated.{RESET}\n')
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f'{RED}❌ Error during verification: {e}{RESET}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
