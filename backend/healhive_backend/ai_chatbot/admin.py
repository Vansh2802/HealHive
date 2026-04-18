from django.contrib import admin
from .models import (
    PsychologicalTest,
    TestQuestion,
    ChatConversation,
    ChatMessage,
    UserTestResponse,
    MentalHealthReport,
)


admin.site.register(PsychologicalTest)
admin.site.register(TestQuestion)
admin.site.register(ChatConversation)
admin.site.register(ChatMessage)
admin.site.register(UserTestResponse)
admin.site.register(MentalHealthReport)
