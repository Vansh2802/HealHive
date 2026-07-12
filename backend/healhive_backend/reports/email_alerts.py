"""
email_alerts.py
---------------
Sends a minimal urgent-report email notification to the assigned or on-call
therapist when a SEVERE/CRITICAL/HIGH-severity assessment report is generated.

Rules:
- Only sends severity level, anonymous user ID, timestamp, and a dashboard link.
- Does NOT include any free-text user responses.
- Wraps everything in try/except — failure here must never break report creation.
- Called in a daemon thread from screening_service._persist_report() so it does
  not block the WebSocket consumer.
"""
import logging
import threading

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

URGENT_SEVERITIES = {'SEVERE', 'CRITICAL', 'HIGH', 'EMERGENCY'}


def _build_email_body(report) -> str:
    """Return a minimal plain-text email body (no user responses)."""
    severity = getattr(report, 'severity', 'UNKNOWN') or 'UNKNOWN'
    anon_id = getattr(report, 'session_id', 'unknown-session') or 'unknown-session'
    created_at = getattr(report, 'created_at', None)
    timestamp_str = created_at.strftime('%Y-%m-%d %H:%M UTC') if created_at else 'N/A'

    base_url = getattr(settings, 'APP_BASE_URL', 'http://127.0.0.1:8000')
    dashboard_url = f"{base_url.rstrip('/')}/therapist/dashboard"

    return (
        f"HealHive — Urgent Assessment Alert\n"
        f"{'=' * 40}\n\n"
        f"Severity Level  : {severity}\n"
        f"Anonymous User  : {anon_id}\n"
        f"Report Time     : {timestamp_str}\n\n"
        f"This report has been flagged as requiring immediate therapist review.\n\n"
        f"View the report in your dashboard:\n"
        f"{dashboard_url}\n\n"
        f"{'=' * 40}\n"
        f"This is an automated alert from HealHive. Do not reply to this email.\n"
        f"No user responses are included in this message to preserve anonymity.\n"
    )


def _resolve_therapist_email(report) -> str | None:
    """
    Return the best available therapist email for this report.
    Priority:
      1. report.assigned_therapist.user.email
      2. First verified TherapistProfile email
      3. settings.DEFAULT_FROM_EMAIL (last resort — sends to admin)
    """
    try:
        assigned = getattr(report, 'assigned_therapist', None)
        if assigned and getattr(assigned, 'user', None):
            email = assigned.user.email
            if email:
                return email
    except Exception:
        pass

    # Fall back to any verified therapist
    try:
        from accounts.models import TherapistProfile  # avoid circular at module level
        therapist = (
            TherapistProfile.objects
            .select_related('user')
            .filter(is_verified=True)
            .exclude(user__email='')
            .order_by('id')
            .first()
        )
        if therapist and therapist.user.email:
            return therapist.user.email
    except Exception:
        pass

    # Last resort — notify the from address (typically an admin mailbox)
    fallback = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    return fallback or None


def send_urgent_report_email(report) -> None:
    """
    Public API called by screening_service after persisting an urgent report.
    Safe to call from any thread; exceptions are logged and swallowed.
    """
    try:
        severity = (getattr(report, 'severity', '') or '').upper()
        if severity not in URGENT_SEVERITIES:
            return  # Not urgent — no email needed

        recipient = _resolve_therapist_email(report)
        if not recipient:
            logger.warning(
                '[UrgentReportEmail] No recipient email found for report id=%s severity=%s',
                getattr(report, 'id', '?'), severity,
            )
            return

        subject = f"[HealHive] URGENT: {severity} Risk Assessment Detected"
        body = _build_email_body(report)
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@healhive.com')

        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[recipient],
            fail_silently=False,
        )
        logger.info(
            '[UrgentReportEmail] Alert sent to %s for report id=%s severity=%s',
            recipient, getattr(report, 'id', '?'), severity,
        )
    except Exception as exc:
        # Never propagate — email failure must not break the screening flow
        logger.error(
            '[UrgentReportEmail] Failed to send alert for report id=%s: %s',
            getattr(report, 'id', '?'), exc,
        )


def send_urgent_report_email_async(report) -> None:
    """
    Fire-and-forget wrapper.  Spawns a daemon thread so the WebSocket consumer
    is not blocked while the SMTP handshake is happening.
    """
    t = threading.Thread(target=send_urgent_report_email, args=(report,), daemon=True)
    t.start()
