"""
therapy_sessions/tests.py
--------------------------
Task 8: End-to-end booking flow test.

Tests:
  1. Booking creates TherapySession with correct patient FK.
  2. Patient's session list reflects the booked session as "upcoming".
  3. After session_end_time passes, the same session moves to "completed"
     on the patient side (via the current_status property).
  4. PatientProfile created lazily by SessionListView.
"""
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import PatientProfile, TherapistProfile, User
from therapy_sessions.models import Availability, TherapySession


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_patient(email='patient@test.com', password='pass12345'):
    return User.objects.create_user(
        username=email,
        email=email,
        password=password,
        full_name='Test Patient',
        role=User.ROLE_USER,
    )


def make_therapist(email='therapist@test.com', password='pass12345'):
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        full_name='Dr. Test',
        role=User.ROLE_THERAPIST,
    )
    profile = TherapistProfile.objects.create(
        user=user,
        specialization='General',
        is_verified=True,
        is_approved=True,
    )
    return user, profile


def make_availability(therapist_profile, start, end):
    return Availability.objects.create(
        therapist=therapist_profile,
        start_time=start,
        end_time=end,
        is_booked=False,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class BookingFlowTest(TestCase):
    """
    End-to-end test for the patient booking flow:
      book → appears in upcoming → time passes → moves to completed.
    """

    def setUp(self):
        self.patient_user = make_patient()
        self.therapist_user, self.therapist_profile = make_therapist()

        # Slot 2 hours in the future, 1-hour duration
        self.slot_start = timezone.now() + timedelta(hours=2)
        self.slot_end = self.slot_start + timedelta(hours=1)
        self.slot = make_availability(self.therapist_profile, self.slot_start, self.slot_end)

        # Use DRF's APIClient which supports force_authenticate (bypasses JWT)
        self.client = APIClient()

    # ------------------------------------------------------------------
    # 1. Booking creates TherapySession with correct patient FK
    # ------------------------------------------------------------------
    def test_booking_creates_session_with_correct_patient(self):
        """POST /api/sessions/book → 201, TherapySession exists, patient FK is correct."""
        self.client.force_authenticate(user=self.patient_user)

        url = reverse('book-session')
        payload = {
            'therapist_id': self.therapist_profile.id,
            'availability_id': self.slot.id,
            'start_time': self.slot_start.isoformat(),
            'end_time': self.slot_end.isoformat(),
        }
        response = self.client.post(url, data=payload, format='json')

        self.assertEqual(response.status_code, 201, response.json())
        data = response.json()
        self.assertTrue(data['success'])

        # Verify a TherapySession was created
        self.assertEqual(TherapySession.objects.count(), 1)
        session = TherapySession.objects.first()

        # (1) Patient FK is the patient who made the request
        self.assertEqual(session.patient.user_id, self.patient_user.id)

        # (2) Therapist FK is correct
        self.assertEqual(session.therapist_id, self.therapist_profile.id)

        # (3) Availability slot is now marked booked
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_booked)

    # ------------------------------------------------------------------
    # 2. Patient's session list shows the booked session as "upcoming"
    # ------------------------------------------------------------------
    def test_patient_upcoming_sessions_visible_after_booking(self):
        """After booking, GET /api/sessions returns the session as 'upcoming' for the patient."""
        self.client.force_authenticate(user=self.patient_user)

        # Create the PatientProfile and session directly (simulating a completed booking)
        patient_profile, _ = PatientProfile.objects.get_or_create(user=self.patient_user)
        session = TherapySession.objects.create(
            therapist=self.therapist_profile,
            patient=patient_profile,
            session_time=self.slot_start,
            session_end_time=self.slot_end,
            session_status=TherapySession.STATUS_CONFIRMED,
            meeting_link='https://meet.example.com/test-room',
        )

        url = reverse('session-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

        sessions = data['sessions']
        self.assertEqual(len(sessions), 1, "Patient should see exactly 1 session")

        returned_session = sessions[0]
        self.assertEqual(returned_session['id'], session.id)
        # current_status property should return 'upcoming' (start is 2h in the future)
        self.assertEqual(returned_session['status'], 'upcoming')

    # ------------------------------------------------------------------
    # 3. After end_time passes, session moves to "completed"
    # ------------------------------------------------------------------
    def test_session_moves_to_completed_after_end_time(self):
        """When timezone.now() is past session_end_time, status becomes 'completed'."""
        self.client.force_authenticate(user=self.patient_user)

        patient_profile, _ = PatientProfile.objects.get_or_create(user=self.patient_user)
        session = TherapySession.objects.create(
            therapist=self.therapist_profile,
            patient=patient_profile,
            session_time=self.slot_start,
            session_end_time=self.slot_end,
            session_status=TherapySession.STATUS_CONFIRMED,
        )

        # Patch timezone.now() to be 5 minutes after the session's end time
        future_now = self.slot_end + timedelta(minutes=5)
        with patch('django.utils.timezone.now', return_value=future_now):
            # Verify the property itself
            self.assertEqual(session.current_status, 'completed')

            # Also verify via the API response
            url = reverse('session-list')
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data['success'])

            sessions = data['sessions']
            self.assertEqual(len(sessions), 1)
            self.assertEqual(sessions[0]['status'], 'completed')

    # ------------------------------------------------------------------
    # 4. PatientProfile is created lazily for patients without one
    # ------------------------------------------------------------------
    def test_session_list_creates_patient_profile_lazily(self):
        """
        GET /api/sessions must not 401/error for a patient whose
        PatientProfile row does not yet exist — it is created lazily.
        """
        self.client.force_authenticate(user=self.patient_user)

        # Make sure no PatientProfile exists before the request
        PatientProfile.objects.filter(user=self.patient_user).delete()
        self.assertFalse(PatientProfile.objects.filter(user=self.patient_user).exists())

        url = reverse('session-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        # Profile should now exist
        self.assertTrue(PatientProfile.objects.filter(user=self.patient_user).exists())
