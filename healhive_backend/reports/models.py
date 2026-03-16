from django.conf import settings
from django.db import models


class AssessmentReport(models.Model):
    STATUS_UNREVIEWED = 'unreviewed'
    STATUS_REVIEWED = 'reviewed'
    STATUS_CHOICES = [
        (STATUS_UNREVIEWED, 'Unreviewed'),
        (STATUS_REVIEWED, 'Reviewed'),
    ]

    session_id = models.CharField(max_length=128)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessment_reports',
    )
    assigned_therapist = models.ForeignKey(
        'accounts.TherapistProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_reports',
    )
    user_message = models.TextField()
    therapist_report = models.TextField()
    tool_used = models.CharField(max_length=128, null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    severity = models.CharField(max_length=64, null=True, blank=True)
    indicators = models.JSONField(default=list, blank=True)
    ai_summary = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)
    screening_answers = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_UNREVIEWED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report {self.id} - session {self.session_id}"


class TherapyRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ASSIGNED = 'assigned'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ASSIGNED, 'Assigned'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='therapy_requests',
    )
    report = models.OneToOneField(AssessmentReport, on_delete=models.CASCADE, related_name='therapy_request')
    assigned_therapist = models.ForeignKey(
        'accounts.TherapistProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='therapy_requests',
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TherapyRequest {self.id} - report {self.report_id}"
