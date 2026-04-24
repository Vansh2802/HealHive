# HealHive

HealHive is a full-stack mental wellness platform that combines:

- Anonymous guided chat and therapist escalation
- Role-based access for users, therapists, and admins
- Session booking and therapist workflow management
- Real-time communication using Django Channels and WebSockets

The project uses a Django backend and a React + Vite frontend.

## Tech Stack

### Backend

- Django 5
- Django REST Framework
- Django Channels
- Daphne (ASGI server)
- Redis (channel layer)
- SQLite (default local DB)
- Optional PostgreSQL support via environment config

### Frontend

- React 18
- React Router
- Vite 6
- Tailwind CSS
- Framer Motion

## Repository Structure

```text
project root
|- backend/
|  |- healhive_backend/
|     |- manage.py
|     |- requirements.txt
|     |- healhive_backend/      # Django project settings, ASGI/WSGI
|     |- accounts/              # Authentication, therapist/admin endpoints
|     |- therapy_sessions/      # Session and booking logic
|     |- realtime_chat/         # WebSocket consumers and chat services
|     |- video_calls/           # Video-call related APIs and routing
|     |- ai_chatbot/            # AI chatbot flows and models
|- frontend/
|  |- index.html
|  |- package.json
|  |- vite.config.js
|  |- src/
|     |- App.jsx
|     |- main.jsx
|     |- pages/
|     |- components/
|     |- services/
|- docker-compose.yml
|- README.md
```

## Prerequisites

- Python 3.11+ (3.12 recommended)
- Node.js 18+
- npm 9+
- Redis (Docker or local install)

## Environment Variables

Create a root `.env` file (or use app-level `.env` as needed). Common values:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOWED_WEBSOCKET_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

REDIS_URL=redis://127.0.0.1:6379/1
CHANNEL_LAYER_BACKEND=redis

MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=healhive_chat
```

Notes:

- Do not commit `.env`, `token.json`, or other secrets.
- Google OAuth/Calendar credentials should also live in environment variables.

## Local Setup

## 1) Backend Setup

From project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\healhive_backend\requirements.txt
```

Run migrations:

```powershell
cd backend\healhive_backend
python manage.py migrate
```

## 2) Frontend Setup

From project root:

```powershell
cd frontend
npm install
```

## 3) Start Redis

If using Docker:

```powershell
docker start healhive_redis
```

If the container does not exist yet, create one:

```powershell
docker run -d --name healhive_redis -p 6379:6379 redis:7-alpine
```

## 4) Start Backend (ASGI, required for WebSockets)

Use Daphne on port 8000:

```powershell
cd backend\healhive_backend
..\..\.venv\Scripts\python.exe -m daphne -b 127.0.0.1 -p 8000 healhive_backend.asgi:application
```

Important:

- For chat/WebSocket features, prefer Daphne over `manage.py runserver`.
- HTTP API remains available at `http://127.0.0.1:8000`.

## 5) Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend should be available at:

- `http://127.0.0.1:5173`
- `http://localhost:5173`

## Running the App

Recommended startup order:

1. Redis
2. Backend (Daphne)
3. Frontend (Vite)

## Core User Flows

- Anonymous chat at `/chat`
- Escalation path to therapist support
- Auth routes: `/login`, `/signup`
- User booking route: `/book-session` (also available through `/user/book`)
- Therapist onboarding and dashboard routes
- Admin review and therapist approval workflows

## API Overview

### Authentication

- `POST /api/login`
- `POST /api/register`
- `GET /api/me`

### Sessions

- `GET /api/sessions/`
- `POST /api/sessions/`
- `PATCH /api/sessions/<id>/status`

### Therapists and Admin

- `GET /api/therapists`
- `GET /api/therapists/all`
- `GET /api/therapists/<id>`
- `PUT /api/therapists/<id>/verify`

### Chat

- WebSocket endpoint: `/ws/chat/<session_id>/`

## Development Commands

From `frontend`:

```powershell
npm run dev
npm run build
npm run preview
```

From `backend/healhive_backend`:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py shell
```

ASGI runtime:

```powershell
..\..\.venv\Scripts\python.exe -m daphne -b 127.0.0.1 -p 8000 healhive_backend.asgi:application
```

## Troubleshooting

### Frontend shows 404 on port 5173

- Ensure you are in the `frontend` directory before running `npm run dev`.
- Ensure `frontend/index.html` exists with `div id="root"` and `src/main.jsx` script.
- Confirm Vite is bound to `127.0.0.1:5173`.

### Chat says Unable to reconnect to chat service

- Ensure backend is running with Daphne (ASGI), not only Django runserver.
- Ensure Redis is running and reachable at `127.0.0.1:6379`.
- Ensure websocket origin allowlist includes `http://localhost:5173` and `http://127.0.0.1:5173`.

### Redis connection issues

- Check running containers: `docker ps`
- Verify port mapping if using host Redis URL: `6379:6379`
- Confirm `REDIS_URL` matches your runtime.

## Security Notes

- Keep secrets out of source control.
- Use strong JWT signing keys in production.
- Restrict `DJANGO_ALLOWED_HOSTS`, CORS, and websocket origins for production domains.

## Additional Project Docs

The repository includes implementation and flow docs for specific modules and fixes, such as:

- `ARCHITECTURE.md`
- `QUICK_START.md`
- `E2E_TESTING_GUIDE.md`
- `GOOGLE_OAUTH_SETUP.md`
- `JOIN_GOOGLE_MEET_GUIDE.md`

## Contributing

1. Pull latest changes.
2. Create or switch to your working branch.
3. Run backend and frontend locally.
4. Validate critical flows (auth, chat, booking, therapist/admin).
5. Open PR with clear change summary and test notes.

## License

No license file is currently defined in this repository.
