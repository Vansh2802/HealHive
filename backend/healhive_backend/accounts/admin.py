from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TherapistProfile, PatientProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('id', 'email', 'full_name', 'role', 'is_staff', 'created_at')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    ordering = ('-created_at',)
    fieldsets = UserAdmin.fieldsets + (
        ('HealHive', {'fields': ('full_name', 'role')}),
    )


@admin.register(TherapistProfile)
class TherapistProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'specialization', 'license_number', 'university_name', 'is_verified')


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'assigned_therapist')
