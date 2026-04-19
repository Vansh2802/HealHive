# Google OAuth Token.json Fix - Complete Guide

## 🔧 What Was Fixed

### Root Cause: Path Mismatch
- **auth.py** was saving token.json at: `backend/healhive_backend/healhive_backend/token.json`
- **google_calendar.py** was reading from: `backend/healhive_backend/token.json`
- They were looking in **different directories**!

### The Fix
✅ **auth.py now saves token.json at**: `backend/healhive_backend/token.json` (Django root, same as manage.py)
✅ **google_calendar.py reads from**: `backend/healhive_backend/token.json` (same location)
✅ Both use absolute paths from Django BASE_DIR
✅ Better logging and error messages

---

## 📋 Step-by-Step Fix Instructions

### Step 1: Verify Path Consistency (Optional but Recommended)
```bash
cd d:\projectPBL
python verify_google_oauth.py
```

Expected output:
```
✅ Django BASE_DIR: d:\projectPBL\backend\healhive_backend
✅ auth.py BASE_DIR: d:\projectPBL\backend\healhive_backend
✅ Paths match! Both use same location.
```

### Step 2: Generate Google OAuth Token
```bash
cd backend/healhive_backend
python auth.py
```

Expected output:
```
📁 Token will be saved to: d:\projectPBL\backend\healhive_backend\token.json
🌐 Starting Google OAuth flow... (browser will open)
✅ Token generated successfully at: d:\projectPBL\backend\healhive_backend\token.json
📝 Backend will automatically use this token for Google Calendar API calls
```

### Step 3: Verify Token Was Created
```bash
# Check token exists
ls backend/healhive_backend/token.json

# Verify it's not empty (should be > 1000 bytes)
wc -c backend/healhive_backend/token.json
```

### Step 4: Restart Backend Server
```bash
# Kill existing server (Ctrl+C in terminal)
# Then restart
cd backend/healhive_backend
python manage.py runserver
```

You should see in logs:
```
Starting development server at http://127.0.0.1:8000/
```

### Step 5: Test Google Meet Integration
1. Register therapist and get approved
2. Therapist adds availability slot
3. User books session
4. ✅ Check response includes `meeting_link`: `https://meet.google.com/...`

---

## 🆘 Troubleshooting

### ❌ "token.json not found"

**Check 1: Verify token was created**
```bash
ls backend/healhive_backend/token.json
```

If NOT found:
- Run: `python auth.py` again
- Make sure browser OAuth flow completes successfully
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env

**Check 2: Verify paths match**
```bash
python verify_google_oauth.py
```

If paths don't match:
- Restart backend server
- Clear Python cache: `rm -r __pycache__`
- Try again

**Check 3: Check backend logs**
Backend should log: `[GoogleCalendar] Resolving token at: ...`

### ❌ "Invalid token.json"

**Solution:**
1. Delete old token: `rm backend/healhive_backend/token.json`
2. Regenerate: `python auth.py`
3. Restart server

### ❌ "Google token refresh failed"

**Solution:**
- Token needs to be regenerated
- Run: `python auth.py`
- Or delete and let it auto-refresh on next request

### ❌ "Google Calendar API error: 403 Forbidden"

**Causes:**
1. Google Calendar API not enabled in Cloud Console
2. Account doesn't have Google Calendar
3. Insufficient API quota

**Solutions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Search for "Google Calendar API"
3. Click "Enable"
4. Regenerate token: `python auth.py`

### ❌ Token exists but still getting error

**Full diagnostic:**
```bash
cd backend/healhive_backend
python -c "
from therapy_sessions.services.google_calendar import get_google_credentials
try:
    creds = get_google_credentials()
    print('✅ Credentials loaded successfully')
    print(f'  Valid: {creds.valid}')
    print(f'  Expired: {creds.expired}')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

---

## 📊 Path Structure After Fix

```
backend/
  healhive_backend/           ← Django root (where manage.py is)
    ├── manage.py
    ├── auth.py              ← Saves token here ↓
    ├── token.json           ← ✅ Generated here (by auth.py)
    ├── healhive_backend/
    │   ├── settings.py      ← Django BASE_DIR points to parent
    │   ├── wsgi.py
    │   └── asgi.py
    └── therapy_sessions/
        └── services/
            └── google_calendar.py  ← Reads from parent (token.json)
```

---

## 🔍 Key Changes Made

### auth.py
```python
# OLD (WRONG):
BASE_DIR = Path(__file__).resolve().parent  # Points to healhive_backend/
TOKEN_FILE = BASE_DIR / 'token.json'  # Saves at healhive_backend/healhive_backend/token.json

# NEW (CORRECT):
BASE_DIR = Path(__file__).resolve().parent.parent  # Points to backend/healhive_backend/
TOKEN_FILE = BASE_DIR / 'token.json'  # Saves at backend/healhive_backend/token.json
```

### google_calendar.py
```python
# Already correct, using Django settings.BASE_DIR
def _resolve_token_path() -> Path:
    return Path(settings.BASE_DIR) / 'token.json'
```

Both now use the same location ✅

---

## 📝 Enhanced Logging

### When auth.py runs:
```
📁 Token will be saved to: d:\projectPBL\backend\healhive_backend\token.json
🔍 Found existing token.json, checking validity...
✅ Token is valid, no refresh needed
```

### When booking (in backend logs):
```
[BookSessionView] Booking request from user@test.com
[BookSessionView] Session created: 1
[BookSessionView] Creating Google Meet for session 1
[GoogleCalendar] Creating Meet for user@test.com with therapist@test.com
[GoogleCalendar] Resolving token at: d:\projectPBL\backend\healhive_backend\token.json
[GoogleCalendar] Loading credentials from token.json
[GoogleCalendar] Building Calendar service
[GoogleCalendar] Inserting event into primary calendar
[GoogleCalendar] Successfully created Meet link
[BookSessionView] Google Meet created: https://meet.google.com/abc-def-ghi
[BookSessionView] Booking completed successfully for user@test.com
```

---

## ✅ Success Criteria

Your system is working correctly when:

- [ ] `python verify_google_oauth.py` shows all ✅
- [ ] token.json exists at `backend/healhive_backend/token.json`
- [ ] Backend logs show `[GoogleCalendar]` messages
- [ ] Booking API returns `meeting_link` with valid Google Meet URL
- [ ] Browser can open the Meet link and see conference room

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Verify setup | `python verify_google_oauth.py` |
| Generate token | `cd backend/healhive_backend && python auth.py` |
| Check token exists | `ls backend/healhive_backend/token.json` |
| Test credentials | `python -c "from therapy_sessions.services.google_calendar import get_google_credentials; get_google_credentials()"` |
| View backend logs | Run server: `python manage.py runserver` |
| Debug path issue | Check both auth.py and google_calendar.py BASE_DIR values |

---

## 📞 Still Having Issues?

1. **Check `.env` has all required vars:**
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_PROJECT_ID=xxx
   ```

2. **Run verification script:**
   ```bash
   python verify_google_oauth.py
   ```

3. **Check backend logs for `[GoogleCalendar]` messages**

4. **Ensure Google Calendar API is enabled** in Google Cloud Console

5. **If stuck, regenerate token:**
   ```bash
   rm backend/healhive_backend/token.json
   python auth.py
   ```

---

Generated: April 19, 2026
Status: Production-grade fix applied ✅
