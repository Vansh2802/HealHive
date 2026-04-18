import os
from pathlib import Path

from dotenv import load_dotenv

try:
    import anthropic
except Exception:
    anthropic = None


BASE_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BASE_DIR.parent

# Load both workspace-level and backend-local env files for flexibility.
load_dotenv(ROOT_DIR / '.env')
load_dotenv(BASE_DIR / '.env')


def get_anthropic_api_key() -> str | None:
    api_key = os.getenv('ANTHROPIC_API_KEY')
    return api_key.strip() if api_key else None


def get_anthropic_client():
    api_key = get_anthropic_api_key()
    if not api_key or anthropic is None:
        return None
    return anthropic.Anthropic(api_key=api_key)
