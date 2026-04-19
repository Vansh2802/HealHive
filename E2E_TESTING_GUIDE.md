# End-to-End Testing Guide: Join Google Meet Feature

## 📋 Prerequisites

- Both backend and frontend servers running
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5175`
- Database populated with test data
- Google OAuth credentials configured

---

## 🎯 Test Scenario: Complete Booking to Join Flow

### Part 1: Setup Test Accounts

#### Step 1: Create Therapist Account
```
1. Go to http://localhost:5175
2. Click "Sign Up"
3. Fill details:
   - Name: "Dr. Sarah Smith"
   - Email: "therapist@test.com"
   - Password: "Password123!"
   - Role: "Therapist"
   - License: "LIC123456"
4. Click "Sign Up"
5. You should receive confirmation
```

#### Step 2: Approve Therapist (As Admin)
```
1. Log in as admin (if available)
2. Go to admin panel
3. Find "Dr. Sarah Smith"
4. Click "Approve" button
5. Therapist status changes to approved
```

#### Step 3: Create Patient Account
```
1. Log out from therapist account
2. Click "Sign Up"
3. Fill details:
   - Name: "John Patient"
   - Email: "patient@test.com"
   - Password: "Password123!"
   - Role: "Patient"
4. Click "Sign Up"
5. Confirm account creation
```

---

### Part 2: Add Availability Slot

#### Step 1: Log in as Therapist
```
1. Go to http://localhost:5175
2. Click "Login"
3. Email: "therapist@test.com"
4. Password: "Password123!"
5. Should redirect to therapist dashboard
```

#### Step 2: Navigate to Sessions Tab
```
1. Click "Dashboard" (if not already there)
2. See "Sessions" tab selected
3. You should see empty state or existing sessions
```

#### Step 3: Add Availability Slot
```
1. Find "Availability" section
2. Look for "Add Slot" button
3. Click it
4. Fill in:
   - Date: Tomorrow (or any future date)
   - Start Time: 14:00 (2:00 PM)
   - End Time: 15:00 (3:00 PM)
5. Click "Add Slot"
6. Should see success message
7. Slot appears in availability list
```

**Expected Result**: ✅ Slot visible in availability list

---

### Part 3: Book Session as Patient

#### Step 1: Log in as Patient
```
1. Log out from therapist
2. Go to http://localhost:5175
3. Click "Login"
4. Email: "patient@test.com"
5. Password: "Password123!"
6. Should redirect to patient dashboard
```

#### Step 2: Navigate to Book Session
```
1. Find "Book a Session" or similar
2. Should see list of therapists
3. Find "Dr. Sarah Smith"
4. Click on therapist card
```

#### Step 3: Select Available Slot
```
1. Should see available slots
2. Find the slot you created (tomorrow 14:00-15:00)
3. Verify slot is NOT marked as "Booked" or "Unavailable"
4. Click on the slot
5. Confirm booking
```

#### Step 4: Verify Booking
```
1. Should see success message
2. Redirect to dashboard or sessions list
3. Booking should appear in "My Sessions"
4. Verify Google Meet link was generated

Backend Check:
curl -H "Authorization: Bearer <patient_token>" \
  http://localhost:8000/api/sessions/
Look for: "meeting_link": "https://meet.google.com/..."
```

**Expected Result**: ✅ Session booked with Google Meet link

---

### Part 4: View Booked Session on Therapist Dashboard

#### Step 1: Log in as Therapist
```
1. Log out from patient
2. Go to http://localhost:5175
3. Click "Login"
4. Email: "therapist@test.com"
5. Password: "Password123!"
6. Redirect to therapist dashboard
```

#### Step 2: Check Sessions Tab
```
1. Click "Dashboard" tab (should be default)
2. Look at RIGHT column: "Booked Sessions"
3. Should see the session you just booked
```

#### Step 3: Verify Session Details
```
In the "Booked Sessions" card, you should see:
- ✅ Patient name: "John Patient"
- ✅ Patient email: "patient@test.com" (if visible)
- ✅ Date: Tomorrow's date (e.g., "Wed, Apr 19")
- ✅ Time: "14:00"
- ✅ Countdown: Shows time remaining (e.g., "23h 45m")
- ✅ Blue "Join Google Meet" button
- ✅ Blue badge saying "Google Meet"
```

**Expected Result**: ✅ Session appears with all details visible

---

### Part 5: Test Countdown Timer

#### Step 1: Monitor Timer Updates
```
1. Watch the countdown timer on the session card
2. Observe for 10 seconds
3. Timer should update every second
```

#### Step 2: Verify Format Changes
```
Session is 23+ hours away:
Expected: "23h 45m"

