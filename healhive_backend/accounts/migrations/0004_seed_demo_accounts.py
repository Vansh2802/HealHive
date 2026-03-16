from django.db import migrations
from django.contrib.auth.hashers import make_password


def seed_demo_accounts(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    TherapistProfile = apps.get_model('accounts', 'TherapistProfile')
    PatientProfile = apps.get_model('accounts', 'PatientProfile')

    user_email = 'user@healhive.com'
    therapist_email = 'therapist@healhive.com'

    user = User.objects.filter(email=user_email).first()
    if not user:
        user = User(
            username=user_email,
            email=user_email,
            full_name='Demo User',
            role='user',
            is_active=True,
            password=make_password('user123'),
        )
        user.save()

    PatientProfile.objects.get_or_create(user=user)

    therapist = User.objects.filter(email=therapist_email).first()
    if not therapist:
        therapist = User(
            username=therapist_email,
            email=therapist_email,
            full_name='Demo Therapist',
            role='therapist',
            is_active=True,
            password=make_password('therapist123'),
        )
        therapist.save()

    TherapistProfile.objects.get_or_create(
        user=therapist,
        defaults={
            'specialization': 'General Counseling',
            'license_number': 'THERAPIST-DEMO-001',
            'university_name': 'HealHive Institute',
            'bio': 'Demo therapist account',
            'is_verified': True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_therapistprofile_university_name'),
    ]

    operations = [
        migrations.RunPython(seed_demo_accounts, migrations.RunPython.noop),
    ]
