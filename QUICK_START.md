# 🚀 Quick Start - Therapist Approval System

## What's Fixed ✅

1. ✅ Backend now exposes `/api/therapists/all` endpoint for admin
2. ✅ Therapist login allows pending therapists (no longer blocked)
3. ✅ User data includes `therapistStatus` field ('pending'/'approved'/'rejected')
4. ✅ Frontend VerificationStatus component checks therapist status
5. ✅ Admin dashboard properly fetches and displays pending therapists
6. ✅ Admin can approve/reject therapists
7. ✅ Comprehensive logging added for debugging

---

## Immediate Next Steps (Copy & Paste)

### Step 1: Start Backend Server
```bash
cd backend/healhive_backend
python manage.py runserver
```

Watch for logs starting with `[RegisterView]`, `[LoginView]`, `[AdminTherapistReviewView]`

### Step 2: Start Frontend Server (New Terminal)
```bash
cd frontend
npm run dev
```

### Step 3: Create Test Users

#### Admin Account (if not exists)
```bash
# In another terminal
cd backend/healhive_backend
python manage.py shell
```

```python
from accounts.models import User
User.objects.create_superuser(
    username='admin@healhive.com',
    email='admin@healhive.com',
    password='AdminPassword123',
    full_name='Admin User',
    role='admin'
)
exit()
```

---

## Complete Test Flow (5 minutes)

1. **Register Therapist**
   - Navigate to http://localhost:5173/therapist/signup
   - Fill form with test data
   - See "Application Submitted!" message
   - **Check backend logs** for: `[RegisterView] Therapist pending approval`

2. **Check Admin Dashboard**
   - Login as admin: admin@healhive.com / AdminPassword123
   - Click "Therapists" tab
   - **Should see** therapist in "Pending Approval" section
   - **Check backend logs** for: `[TherapistsAllView] Status breakdown - Pending: 1`

3. **Approve Therapist**
   - Click "Approve" button
   - See success toast
   - Page auto-reloads
   - **Therapist should move** to "Verified Therapists" section
   - **Check backend logs** for: `[AdminTherapistReviewView] Therapist ... approved`

4. **Login as Approved Therapist**
   - Logout from admin
   - Go to therapist login
   - Login with therapist email/password
   - **Should see** "You're verified!" and redirect to dashboard
   - **Check browser console** for: `[VerificationStatus] User therapist status: approved`

5. **Verify Database State**
   ```python
   from accounts.models import TherapistProfile
   t = TherapistProfile.objects.first()
   print(t.is_approved, t.is_verified)  # Should be: True, True
   ```

---

## Browser Console Debugging

Open DevTools (F12) and check Console tab:

```
✅ Should see:
[Admin API] fetchAdminTherapists response: {...}
[AdminDashboard] Therapists data: [...]
[AdminDashboard] Pending: 1 Approved: 0
[VerificationStatus] User therapist status: pending
```

---

## Backend Console Debugging

Watch terminal running `python manage.py runserver`:

```
✅ Should see:
[RegisterView] User created: test@clinic.com, role: therapist
[RegisterView] TherapistProfile created: 1, is_verified=False, is_approved=False
[LoginView] Therapist login: test@clinic.com, status: is_approved=False, is_verified=False
[TherapistsAllView] Fetching all therapists: 1 total
[TherapistsAllView] Status breakdown - Pending: 1, Approved: 0, Rejected: 0
[AdminTherapistReviewView] Admin ... attempting to approve therapist test@clinic.com
[AdminTherapistReviewView] Therapist test@clinic.com approved - is_verified=True, is_approved=True
```

---

## If Something's Not Working

### Admin Dashboard Shows 0 Pending?
1. Check browser console for API errors
2. Check backend logs for `[TherapistsAllView]` messages
3. Verify therapist exists in database:
   ```python
   from accounts.models import TherapistProfile
   print(TherapistProfile.objects.count())
   ```

### Therapist Can't Login?
1. Check backend logs for `[LoginView]` messages
2. Verify therapist profile exists:
   ```python
   u = User.objects.get(email='test@clinic.com')
   print(u.therapist_profile)
   ```

### Approval Button Doesn't Work?
1. Check browser Network tab for PUT request errors
2. Verify admin account is actually admin:
   ```python
   u = User.objects.get(email='admin@healhive.com')
   print(u.role)  # Should be 'admin'
   ```

---

## Key Files Changed

**Backend:**
- `backend/healhive_backend/accounts/serializers.py` - Added therapistStatus field
- `backend/healhive_backend/accounts/views.py` - Added TherapistsAllView + logging
- `backend/healhive_backend/accounts/urls.py` - Added new endpoints

**Frontend:**
- `frontend/src/services/api/admin.js` - Added logging
- `frontend/src/pages/therapist/VerificationStatus.jsx` - Check therapistStatus
- `frontend/src/pages/admin/AdminDashboard.jsx` - Fix filtering + logging

---

## Full Documentation

See `THERAPIST_APPROVAL_SYSTEM_FIX.md` for:
- Detailed testing steps
- API reference
- Data structure documentation
- Common issues & fixes
- Deployment checklist

---

**Status**: ✅ Ready for Testing  
**Time to Test**: ~5 minutes  
**Questions?** Check the logs first!
