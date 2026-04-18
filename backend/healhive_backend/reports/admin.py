from django.contrib import admin
from .models import AssessmentReport


@admin.register(AssessmentReport)
class AssessmentReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_id', 'tool_used', 'score', 'severity', 'created_at')
    search_fields = ('session_id', 'severity', 'tool_used')
