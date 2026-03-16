from django.conf import settings
from django.db import models


class PsychologicalTest(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class TestQuestion(models.Model):
    test = models.ForeignKey(PsychologicalTest, on_delete=models.CASCADE, related_name='questions')
    order = models.PositiveIntegerField()
    question_text = models.TextField()
    options_json = models.JSONField(default=list)

    class Meta:
        unique_together = ('test', 'order')
        ordering = ['order']

    def __str__(self):
        return f"{self.test.code} Q{self.order}"


class ChatConversation(models.Model):
    STATE_INTAKE = 'intake'
    STATE_ASSESSMENT = 'assessment'
    STATE_REPORT_READY = 'report_ready'

    STATE_CHOICES = [
        (STATE_INTAKE, 'Intake'),
        (STATE_ASSESSMENT, 'Assessment'),
        (STATE_REPORT_READY, 'Report Ready'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_conversations')
    title = models.CharField(max_length=180, blank=True)
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default=STATE_INTAKE)
    detected_emotion = models.CharField(max_length=32, blank=True)
    active_test = models.ForeignKey(
        PsychologicalTest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_conversations',
    )
    current_question_index = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class ChatMessage(models.Model):
    ROLE_USER = 'user'
    ROLE_ASSISTANT = 'assistant'
    ROLE_SYSTEM = 'system'

    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_ASSISTANT, 'Assistant'),
        (ROLE_SYSTEM, 'System'),
    ]

    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class UserTestResponse(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='test_responses')
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='responses')
    test = models.ForeignKey(PsychologicalTest, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(TestQuestion, on_delete=models.CASCADE, related_name='responses')
    score = models.IntegerField()
    answer_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('conversation', 'question')


class MentalHealthReport(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mental_health_reports')
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='reports')
    test = models.ForeignKey(PsychologicalTest, on_delete=models.CASCADE, related_name='reports')
    total_score = models.IntegerField()
    severity_level = models.CharField(max_length=120)
    emotional_observations = models.TextField()
    recommended_next_steps = models.TextField()
    suggested_therapy_options = models.TextField()
    structured_json = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class ScreeningSession(models.Model):
    session_id = models.CharField(max_length=128, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='screening_sessions',
    )
    current_question_index = models.PositiveIntegerField(default=0)
    screening_started = models.BooleanField(default=False)
    chat_turns = models.PositiveIntegerField(default=0)
    chat_history = models.JSONField(default=list, blank=True)
    responses = models.JSONField(default=list, blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.session_id
