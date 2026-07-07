from pathlib import Path
import os
import socket
from datetime import timedelta
from urllib.parse import unquote, urlparse
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
load_dotenv(ROOT_DIR / '.env')
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'healhive-dev-secret-change-me')
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
for frontend_host in ['localhost', '127.0.0.1']:
    if frontend_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(frontend_host)

INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'accounts',
    'therapy_sessions',
    'reports',
    'video_calls',
    'realtime_chat',
    'ai_chatbot',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'healhive_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'healhive_backend.wsgi.application'
ASGI_APPLICATION = 'healhive_backend.asgi.application'

def _build_database_config():
    database_url = os.getenv('DATABASE_URL', '').strip()

    if database_url:
        parsed_url = urlparse(database_url)
        if parsed_url.scheme in {'postgres', 'postgresql'}:
            return {
                'default': {
                    'ENGINE': 'django.db.backends.postgresql',
                    'NAME': parsed_url.path.lstrip('/'),
                    'USER': unquote(parsed_url.username or ''),
                    'PASSWORD': unquote(parsed_url.password or ''),
                    'HOST': parsed_url.hostname or '127.0.0.1',
                    'PORT': str(parsed_url.port or 5432),
                    'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '60')),
                    'OPTIONS': {
                        'sslmode': os.getenv('POSTGRES_SSLMODE', 'prefer'),
                    },
                }
            }

    postgres_name = os.getenv('POSTGRES_DB', '').strip()
    if postgres_name:
        return {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': postgres_name,
                'USER': os.getenv('POSTGRES_USER', '').strip(),
                'PASSWORD': os.getenv('POSTGRES_PASSWORD', '').strip(),
                'HOST': os.getenv('POSTGRES_HOST', '127.0.0.1').strip(),
                'PORT': os.getenv('POSTGRES_PORT', '5432').strip(),
                'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '60')),
                'OPTIONS': {
                    'sslmode': os.getenv('POSTGRES_SSLMODE', 'prefer'),
                },
            }
        }

    return {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


DATABASES = _build_database_config()

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
LOGIN_URL = '/auth/login/'
LOGIN_REDIRECT_URL = '/chatbot/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5176,http://127.0.0.1:5176',
).split(',')
CSRF_TRUSTED_ORIGINS = os.getenv(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5176,http://127.0.0.1:5176',
).split(',')
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https?://localhost:\d+$',
    r'^https?://127\.0\.0\.1:\d+$',
]
CORS_ALLOW_CREDENTIALS = True

CHANNEL_LAYER_BACKEND = os.getenv(
    'CHANNEL_LAYER_BACKEND',
    'redis',
).strip().lower()


def _can_connect_redis(redis_url: str) -> bool:
    try:
        parsed = urlparse(redis_url)
        host = parsed.hostname or '127.0.0.1'
        port = int(parsed.port or 6379)
        with socket.create_connection((host, port), timeout=0.8):
            return True
    except Exception:
        return False

redis_url = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')
if CHANNEL_LAYER_BACKEND == 'redis' and _can_connect_redis(redis_url):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [redis_url],
                'capacity': int(os.getenv('CHANNEL_LAYER_CAPACITY', '1500')),
                'expiry': int(os.getenv('CHANNEL_LAYER_EXPIRY', '60')),
                'group_expiry': int(os.getenv('CHANNEL_GROUP_EXPIRY', '86400')),
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

MONGODB_URI = os.getenv('MONGODB_URI', os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017'))
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'healhive_chat')
MONGODB_MESSAGES_COLLECTION = os.getenv('MONGODB_MESSAGES_COLLECTION', 'messages')
MONGODB_MAX_POOL_SIZE = int(os.getenv('MONGODB_MAX_POOL_SIZE', '100'))
MONGODB_MIN_POOL_SIZE = int(os.getenv('MONGODB_MIN_POOL_SIZE', '0'))
MONGODB_SERVER_SELECTION_TIMEOUT_MS = int(os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '5000'))

APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://127.0.0.1:8000')

EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', '1') == '1'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'no-reply@healhive.com')

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s %(levelname)s [%(name)s] %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        },
    },
    'loggers': {
        'realtime_chat': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.channels': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}
