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

To enable Google Meet generation, create a manual `credentials.json` file in the backend root directory, the same folder as `manage.py`:

`backend/healhive_backend/credentials.json`

Do not paste `client_id` or `client_secret` into Python files. Download the OAuth client JSON from Google Cloud Console, then place it in that path. The file should never be committed to GitHub, and it is already ignored by `.gitignore`.

Example structure:

```json
{
	"installed": {
		"client_id": "YOUR_CLIENT_ID_HERE",
		"project_id": "your_project_name",
		"auth_uri": "https://accounts.google.com/o/oauth2/auth",
		"token_uri": "https://oauth2.googleapis.com/token",
		"client_secret": "YOUR_CLIENT_SECRET_HERE",
		"redirect_uris": ["http://localhost"]
	}
}
```

Run `python auth.py` once from `backend/healhive_backend/`. That script opens a browser, creates `token.json`, and the backend reuses it automatically for future Google Calendar API calls.
