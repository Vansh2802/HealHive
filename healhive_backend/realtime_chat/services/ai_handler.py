from __future__ import annotations

from dataclasses import dataclass


HIGH_RISK_KEYWORDS = {
    'suicide',
    'kill myself',
    'end my life',
    'self harm',
    'self-harm',
    'harm myself',
}

MEDIUM_RISK_KEYWORDS = {
    'anxious',
    'panic',
    'overwhelmed',
    'hopeless',
    'worthless',
}


@dataclass(frozen=True)
class AIResponse:
    session_id: str
    sender_type: str
    content: str
    severity: str = 'low'
    should_escalate: bool = False
    reason: str = ''

    def to_payload(self) -> dict:
        return {
            'session_id': self.session_id,
            'sender_type': self.sender_type,
            'content': self.content,
            'severity': self.severity,
            'should_escalate': self.should_escalate,
            'reason': self.reason,
        }


async def generate_ai_response(session_id: str, message: str) -> dict:
    """Deterministic placeholder until the production AI pipeline is connected."""
    normalized_message = (message or '').lower()

    if any(keyword in normalized_message for keyword in HIGH_RISK_KEYWORDS):
        response = AIResponse(
            session_id=session_id,
            sender_type='ai',
            severity='high',
            should_escalate=True,
            reason='High-risk language detected',
            content=(
                'I am really sorry you are dealing with this. '
                'A licensed therapist should join this conversation right away. '
                'If you are in immediate danger, call local emergency services now.'
            ),
        )
        return response.to_payload()

    severity = 'medium' if any(keyword in normalized_message for keyword in MEDIUM_RISK_KEYWORDS) else 'low'
    content = f"I hear you. You said: {message}"

    return AIResponse(
        session_id=session_id,
        sender_type='ai',
        content=content,
        severity=severity,
        should_escalate=False,
        reason='Distress language detected' if severity == 'medium' else '',
    ).to_payload()
