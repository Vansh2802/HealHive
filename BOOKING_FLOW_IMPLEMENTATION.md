# HealHive Therapist Booking Flow - Complete Implementation

## Overview
This document describes the complete therapist booking flow from registration to Google Meet session creation.

## System Architecture

### 1. Therapist Registration & Approval Flow

**Database State:**
- `TherapistProfile.is_approved = False` (default on registration)
- `TherapistProfile.is_verified = False` (default on registration)
- `TherapistProfile.is_rejected = False` (default)

**Step 1: Therapist Registers**
```
POST /api/register
{
  "email": "therapist@example.com",
  "password": "...",
  "full_name": "Dr. John Doe",
  "role": "therapist",
  "specialization": "CBT"
}
→ Creates User + TherapistProfile (both approval flags = false)
```

**Step 2: Admin Approves Therapist**
```
PUT /api/therapists/{id}/verify
{
  "action": "approve"
}
→ Sets is_approved=true, is_verified=true, is_active=true
→ Therapist can now login and create availability
```

**Step 3: Therapist Creates Availability Slots**
```
POST /api/sessions/availability/
{
  "start_time": "2026-04-20T10:00:00Z",
  "end_time": "2026-04-20T11:00:00Z"
}
→ Creates Availability slot with is_booked=false
```

### 2. User Booking Flow

**Step 1: Fetch Available Therapists**
```
GET /api/therapists
→ Response includes ONLY approved therapists with their availability slots
→ Filters: is_approved=true OR is_verified=true
→ Includes all Availability objects in the response
```

**Response Structure:**
```json
{
  "success": true,
  "therapists": [
    {
      "id": 1,
      "name": "Dr. John Doe",
      "specialization": "CBT",
      "bio": "...",
      "availability": [
        {
          "id": 10,
          "date": "2026-04-20",
          "startTime": "2026-04-20T10:00:00Z",
          "endTime": "2026-04-20T11:00:00Z",
          "isBooked": false
        }
      ]
    }
  ]
}
```

**Step 2: Book Session**
```
POST /api/sessions/book
{
  "therapist_id": 1,
  "availability_id": 10,
  "session_time": "2026-04-20T10:00:00Z"
}

Validation:
✓ therapist_id exists and is approved
✓ availability_id exists
✓ slot is not already booked (is_booked=false)
✓ session_time matches availability.start_time
✓ session_time is in the future

Actions:
1. Create TherapySession
2. Mark Availability.is_booked=true
3. Create Google Meet link
4. Return session with meeting_link
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 1,
    "therapist": 1,
    "therapist_name": "Dr. John Doe",
    "session_time": "2026-04-20T10:00:00Z",
    "session_status": "scheduled",
    "meeting_link": "https://meet.google.com/...",
    "room_id": "uuid-...",
    "created_at": "2026-04-19T12:00:00Z"
  }
}
```

## API Endpoints Summary

### Authentication
- `POST /api/register` - Create user/therapist account
- `POST /api/login` - Login and get JWT token
- `GET /api/me` - Get current user info

### Therapist Management (Admin)
- `GET /api/therapists/all` - Get ALL therapists (admin only)
- `PUT /api/therapists/{id}/verify` - Approve/reject therapist (admin only)

### Booking
- `GET /api/therapists` - Get approved therapists with availability (public)
- `POST /api/sessions/book` - Book a session (authenticated)

### Availability Management (Therapist)
- `GET /api/sessions/availability/` - Get therapist's availability slots
- `POST /api/sessions/availability/` - Create availability slot
- `DELETE /api/sessions/availability/{id}/` - Delete availability slot

### Session Management
- `GET /api/sessions` - Get user/therapist sessions
- `POST /api/sessions/book` - Book a session

## Frontend Flow

### 1. User Dashboard
```
User clicks "Book a Session"
→ Navigate to /user/book
```

### 2. Book Session Page
```
useEffect(() => {
  fetchAvailableTherapists()  // GET /api/therapists
    .then(data => setTherapists(data))
})

// Display therapists and their slots
// User selects therapist → shows available dates/times
// User selects slot → enables "Book Session" button
```

### 3. Handle Booking
```
handleBook() {
  createSessionBooking({
    therapistId: selectedTherapist.id,
    slotId: selectedSlot.id,
    session_time: selectedSlot.startTime
  })
  
  // POST /api/sessions/book
  // → Returns session with meeting_link
  // → Redirect to session or show confirmation
}
```

