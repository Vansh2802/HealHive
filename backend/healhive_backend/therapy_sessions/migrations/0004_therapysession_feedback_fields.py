from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('therapy_sessions', '0003_therapysession_followup_email_sent'),
    ]

    operations = [
        migrations.AddField(
            model_name='therapysession',
            name='feedback_rating',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='therapysession',
            name='feedback_submitted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='therapysession',
            name='feedback_text',
            field=models.TextField(blank=True),
        ),
    ]
