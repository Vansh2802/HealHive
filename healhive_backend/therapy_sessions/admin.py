from django.contrib import admin
from .models import TherapySession, Availability
@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'therapist', 'start_time', 'end_time', 'is_booked')
    search_fields = ('therapist__user__full_name',)


@admin.register(TherapySession)
class TherapySessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'therapist', 'patient', 'session_time', 'session_status', 'room_id')
    search_fields = ('room_id', 'therapist__user__full_name', 'patient__user__full_name')
