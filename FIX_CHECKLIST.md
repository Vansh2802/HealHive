# Google OAuth Fix - Quick Start

## ✅ What Was Fixed

**Problem:** "token.json not found" error
**Root Cause:** Path mismatch (auth.py and google_calendar.py used different directories)
**Status:** ✅ **FIXED** - Both now use the same Django BASE_DIR

---

## 🚀 Action Items (In Order)

### 1️⃣ Verify the Fix (2 minutes)
```bash
cd d:\projectPBL
python verify_google_oauth.py
```

**Expected:** All ✅ checks pass

### 2️⃣ Generate Google OAuth Token (5 minutes)
```bash
cd backend/healhive_backend
python auth.py
# Browser will open → Sign in → token.json generated
```

**Expected:** `✅ Token generated successfully at: ...token.json`

### 3️⃣ Verify Token Location (30 seconds)
```bash
ls backend/healhive_backend/token.json
# Should show file exists
```

### 4️⃣ Restart Backend Server
```bash
# Kill existing server (Ctrl+C)
cd backend/healhive_backend
python manage.py runserver
```

### 5️⃣ Test Google Meet Integration (5 minutes)

1. In browser: `http://localhost:5175/`
2. Register therapist → Admin approves
3. Therapist adds availability slot
4. User logs in and books session
5. ✅ Check response has `meeting_link`: `https://meet.google.com/...`

---

## 🆘 If Something Goes Wrong

| Error | Fix |
|-------|-----|
| "token.json not found" | Run `python verify_google_oauth.py` to diagnose |
| Paths don't match | Restart backend server |
| Token invalid | Run `python auth.py` again |
| API error (403) | Enable Google Calendar API in Cloud Console |

---

## 📋 Quick Checklist

- [ ] Run `verify_google_oauth.py` → All ✅
- [ ] Run `auth.py` → token.json created ✅
- [ ] token.json exists at `backend/healhive_backend/token.json` ✅
- [ ] Backend server restarted ✅
- [ ] Complete booking flow tested ✅
- [ ] Google Meet link returned ✅

---

## 📊 Architecture After Fix

```
backend/healhive_backend/                      ← Django root (manage.py is here)
  ├── auth.py                                  ← Generates token here
  ├── token.json                               ← ✅ Saved here (by auth.py)
  ├── manage.py
  └── therapy_sessions/services/
      └── google_calendar.py                   ← Reads from same location
```

---

## 🎯 Success = All These Work

- ✅ `verify_google_oauth.py` shows all green
- ✅ token.json exists at correct location
- ✅ Backend logs show `[GoogleCalendar]` messages
- ✅ Booking returns Google Meet link
- ✅ No "token.json not found" errors

---

**Need more details?** See:
- `TOKEN_FIX_SUMMARY.md` - Complete fix explanation
- `GOOGLE_OAUTH_FIX_GUIDE.md` - Detailed troubleshooting
- `verify_google_oauth.py` - Automated diagnostics

---

Status: ✅ **Production-Grade Fix Applied**
