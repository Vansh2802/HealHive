from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('therapy_sessions', '0009_alter_therapysession_meeting_link'),
    ]

    operations = [
        migrations.AlterField(
            model_name='therapysession',
            name='meeting_link',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='session',
            name='meeting_link',
            field=models.URLField(blank=True, null=True),
        ),
    ]
