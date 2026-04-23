from django.db import models


class ChatSession(models.Model):
    STAGE_EMOTIONAL_CHECK = 'emotional_check'
    STAGE_LIFESTYLE_SLEEP = 'lifestyle_sleep'
    STAGE_SOCIAL_WORK = 'social_work'
    STAGE_DEEP_MENTAL_STATE = 'deep_mental_state'
    STAGE_RISK_ASSESSMENT = 'risk_assessment'
    STAGE_ANALYSIS = 'analysis'

    STAGE_CHOICES = [
        (STAGE_EMOTIONAL_CHECK, 'Emotional Check'),
        (STAGE_LIFESTYLE_SLEEP, 'Lifestyle + Sleep'),
        (STAGE_SOCIAL_WORK, 'Social + Work'),
        (STAGE_DEEP_MENTAL_STATE, 'Deep Mental State'),
        (STAGE_RISK_ASSESSMENT, 'Risk Assessment'),
        (STAGE_ANALYSIS, 'Analysis'),
    ]

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
    anonymous_user_id = models.CharField(max_length=64, unique=True, db_index=True, null=True, blank=True)
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
    messages = models.JSONField(default=list, blank=True)
    current_stage = models.CharField(
        max_length=40,
        choices=STAGE_CHOICES,
        default=STAGE_EMOTIONAL_CHECK,
        db_index=True,
    )
    severity_score = models.PositiveIntegerField(default=0)
    severity_level = models.CharField(max_length=20, default='LOW')
    question_count = models.PositiveSmallIntegerField(default=0)
    completed = models.BooleanField(default=False)
    final_report = models.JSONField(default=dict, blank=True)
    report_visible_to_therapist = models.BooleanField(default=True)
    report_visible_to_user = models.BooleanField(default=False)
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
