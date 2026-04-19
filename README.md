# HealHive

HealHive is a mental health support platform with a Django backend and a separate React frontend.

## Layout

- `backend/` - Django project, apps, templates, static assets, and backend env example
- `frontend/` - React frontend source, build output, Vite config, and frontend env example
- `.env` - local environment variables
- `.gitignore` - repository ignore rules
- `README.md` - project documentation

## Setup

### Backend

```powershell
cd backend\healhive_backend
..\..\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

For production static hosting, use the built `frontend/dist` output.

## API Endpoints

The frontend continues to call the existing Django endpoints without changing response behavior.

### Chat

- `POST /api/chatbot/message`
- `GET /ws/chat/<session_id>/`

### Auth

- `POST /api/login`
- `POST /api/register`
- `GET /api/me`

### Sessions

- `GET /api/sessions/`
- `POST /api/sessions/`
- `PATCH /api/sessions/<id>/status`

### Therapists

- `GET /api/therapists`
- `GET /api/therapists/all`
- `GET /api/therapists/:id`
- `PUT /api/therapists/:id/verify`
- `GET /api/therapists/my/availability`
- `POST /api/therapists/my/availability`
- `DELETE /api/therapists/my/availability/:slotId`

### Reports and Admin

- `POST /api/reports`
- `GET /api/reports`
- `GET /api/reports/:id`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/sessions`

## Notes

- `message_id` is included in frontend chat payloads.
- Environment secrets are read from `.env` and are not committed.
- The backend remains functionally unchanged; this is only a structural refactor.

## Google Calendar OAuth Setup

For team-safe setup, keep Google OAuth credentials in environment variables instead of Python files.

1. Add values in your local `.env` (not committed):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_PROJECT_ID=healhive
```

2. Run `python auth.py` once from `backend/healhive_backend/`.

This opens the browser OAuth flow and creates `token.json`. The backend then reuses `token.json` for Google Calendar API calls.

Security notes:
- Do not hardcode `client_id` or `client_secret` in code.
- Do not commit `.env` or `token.json`.
- For production, prefer a managed secret store (Azure Key Vault, GitHub Actions Secrets, etc.) instead of plain `.env` files.
