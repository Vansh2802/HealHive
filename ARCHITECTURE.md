# 🏗️ HealHive System Architecture - Therapist Approval Flow

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     THERAPIST REGISTRATION FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Register Page)
    │
    ├─ User fills form (name, email, license, etc.)
    │
    └─> POST /api/register
          Body: {
            name: "Dr. Jane Smith",
            email: "jane@clinic.com",
            password: "...",
            role: "therapist",
            specialization: "...",
            license_number: "...",
            ...
          }
          │
          v
      Backend (RegisterView)
          ├─ Create User(role='therapist', email='jane@clinic.com')
          ├─ Create TherapistProfile(
          │    user=User,
          │    is_verified=False,
          │    is_approved=False,
          │    is_rejected=False,
          │    application_date=now()
          │  )
          ├─ Log: "[RegisterView] Therapist pending approval: jane@clinic.com"
          │
          └─> Response: {
                success: true,
                token: null,
                message: "Application submitted...",
                user: {
                  id: 1,
                  email: "jane@clinic.com",
                  role: "therapist",
                  therapistStatus: "pending",  ← NEW FIELD
                  ...
                }
              }
              │
              v
          Frontend (Show Success Message)
              └─ Display: "Application Submitted!"
              └─ Redirect to: Login page


┌─────────────────────────────────────────────────────────────────────┐
│                  THERAPIST LOGIN - PENDING STATUS                    │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Therapist Login)
    │
    └─> POST /api/login
          Body: {
            email: "jane@clinic.com",
            password: "...",
            role: "therapist"
          }
          │
          v
      Backend (LoginView)
          ├─ Authenticate user by email/password
          ├─ Check: if is_rejected → Return error
          │         (Allow pending therapists - DON'T block!)
          │
          ├─ Generate JWT token
          ├─ Serialize user with AuthUserSerializer
          │  └─ therapistStatus = "pending" (NOT approved/verified)
          │
          ├─ Log: "[LoginView] Therapist login: jane@clinic.com,
          │                      status: is_approved=False, is_verified=False"
          │
          └─> Response: {
                success: true,
                token: "eyJ0eXAi...",
                user: {
                  id: 1,
                  email: "jane@clinic.com",
                  role: "therapist",
                  therapistStatus: "pending",  ← KEY FIELD
                  therapistProfileId: 1,
                  ...
                }
              }
              │
              v
          Frontend (AuthContext stores user)
              └─ Check: user.therapistStatus
                  ├─ If "pending" → Redirect to /therapist/verification
                  ├─ If "approved" → Redirect to /therapist/dashboard
                  └─ If "rejected" → Redirect to /therapist/rejection


┌─────────────────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD - VIEW PENDING THERAPISTS                │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Admin Dashboard)
    │
    ├─ useEffect on mount → Call fetchAdminTherapists()
    │
    └─> GET /api/therapists/all
          Headers: {
            Authorization: "Bearer ADMIN_TOKEN"
          }
          │
          v
      Backend (TherapistsAllView)
          ├─ Check: user.role == 'admin' ?
          │
          ├─ Query: TherapistProfile.objects.all()
          │
          ├─ Count by status:
          │  ├─ Pending: is_approved=False, is_verified=False, is_rejected=False
          │  ├─ Approved: is_approved=True OR is_verified=True
          │  └─ Rejected: is_rejected=True
          │
          ├─ Log: "[TherapistsAllView] Fetching all therapists: 5 total"
          ├─ Log: "[TherapistsAllView] Status breakdown - Pending: 2, Approved: 3"
          │
          └─> Response: {
                success: true,
                therapists: [
                  {
                    _id: 1,                    ← Both formats for compatibility
                    id: 1,
                    name: "Dr. Jane Smith",
                    email: "jane@clinic.com",
                    specialization: "Anxiety & Depression",
                    verified: false,           ← For filter: !verified = pending
                    isApproved: false,
                    isRejected: false,
                    applicationDate: "2024-04-19T...",
                    ...
                  },
                  ...
                ]
              }
              │
              v
          Frontend (AdminDashboard component)
              ├─ const pending = therapists.filter(t => !t.verified)
              ├─ const approved = therapists.filter(t => t.verified)
              │
              ├─ Render two sections:
              │  ├─ "Pending Approval (2)"
              │  │  ├─ Dr. Jane Smith | Anxiety & Depression | [Approve] [Reject]
              │  │  └─ Dr. John Doe | ...
              │  │
              │  └─ "Verified Therapists (3)"
              │     ├─ Dr. Alice Brown | ... | [Verified]
              │     └─ ...
              │
              └─ Log: "[AdminDashboard] Therapists data: [...]"
              └─ Log: "[AdminDashboard] Pending: 2 Approved: 3"


