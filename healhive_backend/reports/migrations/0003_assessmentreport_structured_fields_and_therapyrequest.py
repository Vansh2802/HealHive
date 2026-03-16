from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_therapistprofile_university_name'),
        ('reports', '0002_assessmentreport_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='assessmentreport',
            name='ai_summary',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='assessmentreport',
            name='assigned_therapist',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_reports', to='accounts.therapistprofile'),
        ),
        migrations.AddField(
            model_name='assessmentreport',
            name='indicators',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='assessmentreport',
            name='recommendation',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='assessmentreport',
            name='screening_answers',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='assessmentreport',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assessment_reports', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='TherapyRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('assigned', 'Assigned'), ('in_progress', 'In Progress'), ('completed', 'Completed')], default='pending', max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_therapist', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='therapy_requests', to='accounts.therapistprofile')),
                ('report', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='therapy_request', to='reports.assessmentreport')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='therapy_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
