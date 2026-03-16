from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TherapySession


@receiver(post_save, sender=TherapySession)
def send_followup_after_completion(sender, instance: TherapySession, created: bool, **kwargs):
    return