┌─────────────────────────────────────────────────────────────────────┐
│                   ADMIN APPROVAL ACTION                              │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Click "Approve" button)
    │
    └─> PUT /api/therapists/{therapist_id}/verify
          Headers: {
            Authorization: "Bearer ADMIN_TOKEN",
            Content-Type: "application/json"
          }
          Body: { action: "approve" }
          │
          v
      Backend (AdminTherapistReviewView._handle_review)
          ├─ Check: user.role == 'admin' ?
          │
          ├─ Get: TherapistProfile.objects.get(id=1)
          │
          ├─ If action="approve":
          │  ├─ Set: is_approved = True
          │  ├─ Set: is_verified = True
          │  ├─ Set: is_rejected = False
          │  ├─ Set: approval_date = now()
          │  ├─ Update: User.is_active = True
          │  │
          │  └─ Log: "[AdminTherapistReviewView] Therapist jane@clinic.com
          │                                      approved - is_verified=True,
          │                                      is_approved=True"
          │
          ├─ If action="reject":
          │  ├─ Set: is_approved = False
          │  ├─ Set: is_verified = False
          │  ├─ Set: is_rejected = True
          │  ├─ Update: User.is_active = False
          │  │
          │  └─ Log: "[AdminTherapistReviewView] Therapist jane@clinic.com rejected"
          │
          └─> Response: {
                success: true
              }
              │
              v
          Frontend (AdminDashboard)
              ├─ Show toast: "Therapist approved"
              ├─ Update local state
              ├─ Auto-reload page: window.location.reload()
              │
              └─ On reload:
                  └─ Fetch updated therapist list
                      └─ Dr. Jane Smith now appears in "Verified Therapists" section


┌─────────────────────────────────────────────────────────────────────┐
│            APPROVED THERAPIST LOGIN & REDIRECT                       │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Therapist logs in after approval)
    │
    └─> POST /api/login (same as before)
          │
          v
      Backend (LoginView)
          └─> Response: {
                success: true,
                token: "...",
                user: {
                  email: "jane@clinic.com",
                  role: "therapist",
                  therapistStatus: "approved"  ← CHANGED FROM "pending"!
                  therapistVerified: true,
                  ...
                }
              }
              │
              v
          Frontend (AuthContext)
              ├─ Check: user.therapistStatus
              │
              └─ If "approved":
                  ├─ Show: VerificationStatus page with "You're verified!"
                  ├─ Auto-redirect after 2s
                  │
                  └─> Navigate to /therapist/dashboard
                      └─ Therapist can now:
                          ├─ Set availability
                          ├─ View sessions
                          ├─ Accept/reject bookings
                          └─ Manage profile


┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────────┘

TABLE: accounts_user
├─ id (PK)
├─ email (UNIQUE)
├─ username
├─ password_hash
├─ full_name
├─ role: ['user', 'therapist', 'admin']
├─ is_active
└─ created_at

TABLE: accounts_therapistprofile
├─ id (PK)
├─ user_id (FK) → accounts_user
├─ specialization
├─ license_number
├─ university_name
├─ bio
├─ is_verified: Boolean (DEFAULT: False)
├─ is_approved: Boolean (DEFAULT: False)
├─ is_rejected: Boolean (DEFAULT: False)
├─ application_date: DateTime (AUTO_NOW_ADD)
├─ approval_date: DateTime (NULLABLE)
└─ created_at


┌─────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS SUMMARY                             │
└─────────────────────────────────────────────────────────────────────┘

POST /api/register
├─ Purpose: Create new user (therapist/user/admin)
├─ Auth: None (public)
├─ Request: { name, email, password, role, ...therapist_fields }
└─ Response: { success, token, user, message }

POST /api/login
├─ Purpose: Authenticate and get JWT token
├─ Auth: None (public)
├─ Request: { email, password, role }
└─ Response: { success, token, user } ← user includes therapistStatus!

GET /api/therapists/all ← NEW!
├─ Purpose: Fetch all therapists (admin only)
├─ Auth: Bearer token (admin only)
├─ Request: None
└─ Response: { success, therapists: [{_id, id, name, email, verified, ...}] }

PUT /api/therapists/{id}/verify ← UPDATED!
├─ Purpose: Approve or reject therapist
├─ Auth: Bearer token (admin only)
├─ Request: { action: "approve" | "reject" }
└─ Response: { success }

GET /api/admin/dashboard ← EXISTING
├─ Purpose: Admin dashboard stats
├─ Auth: Bearer token (admin only)
├─ Request: None
└─ Response: { success, therapists, metrics, flags }
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────┐
│          Frontend State Management              │
└─────────────────────────────────────────────────┘

