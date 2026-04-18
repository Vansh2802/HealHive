from rest_framework import serializers
from .models import AssessmentReport, TherapyRequest


class AssessmentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentReport
        fields = [
            'id',
            'session_id',
            'user',
            'assigned_therapist',
            'user_message',
            'therapist_report',
            'tool_used',
            'score',
            'severity',
            'indicators',
            'ai_summary',
            'recommendation',
            'screening_answers',
            'status',
            'created_at',
        ]


class AssessmentReportCreateSerializer(serializers.Serializer):
    sessionId = serializers.CharField(max_length=128)
    userMessage = serializers.CharField()
    therapistReport = serializers.CharField()
    toolUsed = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    score = serializers.IntegerField(required=False, allow_null=True)
    severity = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    indicators = serializers.ListField(child=serializers.CharField(), required=False)
    summary = serializers.CharField(required=False, allow_blank=True)
    recommendation = serializers.CharField(required=False, allow_blank=True)
    answers = serializers.ListField(child=serializers.DictField(), required=False)

    def create(self, validated_data):
        request = self.context.get('request')
        current_user = request.user if request and getattr(request.user, 'is_authenticated', False) else None

        defaults = {
            'user': current_user,
            'user_message': validated_data['userMessage'],
            'therapist_report': validated_data['therapistReport'],
            'tool_used': validated_data.get('toolUsed'),
            'score': validated_data.get('score'),
            'severity': validated_data.get('severity'),
        }

        if 'indicators' in validated_data:
            defaults['indicators'] = validated_data.get('indicators')
        if 'summary' in validated_data:
            defaults['ai_summary'] = validated_data.get('summary')
        if 'recommendation' in validated_data:
            defaults['recommendation'] = validated_data.get('recommendation')
        if 'answers' in validated_data:
            defaults['screening_answers'] = validated_data.get('answers')

        report = AssessmentReport.objects.filter(session_id=validated_data['sessionId']).order_by('-id').first()
        if report:
            for field, value in defaults.items():
                setattr(report, field, value)
            report.save()
        else:
            report = AssessmentReport.objects.create(session_id=validated_data['sessionId'], **defaults)
        return report


class TherapyRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    assigned_therapist_name = serializers.CharField(source='assigned_therapist.user.full_name', read_only=True)
    report = AssessmentReportSerializer(read_only=True)

    class Meta:
        model = TherapyRequest
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'report',
            'assigned_therapist',
            'assigned_therapist_name',
            'status',
            'created_at',
            'updated_at',
        ]
