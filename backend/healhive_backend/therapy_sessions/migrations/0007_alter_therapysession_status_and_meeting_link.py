from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('therapy_sessions', '0006_session'),
    ]

    operations = [
        migrations.AlterField(
            model_name='therapysession',
            name='meeting_link',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='therapysession',
            name='session_status',
            field=models.CharField(
                choices=[
                    ('confirmed', 'Confirmed'),
                    ('scheduled', 'Scheduled'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='confirmed',
                max_length=20,
            ),
        ),
    ]
