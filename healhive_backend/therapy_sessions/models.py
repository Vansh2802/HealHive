import uuid
from django.db import models
from accounts.models import TherapistProfile, PatientProfile


class TherapySession(models.Model):
    STATUS_SCHEDULED = 'scheduled'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'

    SESSION_STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    therapist = models.ForeignKey(TherapistProfile, on_delete=models.CASCADE, related_name='sessions')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='sessions')
    session_time = models.DateTimeField()
    session_status = models.CharField(max_length=20, choices=SESSION_STATUS_CHOICES, default=STATUS_SCHEDULED)
    room_id = models.CharField(max_length=64, unique=True, blank=True)
    meeting_link = models.URLField(blank=True)
    session_start_time = models.DateTimeField(null=True, blank=True)
    session_end_time = models.DateTimeField(null=True, blank=True)
    feedback_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback_text = models.TextField(blank=True)
    feedback_submitted_at = models.DateTimeField(null=True, blank=True)
    followup_email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['session_time']

    def __str__(self):
        return f"{self.patient.user.full_name} with {self.therapist.user.full_name}"

    def save(self, *args, **kwargs):
        if not self.room_id:
            self.room_id = str(uuid.uuid4())
        if not self.meeting_link:
            self.meeting_link = f"/video-call/{self.room_id}/"
        super().save(*args, **kwargs)
