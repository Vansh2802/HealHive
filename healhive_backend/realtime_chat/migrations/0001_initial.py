from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(db_index=True, max_length=128)),
                (
                    'sender_type',
                    models.CharField(
                        choices=[('user', 'User'), ('ai', 'AI'), ('therapist', 'Therapist')],
                        max_length=20,
                    ),
                ),
                ('content', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'ordering': ['timestamp'],
                'indexes': [models.Index(fields=['session_id', 'timestamp'], name='realtime_ch_session_12c773_idx')],
            },
        ),
    ]
