from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

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
    list_display = (
        'id',
        'therapist_name',
        'therapist_email',
        'approval_status_badge',
        'is_approved',
        'is_rejected',
        'application_date',
    )
    list_filter = ('is_approved', 'is_rejected', 'specialization')
    search_fields = ('user__full_name', 'user__email', 'license_number')
    ordering = ('-application_date',)
    actions = ('approve_therapists', 'reject_therapists')

    @admin.display(description='Name', ordering='user__full_name')
    def therapist_name(self, obj):
        return obj.user.full_name

    @admin.display(description='Email', ordering='user__email')
    def therapist_email(self, obj):
        return obj.user.email

    @admin.display(description='Status')
    def approval_status_badge(self, obj):
        if obj.is_approved or obj.is_verified:
            return format_html('<span style="color:#0f766e;font-weight:600;">Approved</span>')
        if obj.is_rejected:
            return format_html('<span style="color:#b91c1c;font-weight:600;">Rejected</span>')
        # Pending applications are highlighted for quick admin triage.
        return format_html('<span style="color:#b45309;font-weight:600;">Pending</span>')

    @admin.action(description='Approve selected therapists')
    def approve_therapists(self, request, queryset):
        approved_count = 0
        for profile in queryset.select_related('user'):
            profile.approve()
            profile.save(update_fields=['is_approved', 'is_rejected', 'is_verified', 'approval_date'])
            if not profile.user.is_active:
                profile.user.is_active = True
                profile.user.save(update_fields=['is_active'])
            approved_count += 1
        self.message_user(request, f'Approved {approved_count} therapist application(s).')

    @admin.action(description='Reject selected therapists')
    def reject_therapists(self, request, queryset):
        rejected_count = 0
        for profile in queryset.select_related('user'):
            profile.reject()
            profile.save(update_fields=['is_approved', 'is_rejected', 'is_verified', 'approval_date'])
            if profile.user.is_active:
                profile.user.is_active = False
                profile.user.save(update_fields=['is_active'])
            rejected_count += 1
        self.message_user(request, f'Rejected {rejected_count} therapist application(s).')


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'assigned_therapist')
