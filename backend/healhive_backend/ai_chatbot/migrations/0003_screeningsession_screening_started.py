from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_chatbot', '0002_screeningsession'),
    ]

    operations = [
        migrations.AddField(
            model_name='screeningsession',
            name='screening_started',
            field=models.BooleanField(default=False),
        ),
    ]