Session is <60 minutes away:
Expected: "45m 30s"

Session is <60 seconds away:
Expected: "30s"

When session starts:
Expected: "Starting now"
```

**Expected Result**: ✅ Countdown updates every 1 second

---

### Part 6: Test Join Google Meet Button

#### Step 1: Click Join Button
```
1. When session is approaching (anytime after booking)
2. Click the blue "Join Google Meet" button
3. Browser should open new tab/window
```

#### Step 2: Verify Google Meet Opens
```
1. New tab opens with Google Meet
2. Meeting room has unique URL: https://meet.google.com/xxx-xxx-xxx
3. You're in the Google Meet interface
4. Can see video/audio options
5. Can adjust mic/camera settings
```

#### Step 3: Test Meeting Features
```
Optional testing:
- [ ] Can enable camera
- [ ] Can enable microphone
- [ ] Can see yourself on screen
- [ ] Screen sharing available
- [ ] Chat available
- [ ] Multiple participants can join
```

**Expected Result**: ✅ Google Meet opens and is fully functional

---

### Part 7: Test Empty State

#### Step 1: Log out from Current Account
```
1. Go to therapist dashboard
2. Create new therapist account (no bookings)
3. Log in as new therapist
```

#### Step 2: Check Booked Sessions
```
1. Navigate to Dashboard tab
2. Look at "Booked Sessions" section
3. Should see:
   - Video icon
   - "No booked sessions with Google Meet"
   - "Bookings will appear here automatically"
4. No "Join Google Meet" button
```

**Expected Result**: ✅ Empty state displays correctly

---

### Part 8: Test on Mobile/Responsive

#### Step 1: Open DevTools
```
1. Press F12 to open Developer Tools
2. Click device toggle (mobile icon)
3. Select iPhone or Android preset
```

#### Step 2: Test Mobile Layout
```
1. Reload page
2. Check "Booked Sessions" displays correctly
3. Verify text readable
4. Verify "Join Google Meet" button clickable
5. Verify countdown visible
6. Test on multiple sizes: 375px, 768px, 1024px
```

**Expected Result**: ✅ Responsive on all device sizes

---

## 🔍 Backend Testing (Advanced)

### Test 1: API Endpoint Response

```bash
# 1. Get therapist token
curl -X POST http://localhost:8000/api/token \
  -H "Content-Type: application/json" \
  -d '{"email":"therapist@test.com","password":"Password123!"}'

# Save the 'access' token

# 2. Call upcoming sessions endpoint
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8000/api/sessions/upcoming/

# Expected response:
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "patient_name": "John Patient",
      "patient_email": "patient@test.com",
      "session_time": "2026-04-19T14:00:00Z",
      "session_end_time": "2026-04-19T15:00:00Z",
      "meeting_link": "https://meet.google.com/abc-def-ghi",
      "status": "upcoming"
    }
  ]
}
```

### Test 2: Non-Therapist Access

```bash
# 1. Get patient token
curl -X POST http://localhost:8000/api/token \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"Password123!"}'

# Save the token

# 2. Try to access therapist endpoint
curl -H "Authorization: Bearer <PATIENT_TOKEN>" \
  http://localhost:8000/api/sessions/upcoming/

# Expected response (403 Forbidden):
{
  "success": false,
  "error": "Only therapists can access this endpoint."
}
```

### Test 3: Unauthenticated Access

```bash
# Call without authorization header
curl http://localhost:8000/api/sessions/upcoming/

# Expected response (401 Unauthorized):
{
  "detail": "Authentication credentials were not provided."
}
```

### Test 4: Filter by Status

```bash
# In Django shell
python manage.py shell

from therapy_sessions.models import TherapySession
from datetime import timedelta
from django.utils import timezone

# Check sessions are filtered correctly
now = timezone.now()
sessions = TherapySession.objects.filter(
    session_time__gte=now,
    session_status='scheduled'
)
for s in sessions:
    print(f"Session ID: {s.id}")
    print(f"Patient: {s.patient.user.name}")
    print(f"Therapist: {s.therapist.user.name}")
    print(f"Meeting Link: {s.meeting_link}")
    print(f"Status: {s.session_status}")
    print("---")
```

---

## 📊 Performance Testing

### Load Time Test
```
1. Open Developer Tools (F12)
2. Go to Network tab
3. Load therapist dashboard
4. Check:
   - API response time: Should be <500ms
   - Page load time: Should be <3s
   - Session cards render: <1s
