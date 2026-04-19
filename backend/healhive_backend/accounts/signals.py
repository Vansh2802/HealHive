import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import TherapistProfile


logger = logging.getLogger(__name__)


@receiver(post_save, sender=TherapistProfile)
def therapist_approved_notification_placeholder(sender, instance: TherapistProfile, created: bool, **kwargs):
    """Placeholder hook for therapist approval notifications."""
    if created:
        return

    if instance.is_approved:
        logger.info('Therapist approved notification placeholder: therapist_id=%s', instance.id)