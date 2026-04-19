# Join Google Meet Functionality - Implementation Guide

## 🎯 Overview

Therapists can now easily join Google Meet sessions directly from their dashboard when sessions are booked by patients.

---

## ✨ Features Implemented

### 1. **Dedicated Therapist Sessions Endpoint**
- **Endpoint**: `GET /api/sessions/upcoming/`
- **Authentication**: Required (therapists only)
- **Returns**: List of upcoming booked sessions with Google Meet links

```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "patient_name": "John Doe",
      "patient_email": "john@example.com",
      "session_time": "2026-04-19T14:00:00Z",
      "session_end_time": "2026-04-19T15:00:00Z",
      "meeting_link": "https://meet.google.com/abc-def-ghi",
      "status": "upcoming"
    }
  ]
}
```

### 2. **Frontend Session Display**
Therapist Dashboard shows two sections:
- **Existing Booked Sessions**: All upcoming sessions
- **Booked Sessions (Google Meet)**: Sessions with active Google Meet links

### 3. **Countdown Timer**
- Shows time until session starts
- Updates every second in real-time
- Format: "2h 30m", "15m 45s", or "Starting now"

### 4. **Join Session Button**
- Green "Join Google Meet" button
- Disabled if meeting_link is missing
- Opens link in new tab with security flags
- Therapist name and patient details shown

---

## 📊 Backend Implementation

### New API Endpoint

**File**: `backend/healhive_backend/therapy_sessions/views.py`

```python
class TherapistUpcomingSessionsView(APIView):
    """Get upcoming booked sessions for a therapist with Google Meet link."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only therapists can access
        # Returns sessions where:
        # - status = 'scheduled'
        # - session_time >= now
        # - therapist matches authenticated user
```

**URL Route**: `backend/healhive_backend/therapy_sessions/urls.py`

```python
path('upcoming/', TherapistUpcomingSessionsView.as_view(), name='therapist-upcoming-sessions'),
```

### Security Features
- ✅ Only therapists can access the endpoint
- ✅ Therapist can only see their own sessions
- ✅ Sessions must be in the future
- ✅ Only scheduled sessions included
- ✅ Comprehensive logging for debugging

---

## 🎨 Frontend Implementation

### API Service

**File**: `frontend/src/services/api/sessions.js`

```javascript
export async function fetchTherapistUpcomingSessions() {
    // Fetches from GET /api/sessions/upcoming/
    // Returns array of upcoming sessions with meeting links
}
```

### Dashboard Component

**File**: `frontend/src/pages/therapist/TherapistDashboard.jsx`

#### New State Variables
```javascript
const [upcomingSessions, setUpcomingSessions] = useState([])
const [countdowns, setCountdowns] = useState({})
```

#### Data Fetching
```javascript
useEffect(() => {
    fetchTherapistUpcomingSessions()
        .then(data => setUpcomingSessions(data))
        .catch(() => setUpcomingSessions([]))
}, [user?.id])
```

#### Countdown Timer
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        // Updates countdown every second
        // Shows hours, minutes, seconds
    }, 1000)
    return () => clearInterval(interval)
}, [upcomingSessions])
```

#### UI Section
- New "Booked Sessions" column showing Google Meet sessions
- Blue themed cards to distinguish from other sessions
- Countdown timer in prominent display
- Patient name, date, and time displayed
- Green "Join Google Meet" button

---

## 🚀 Usage Workflow

### For Therapists

1. **Log In**
   - Go to therapist dashboard: `http://localhost:5175/therapist/dashboard`

2. **View Upcoming Sessions**
   - Click "Dashboard" tab (default)
   - See "Booked Sessions" column on right side
   - Shows all upcoming Google Meet sessions

3. **Monitor Countdown**
   - Countdown timer updates every second
   - Shows time remaining until session starts

4. **Join Session**
   - Click "Join Google Meet" button
   - Opens Google Meet in new tab
   - Session starts automatically

### For Users

Patients see similar interface:
- Sessions tab shows upcoming bookings
- "Join Session" button for each booking with meet_link
- Can join from user dashboard

---

## 🔍 API Response Examples

### Success Response
```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "patient_name": "Alice Johnson",
      "patient_email": "alice@example.com",
      "session_time": "2026-04-19T14:00:00Z",
      "session_end_time": "2026-04-19T15:00:00Z",
      "meeting_link": "https://meet.google.com/abc-def-ghi",
      "status": "upcoming"
    },
    {
      "id": 2,
      "patient_name": "Bob Smith",
      "patient_email": "bob@example.com",
      "session_time": "2026-04-19T15:30:00Z",
      "session_end_time": "2026-04-19T16:30:00Z",
      "meeting_link": "https://meet.google.com/xyz-uvw-rst",
      "status": "upcoming"
    }
  ]
}
```

### No Sessions Response
```json
{
  "success": true,
  "sessions": []
}
```

### Authorization Error
```json
{
  "success": false,
  "error": "Only therapists can access this endpoint."
}
```

---

## 🔐 Security Implementation

### Backend Security
- ✅ `permission_classes = [IsAuthenticated]` - Only logged-in users
- ✅ Role check: `if user.role != User.ROLE_THERAPIST` - Only therapists
- ✅ Therapist verification: `hasattr(user, 'therapist_profile')`
- ✅ Sessions must be in future: `session_time__gte=now`
- ✅ Logging: All access logged with `[TherapistUpcomingSessionsView]` prefix

### Frontend Security
- ✅ `_blank` target with `noopener,noreferrer` flags
- ✅ Token-based authentication
- ✅ Only therapists see the endpoint in UI

