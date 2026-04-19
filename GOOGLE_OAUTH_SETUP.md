# Google OAuth Setup for HealHive Meet Integration

## Overview
This guide walks you through setting up Google OAuth 2.0 to enable automatic Google Meet link generation when users book therapy sessions.

---

## STEP 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project**
3. Name it: `HealHive`
4. Click **Create**
5. Wait for the project to be created, then select it

---

## STEP 2: Enable Google Calendar API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click on it
4. Click **Enable**
5. Wait for it to be enabled (takes a few seconds)

---

## STEP 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth Client ID**
3. If prompted, click **Configure Consent Screen** first:
   - Choose **External** user type
   - Click **Create**
   - Fill in:
     - App name: `HealHive`
     - User support email: `your-email@example.com`
     - Developer contact: `your-email@example.com`
   - Click **Save and Continue**
   - Add scopes: Search for `Google Calendar API` and add it
   - Click **Save and Continue**
   - Click **Back to Dashboard**

4. Now create the OAuth Client ID:
   - Click **Create Credentials** → **OAuth Client ID**
   - Application type: **Desktop application**
   - Name: `HealHive Backend`
   - Click **Create**

5. A popup will show with your credentials:
   - Click **Download JSON** (it downloads `client_secret_....json`)
   - **IMPORTANT**: Do NOT commit this file to GitHub!

---

## STEP 4: Configure HealHive Backend

1. Open the downloaded JSON file
2. Find these values:
   ```json
   "client_id": "xxx.apps.googleusercontent.com",
   "client_secret": "xxx",
   "project_id": "xxx"
   ```

3. Add these to `.env` in project root (`d:/projectPBL/.env`):
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_PROJECT_ID=xxx
   ```

4. Verify `.env` contains:
   ```bash
   VITE_API_URL=http://localhost:8000/api
   VITE_WS_URL=ws://localhost:8000/ws/chat
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_PROJECT_ID=your_project_id
   ```

---

## STEP 5: Generate token.json (Run Once!)

This is the **critical one-time step** that generates the auth token for Google Calendar API.

### Run the Auth Script:

```bash
cd d:\projectPBL\backend\healhive_backend
python auth.py
```

### What happens:
1. Opens your browser → Google login page
2. Sign in with your Google account (or the account that will host events)
3. Grant permissions for **Google Calendar API**
4. Browser redirects to `http://localhost`
5. Script generates `token.json` in `backend/healhive_backend/` directory

### Success Message:
```
✅ Token generated successfully at: d:\projectPBL\backend\healhive_backend\token.json
```

### ⚠️ Important:
- Run this **ONCE** to generate `token.json`
- Do **NOT** commit `token.json` to GitHub (it's in `.gitignore`)
- The token auto-refreshes; you won't need to run this again
- If token expires, just run `python auth.py` again

---

## STEP 6: Verify Setup

### Check token.json exists:
```bash
ls backend/healhive_backend/token.json
# Should output: token.json
```

### Test the integration:

1. **Start backend server:**
   ```bash
   cd backend/healhive_backend
   python manage.py runserver
   ```

2. **Start frontend server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the flow:**
   - Register therapist account
   - Admin approves therapist
   - Therapist adds availability slot
   - Regular user logs in
   - User books a session
   - Check that a **Google Meet link** is returned

4. **Expected response:**
   ```json
   {
     "success": true,
     "session": {
       "id": 1,
       "meeting_link": "https://meet.google.com/abc-def-ghi",
       "...": "..."
     }
   }
   ```

---

## Troubleshooting

### ❌ "token.json not found"

**Solution:**
1. Make sure you ran `python auth.py` successfully
2. Check that `.env` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Run `python auth.py` again

### ❌ "Invalid client"

**Solution:**
1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env`
2. They should NOT have extra spaces or quotes
3. Regenerate credentials in Google Cloud Console if needed

### ❌ Browser doesn't open

**Solution:**
1. `python auth.py` is waiting for input
2. Manually go to: `http://127.0.0.1:XXXXX` (check terminal for URL)
3. Complete the OAuth flow
4. Come back to terminal

### ❌ "Google Calendar API error: 403 Forbidden"

**Solution:**
1. Ensure Google Calendar API is **Enabled** in Cloud Console
2. User account has Google Calendar enabled
3. Try regenerating token: `python auth.py`

### ❌ "conference data not returned"

**Solution:**
1. Ensure correct scopes in OAuth config: `https://www.googleapis.com/auth/calendar.events`
2. Verify `conferenceDataVersion=1` is set in API call
3. Check Google Meet is available in Google Calendar account

---

## Security Notes

### ✅ DO:
- Store `.env` securely
- Add `.env` to `.gitignore` (already done)
- Keep `token.json` out of version control
- Use service account for production

### ❌ DON'T:
- Commit `token.json` to GitHub
- Share `GOOGLE_CLIENT_SECRET` publicly
- Hardcode credentials in code
- Use personal Google account in production

---

## File Structure

After successful setup:

```
backend/healhive_backend/
├── auth.py                    ← Run this ONCE
├── token.json                 ← Generated automatically (DO NOT COMMIT)
├── manage.py
├── settings.py
└── therapy_sessions/
    └── services/
        └── google_calendar.py ← Uses token.json automatically
```

---

## How It Works

1. **User books session** → POST `/api/sessions/book`
2. **Backend loads credentials** → `get_google_credentials()`
3. **Loads token.json** → Reads stored OAuth token
4. **Creates Calendar event** → With `conferenceData` for Meet
5. **Google returns link** → `https://meet.google.com/...`
6. **Saves to session** → User sees Meet link

---

## Next Steps

1. ✅ Set up Google Cloud Project
2. ✅ Get OAuth credentials
3. ✅ Add to `.env`
4. ✅ Run `python auth.py`
5. ✅ Test booking flow
6. ✅ Users get Google Meet links! 🎉

---

## Support

If you encounter issues:

1. Check [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
2. Review logs: `python manage.py runserver` shows detailed errors
3. Verify token isn't expired: `python auth.py` to refresh

---

Generated: April 19, 2026
Last Updated: April 19, 2026
