from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_USER = 'user'
    ROLE_THERAPIST = 'therapist'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_THERAPIST, 'Therapist'),
        (ROLE_ADMIN, 'Admin'),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    mental_health_history = models.TextField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_USER)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class TherapistProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='therapist_profile')
    specialization = models.CharField(max_length=255, blank=True)
    license_number = models.CharField(max_length=128, blank=True)
    university_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.full_name


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    assigned_therapist = models.ForeignKey(
        TherapistProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patients',
    )

    def __str__(self):
        return self.user.full_name