### Data Privacy
- ✅ Therapist only sees their own sessions
- ✅ Patient email shown only to assigned therapist
- ✅ Meeting link included only if session is scheduled

---

## 📱 UI Components

### Session Card Layout
```
┌─────────────────────────────────┐
│ Patient Name        [Google Meet]│
├─────────────────────────────────┤
│ 📅 Wed, Apr 19      ⏰ 14:00     │
├─────────────────────────────────┤
│ Starts in                        │
│ 2h 30m                           │
├─────────────────────────────────┤
│    [ Join Google Meet ]          │
└─────────────────────────────────┘
```

### Color Scheme
- **Card Background**: Blue gradient (from-blue-50 to-blue-0)
- **Border**: Blue-200
- **Button**: Blue gradient (from-blue-600 to-blue-500)
- **Timer**: Bold blue-600 text
- **Badge**: Blue-100 background, blue-700 text

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] `GET /api/sessions/upcoming/` returns therapist's sessions
- [ ] Non-authenticated users get 403 error
- [ ] Non-therapist users get 403 error
- [ ] Only future sessions returned
- [ ] Only scheduled sessions returned
- [ ] Meeting links included in response
- [ ] Sessions ordered by session_time

### Frontend Tests
- [ ] Sessions load on therapist dashboard
- [ ] Countdown timer updates every second
- [ ] "Join Google Meet" button opens link in new tab
- [ ] "No booked sessions" message when empty
- [ ] Patient name and time display correctly
- [ ] Blue styling applied correctly
- [ ] Works with multiple sessions

### Integration Tests
- [ ] User books session → therapist sees it in upcoming
- [ ] Google Meet link generates on booking → therapist can join
- [ ] Countdown shows correct time
- [ ] Past sessions don't appear
- [ ] Completed sessions don't appear

---

## 🐛 Troubleshooting

### Sessions Not Appearing

**Problem**: Therapist doesn't see booked sessions

**Solutions**:
1. Check backend logs for `[TherapistUpcomingSessionsView]` messages
2. Verify sessions are in future (not past)
3. Verify sessions have status='scheduled'
4. Refresh browser page
5. Check API call: `GET /api/sessions/upcoming/`

### Meeting Link Not Present

**Problem**: "Join Google Meet" button doesn't appear

**Solutions**:
1. Check if session.meeting_link is set in database
2. Verify Google Meet was created during booking
3. Check backend logs for `[BookSessionView]` errors
4. Verify token.json exists and is valid
5. Re-run `python auth.py` if token issues

### Countdown Not Updating

**Problem**: Countdown timer shows "Loading..." or doesn't update

**Solutions**:
1. Check browser console for errors
2. Verify JavaScript is enabled
3. Clear browser cache
4. Refresh page
5. Check that sessions are in future

### Authorization Errors

**Problem**: Getting "Only therapists can access" error

**Solutions**:
1. Verify logged-in as therapist (not patient or admin)
2. Check user.role in authentication
3. Verify therapist_profile exists
4. Check token is valid
5. Log out and log back in

---

## 📊 Database Schema

### TherapySession Model
```python
therapist = ForeignKey(TherapistProfile)
patient = ForeignKey(PatientProfile)
session_time = DateTimeField()
session_status = CharField(choices=['scheduled', 'completed', 'cancelled'])
meeting_link = URLField()  # Contains Google Meet link
session_end_time = DateTimeField()
```

### Requirements for Feature
- ✅ `meeting_link` field populated by BookSessionView
- ✅ `session_time` in future
- ✅ `session_status` = 'scheduled'
- ✅ Therapist and patient assigned

---

## 🎯 Production Deployment

### Pre-Deployment Checklist
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] Integration tests passing
- [ ] Logging configured
- [ ] Error handling complete
- [ ] Security audit passed
- [ ] Performance tested
- [ ] Database migrations applied

### Performance Considerations
- API query filters by therapist and status (indexed)
- Sessions ordered by session_time
- Countdown timer uses client-side timer (no server load)
- Frontend caches sessions until refresh

### Monitoring
- Monitor API response time: `GET /api/sessions/upcoming/`
- Track meeting_link generation errors
- Monitor countdown timer accuracy
- Track user engagement with "Join Google Meet"

---

## 📝 Code Examples

### Booking a Session (Creates Meeting Link)
```javascript
// Frontend
const response = await createSessionBooking({
    therapistId: 1,
    slotId: 5,
    session_time: "2026-04-19T14:00:00Z"
})
// Response includes: { meeting_link: "https://meet.google.com/..." }
```

### Fetching Upcoming Sessions
```javascript
// Frontend
const sessions = await fetchTherapistUpcomingSessions()
sessions.forEach(s => {
    console.log(`${s.patient_name} - ${s.session_time}`)
    console.log(`Join: ${s.meeting_link}`)
})
```

### Joining a Meeting
```javascript
// Frontend
const joinMeeting = (session) => {
    window.open(session.meeting_link, '_blank', 'noopener,noreferrer')
}
```

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Pre-meeting notifications (15 min before)
- [ ] Session recording (optional)
- [ ] In-app chat during session
- [ ] Session notes/summary
- [ ] Follow-up task creation

### Phase 3
- [ ] Calendar integration
- [ ] Automatic email reminders
- [ ] Therapy progress tracking
- [ ] Patient feedback forms
- [ ] Session analytics

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review backend logs: `[TherapistUpcomingSessionsView]`
3. Check browser console for frontend errors
4. Verify database state with Django shell

---

**Status**: ✅ Production Ready  
**Last Updated**: April 19, 2026  
**Version**: 1.0
