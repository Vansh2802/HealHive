from django.db import models


class ChatSession(models.Model):
    MODE_AI = 'ai'
    MODE_THERAPIST = 'therapist'

    MODE_CHOICES = [
        (MODE_AI, 'AI'),
        (MODE_THERAPIST, 'Therapist'),
    ]

    SEVERITY_LOW = 'low'
    SEVERITY_MEDIUM = 'medium'
    SEVERITY_HIGH = 'high'

    SEVERITY_CHOICES = [
        (SEVERITY_LOW, 'Low'),
        (SEVERITY_MEDIUM, 'Medium'),
        (SEVERITY_HIGH, 'High'),
    ]

    session_id = models.CharField(max_length=128, unique=True, db_index=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_sessions',
    )
    therapist = models.ForeignKey(
        'accounts.TherapistProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_sessions',
    )
    current_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default=MODE_AI)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_LOW)
    escalated_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'ChatSession({self.session_id})'


class ChatTherapistAssignment(models.Model):
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='assignments')
    therapist = models.ForeignKey(
        'accounts.TherapistProfile',
        on_delete=models.CASCADE,
        related_name='chat_assignments',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['chat_session', 'assigned_at']),
        ]

    def __str__(self):
        return f'{self.chat_session.session_id} -> {self.therapist.user.full_name}'