AuthContext
├─ user: { id, email, role, therapistStatus, ... }
└─ Updates on:
   ├─ Login success → sets user with therapistStatus
   ├─ Register success → sets user with therapistStatus='pending'
   └─ Logout → clears user

VerificationStatus Component
├─ State: status (from user.therapistStatus)
├─ Logic:
│  ├─ 'pending' → Show progress, stay on page
│  ├─ 'approved' → Show success, auto-redirect
│  └─ 'rejected' → Show error message
└─ Effects:
   └─ useEffect: Check status on mount, redirect if approved

AdminDashboard Component
├─ State: therapists, pending, approved, stats, loading
├─ Logic:
│  ├─ Fetch /api/therapists/all on mount
│  ├─ Filter by verified status
│  ├─ Display pending/approved sections
│  └─ Handle approval/rejection
└─ Effects:
   ├─ useEffect: Fetch data on mount
   └─ useEffect: Reload on approval
```

---

## Error Handling

```
┌─────────────────────────────────────────────────┐
│             Error Scenarios                     │
└─────────────────────────────────────────────────┘

Rejected Therapist Tries to Login
├─ Backend: LoginSerializer checks is_rejected
├─ Response: Error "Your application has been rejected..."
└─ Frontend: Display error message

Non-Admin Tries to Fetch Therapists
├─ Backend: TherapistsAllView checks user.role
├─ Response: 403 "Admin access required"
└─ Frontend: Toast error message

Therapist Not Found on Approval
├─ Backend: TherapistProfile.objects.get() raises DoesNotExist
├─ Response: 404 "Therapist not found"
└─ Frontend: Toast error message

Invalid Approval Action
├─ Backend: action not in ['approve', 'reject']
├─ Response: 400 "Invalid review action"
└─ Frontend: Toast error message
```

---

## Logging Architecture

```
┌─────────────────────────────────────────────────┐
│         Structured Logging System               │
└─────────────────────────────────────────────────┘

Backend Logs (console via Django runserver)
Format: [ComponentName] Action: Details

[RegisterView] User created: {email}, role: {role}
[RegisterView] TherapistProfile created: {id}, is_verified={bool}
[RegisterView] Therapist pending approval: {email}

[LoginView] Login validation failed: {error}
[LoginView] Therapist login: {email}, status: is_approved={bool}, is_verified={bool}
[LoginView] User login: {email}, role: {role}

[TherapistsAllView] Non-admin user {email} attempted access
[TherapistsAllView] Fetching all therapists: {count} total
[TherapistsAllView] Status breakdown - Pending: {p}, Approved: {a}, Rejected: {r}
[TherapistsAllView] Returning {count} therapists

[AdminTherapistReviewView] Non-admin user {email} attempted review
[AdminTherapistReviewView] Admin {email} attempting to {action} therapist {therapist_email}
[AdminTherapistReviewView] Therapist {email} approved - is_verified={bool}, is_approved={bool}
[AdminTherapistReviewView] Therapist {email} rejected

Frontend Logs (browser console via F12)

[Admin API] fetchAdminStats response: {...}
[Admin API] fetchAdminTherapists response: {...}
[Admin API] reviewTherapist response: {...}
[Admin API] {method} error: {...}

[AdminDashboard] Reviewing therapist: {id} with action: {action}
[AdminDashboard] Review result: {...}
[AdminDashboard] Therapists data: [...]
[AdminDashboard] Pending: {count} Approved: {count}

[VerificationStatus] User therapist status: {status}
[VerificationStatus] Full user data: {...}
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────┐
│          Performance Metrics                    │
└─────────────────────────────────────────────────┘

Database Queries:
├─ /api/therapists/all → 1 query (select_related optimized)
├─ /api/therapists/{id}/verify → 2 queries (get + update)
└─ /api/login → 2 queries (authenticate + get profile)

Network Requests:
├─ Therapist registration → 1 POST
├─ Therapist login → 1 POST (if pending, 2 GET for dashboard data)
├─ Admin fetch therapists → 1 GET (on page load)
├─ Admin approval → 1 PUT + 1 reload (2+ GET requests)
└─ Approved therapist login → 1 POST + 1 redirect

Response Times:
├─ /api/register → ~100-200ms
├─ /api/login → ~50-100ms
├─ /api/therapists/all → ~50-150ms (depends on therapist count)
├─ /api/therapists/{id}/verify → ~50-100ms
└─ Page load with assets → ~1-2s

Caching Opportunities:
├─ /api/therapists/all (cache 1 min for non-admin requests - not needed)
├─ User session (JWT in localStorage)
└─ Therapist profile (cache in AuthContext)
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024-04-19  
**Status**: ✅ Production Ready