## Database Schema

### TherapistProfile
```python
- id: int (PK)
- user: FK(User)
- specialization: str
- license_number: str
- university_name: str
- bio: text
- is_verified: bool = False       # ← Admin approval
- is_approved: bool = False       # ← Admin approval
- is_rejected: bool = False       # ← Admin rejection
- application_date: datetime
- approval_date: datetime (nullable)
```

### Availability
```python
- id: int (PK)
- therapist: FK(TherapistProfile)
- start_time: datetime
- end_time: datetime
- is_booked: bool = False         # ← Set to True after booking
- created_at: datetime
```

### TherapySession
```python
- id: int (PK)
- therapist: FK(TherapistProfile)
- patient: FK(PatientProfile)
- session_time: datetime
- session_status: str (scheduled|completed|cancelled)
- meeting_link: str               # ← Google Meet URL
- room_id: str (uuid)
- session_start_time: datetime
- session_end_time: datetime
- feedback_rating: int
- feedback_text: text
- created_at: datetime
```

## Testing Checklist

### 1. Admin Approval
- [ ] Register as therapist
- [ ] Check in admin dashboard - therapist appears in "Pending" section
- [ ] Admin clicks "Approve"
- [ ] Therapist can now login without "Approval Pending" message

### 2. Therapist Availability
- [ ] Login as approved therapist
- [ ] Click "Add Slot" in availability section
- [ ] Create slot: 2026-04-20, 10:00-11:00
- [ ] Verify slot appears in therapist's availability list

### 3. User Booking
- [ ] Login as regular user
- [ ] Go to "Book a Session"
- [ ] See approved therapist listed with "1 slots available"
- [ ] Click therapist
- [ ] See available dates/times
- [ ] Select time slot
- [ ] Click "Book Session"
- [ ] Verify booking succeeds
- [ ] Check meeting_link in response

### 4. End-to-End
- [ ] No therapists visible if none approved
- [ ] After approval, therapist visible but no slots → "0 slots available"
- [ ] After adding slot, shows "1 slots available"
- [ ] After booking, slot marked as booked and user can't re-book same slot

## Common Issues & Solutions

### Issue: "No therapists available yet"
**Cause:** No therapists have `is_approved=true`
**Solution:** Login as admin, approve pending therapists

### Issue: Therapist visible but no slots
**Cause:** Therapist hasn't created availability slots
**Solution:** Login as therapist, add availability slots

### Issue: Booking fails with "Therapist not found or not approved"
**Cause:** Therapist is pending approval
**Solution:** Approve therapist in admin dashboard first

### Issue: "This time slot is already booked"
**Cause:** User tried to book a slot that was already booked
**Solution:** Choose a different slot or time

## Debugging

### Backend Logging
All key events are logged with prefixes:
- `[RegisterView]` - Therapist registration
- `[LoginView]` - Login attempts
- `[AdminTherapistReviewView]` - Approval/rejection
- `[BookSessionView]` - Booking attempts
- `[AvailabilityListCreateView]` - Slot creation

### Check Logs
```bash
# Terminal running backend server
python manage.py runserver
# Watch for [BookSessionView], [AvailabilityListCreateView] logs
```

### Database Query
```python
python manage.py shell

# Check approved therapists
from accounts.models import TherapistProfile
therapists = TherapistProfile.objects.filter(is_approved=True)
for t in therapists:
    print(f"{t.user.full_name}: {t.availabilities.count()} slots")

# Check availability
from therapy_sessions.models import Availability
slots = Availability.objects.filter(is_booked=False)
for s in slots:
    print(f"{s.therapist.user.full_name}: {s.start_time}")
```

## Google Meet Integration

When a booking is made:
1. `create_google_meet()` is called with therapist and patient emails
2. Creates Google Calendar event with videoConferenceData
3. Returns meeting link: `https://meet.google.com/xxx-yyy-zzz`
4. Link is saved in `TherapySession.meeting_link`

**Requirements:**
- `google-api-python-client` installed ✓
- `credentials.json` in `backend/healhive_backend/` directory
- User authenticated with Google Calendar API

---

## Implementation Status

✅ **Completed:**
- Therapist registration and approval flow
- Availability slot management
- User booking with validation
- Google Meet link generation
- Admin dashboard for approvals
- Frontend booking page
- WebSocket chat integration
- Comprehensive logging

⚠️ **In Progress:**
- Testing complete flow end-to-end

---

Generated: April 19, 2026
