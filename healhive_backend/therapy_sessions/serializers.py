from django.utils import timezone
from rest_framework import serializers
from accounts.models import TherapistProfile, PatientProfile
from .models import TherapySession


class TherapySessionSerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source='therapist.user.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)

    class Meta:
        model = TherapySession
        fields = [
            'id', 'therapist', 'therapist_name', 'patient', 'patient_name', 'session_time',
            'session_status', 'room_id', 'meeting_link', 'session_start_time', 'session_end_time',
            'feedback_rating', 'feedback_text', 'feedback_submitted_at',
            'followup_email_sent', 'created_at'
        ]


class BookSessionSerializer(serializers.Serializer):
    therapist_id = serializers.IntegerField()
    session_time = serializers.DateTimeField()

    def validate_session_time(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError('session_time must be in the future.')
        return value

    def validate_therapist_id(self, value):
        if not TherapistProfile.objects.filter(id=value, is_verified=True).exists():
            raise serializers.ValidationError('Therapist not found or not verified.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        patient_profile, _ = PatientProfile.objects.get_or_create(user=user)
        therapist = TherapistProfile.objects.get(id=validated_data['therapist_id'])

        session = TherapySession.objects.create(
            therapist=therapist,
            patient=patient_profile,
            session_time=validated_data['session_time'],
        )
        return session
