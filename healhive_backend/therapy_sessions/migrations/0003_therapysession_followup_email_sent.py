from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('therapy_sessions', '0002_therapysession_session_end_time_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='therapysession',
            name='followup_email_sent',
            field=models.BooleanField(default=False),
        ),
    ]