```

### Timer Accuracy Test
```
1. Open page 1 minute before session
2. Note start time
3. Watch countdown timer
4. When "Starting now" appears, check actual system time
5. Should be within ±2 seconds of actual session time
```

---

## ✅ Verification Checklist

### Frontend Checks
- [ ] Sessions load on component mount
- [ ] Countdown updates every second
- [ ] Timer format correct (Xh Ym, Xm Ys, Xs, Starting now)
- [ ] "Join Google Meet" button visible
- [ ] Button opens new tab with valid URL
- [ ] Empty state shows when no sessions
- [ ] Patient name displays correctly
- [ ] Date format correct
- [ ] Time format correct
- [ ] Blue styling applied
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] No visual glitches

### Backend Checks
- [ ] Only therapist can access endpoint
- [ ] Only future sessions returned
- [ ] Only scheduled sessions returned
- [ ] Patient name included
- [ ] Meeting link included
- [ ] Sessions ordered by time
- [ ] Logging shows endpoint access
- [ ] Error handling works
- [ ] Performance acceptable

### Security Checks
- [ ] Non-therapist gets 403
- [ ] Unauthenticated gets 401
- [ ] Therapist A can't see Therapist B's sessions
- [ ] Links open with noopener flag
- [ ] No sensitive data in console
- [ ] No credentials exposed

---

## 🐛 Troubleshooting During Testing

### Sessions Not Loading

**Issue**: Booked Sessions section shows "No booked sessions"

**Checks**:
1. Backend logs show error?
2. API call failing?
3. Sessions exist in database?
4. Sessions are future/scheduled?

**Fix**:
```bash
# Check if session was created
python manage.py shell
from therapy_sessions.models import TherapySession
TherapySession.objects.all().values()

# Check status and time
from django.utils import timezone
now = timezone.now()
sessions = TherapySession.objects.filter(session_status='scheduled', session_time__gte=now)
print(sessions.count())
```

### Countdown Not Updating

**Issue**: Timer shows "Loading..." or doesn't change

**Checks**:
1. Console shows errors?
2. Sessions data present?
3. JavaScript enabled?
4. Browser dev tools show timer firing?

**Fix**:
```javascript
// Check timer interval
console.log('Countdown update:', new Date())
// Should log every 1 second

// Check sessions data
console.log('Upcoming sessions:', upcomingSessions)
// Should have non-empty array
```

### Google Meet Won't Open

**Issue**: Button click does nothing

**Checks**:
1. meeting_link is present?
2. Popup blocker enabled?
3. Browser console errors?
4. URL valid?

**Fix**:
1. Check meeting_link in response
2. Disable popup blocker
3. Try right-click > Open in New Tab
4. Verify Google Meet URL starts with `https://meet.google.com/`

---

## 📝 Test Report Template

Use this to document your testing:

```
Test Date: [Date]
Tester: [Name]
Environment: Local Dev

BOOKING FLOW:
- [ ] Therapist account created
- [ ] Therapist approved
- [ ] Availability slot added
- [ ] Patient account created
- [ ] Session booked successfully

DASHBOARD DISPLAY:
- [ ] Sessions load correctly
- [ ] Patient name visible
- [ ] Date/time correct
- [ ] Blue styling applied

COUNTDOWN TIMER:
- [ ] Timer shows at startup
- [ ] Updates every second
- [ ] Format changes over time
- [ ] Shows "Starting now" at session time

JOIN FUNCTIONALITY:
- [ ] Button visible and clickable
- [ ] Opens Google Meet in new tab
- [ ] Meeting is functional

EDGE CASES:
- [ ] Empty state displays (no bookings)
- [ ] Multiple sessions show independently
- [ ] Responsive on mobile
- [ ] Works after browser refresh

ISSUES FOUND:
[List any bugs or problems]

CONCLUSION:
[Pass/Fail] - [Notes]
```

---

## 🎯 Success Criteria

All checks should pass:

| Check | Expected | Status |
|-------|----------|--------|
| Sessions display | Visible | ✅ |
| Patient name | Correct | ✅ |
| Date/time format | Readable | ✅ |
| Countdown updates | Every 1s | ✅ |
| Join button | Opens Meet | ✅ |
| Empty state | Displays | ✅ |
| Mobile responsive | Works | ✅ |
| Security | Only therapist | ✅ |
| Performance | <500ms API | ✅ |
| No errors | Console clean | ✅ |

---

**Test Completed**: ___________  
**Tester**: ___________  
**Status**: ___________
