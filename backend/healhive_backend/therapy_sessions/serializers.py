
from datetime import timedelta

from django.utils import timezone
from django.db import transaction
from rest_framework import serializers
from accounts.models import TherapistProfile, PatientProfile
from .models import TherapySession, Availability


class AvailabilitySerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source='therapist.user.full_name', read_only=True)

    class Meta:
        model = Availability
        fields = [
            'id', 'therapist', 'therapist_name', 'start_time', 'end_time', 'is_booked', 'created_at'
        ]


class TherapySessionSerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source='therapist.user.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    status = serializers.CharField(source='current_status', read_only=True)

    class Meta:
        model = TherapySession
        fields = [
            'id', 'therapist', 'therapist_name', 'patient', 'patient_name', 'session_time',
            'session_status', 'status', 'room_id', 'meeting_link', 'google_event_id', 
            'session_start_time', 'session_end_time',
            'feedback_rating', 'feedback_text', 'feedback_submitted_at',
            'followup_email_sent', 'created_at'
        ]


class BookSessionSerializer(serializers.Serializer):
    therapist_id = serializers.IntegerField()
    session_time = serializers.DateTimeField(required=False)
    start_time = serializers.DateTimeField(required=False)
    end_time = serializers.DateTimeField(required=False)
    availability_id = serializers.IntegerField(required=False, allow_null=True)

    def _get_start_end_times(self, attrs):
        start_time = attrs.get('start_time') or attrs.get('session_time')
        end_time = attrs.get('end_time')

        if not start_time:
            raise serializers.ValidationError({'start_time': 'start_time (or session_time) is required.'})

        if end_time and end_time <= start_time:
            raise serializers.ValidationError({'end_time': 'end_time must be after start_time.'})

        return start_time, end_time

    def validate(self, data):
        """Validate that slot exists, times are consistent, and start_time is in the future."""
        start_time, end_time = self._get_start_end_times(data)

        if start_time <= timezone.now():
            raise serializers.ValidationError({'start_time': 'start_time must be in the future.'})

        availability_id = data.get('availability_id')
        therapist_id = data.get('therapist_id')

        if availability_id:
            try:
                availability = Availability.objects.get(id=availability_id, therapist_id=therapist_id)
            except Availability.DoesNotExist:
                raise serializers.ValidationError({'availability_id': 'Selected time slot not found.'})

            if availability.is_booked:
                raise serializers.ValidationError({'availability_id': 'This time slot is already booked.'})

            if availability.start_time != start_time:
                raise serializers.ValidationError({'start_time': 'Session start time does not match the selected slot.'})

            if end_time and availability.end_time != end_time:
                raise serializers.ValidationError({'end_time': 'Session end time does not match the selected slot.'})

        data['start_time'] = start_time
        data['end_time'] = end_time
        data['session_time'] = start_time
        return data

    def validate_therapist_id(self, value):
        if not TherapistProfile.objects.filter(id=value, is_approved=True).exists() and not TherapistProfile.objects.filter(id=value, is_verified=True).exists():
            raise serializers.ValidationError('Therapist not found or not approved.')
        return value

    def create(self, validated_data):
        meeting_link = self.context.get('meeting_link')
        google_event_id = self.context.get('google_event_id')

        if not meeting_link:
            raise serializers.ValidationError({'meeting_link': 'meeting_link is required to create a session.'})

        user = self.context['request'].user
        patient_profile, _ = PatientProfile.objects.get_or_create(user=user)
        therapist = TherapistProfile.objects.get(id=validated_data['therapist_id'])
        availability_id = validated_data.get('availability_id')

        start_time = validated_data['start_time']
        end_time = validated_data.get('end_time')

        with transaction.atomic():
            if availability_id:
                availability = Availability.objects.select_for_update().filter(
                    id=availability_id,
                    therapist_id=therapist.id,
                ).first()
                if not availability:
                    raise serializers.ValidationError({'availability_id': 'Selected time slot not found.'})
                if availability.is_booked:
                    raise serializers.ValidationError({'availability_id': 'This time slot is already booked.'})

                availability.is_booked = True
                availability.save(update_fields=['is_booked'])

                if availability.start_time != start_time:
                    raise serializers.ValidationError({'start_time': 'Session start time does not match the selected slot.'})

                if end_time and availability.end_time != end_time:
                    raise serializers.ValidationError({'end_time': 'Session end time does not match the selected slot.'})

            if not end_time:
                end_time = start_time + timedelta(hours=1)

            session = TherapySession.objects.create(
                therapist=therapist,
                patient=patient_profile,
                session_time=start_time,
                session_status=TherapySession.STATUS_CONFIRMED,
                meeting_link=meeting_link,
                google_event_id=google_event_id,
                session_end_time=end_time,
            )

        return session
