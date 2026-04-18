from __future__ import annotations

from dataclasses import dataclass
import re


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

LOW_SIGNAL_KEYWORDS = {
    'stressed',
    'tired',
    'busy',
    'pressure',
    'worried',
}

GREETING_KEYWORDS = {'hi', 'hello', 'hey'}

SHORT_UNCLEAR_PATTERNS = {
    'ok',
    'okay',
    'k',
    'hmm',
    'hm',
    'idk',
    'i dont know',
    "i don't know",
    'not sure',
}

CRITICAL_SUPPORT_MESSAGE = (
    "I am really sorry this feels so heavy right now. "
    "You do not have to carry this alone, and your safety matters most. "
    "Would you feel okay reaching out to someone you trust right now while we stay with this together?"
)


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
    """Rule-based empathic responder used by realtime chat until full LLM orchestration is enabled."""
    normalized_message = (message or '').lower()
    message_type = _classify_message_type(normalized_message)

    if message_type == 'serious_risk':
        response = AIResponse(
            session_id=session_id,
            sender_type='ai',
            severity='critical',
            should_escalate=True,
            reason='High-risk language detected',
            content=CRITICAL_SUPPORT_MESSAGE,
        )
        return response.to_payload()

    severity = _classify_severity(normalized_message, message_type)
    content = _build_supportive_reply(severity, message_type)

    return AIResponse(
        session_id=session_id,
        sender_type='ai',
        content=content,
        severity=severity,
        should_escalate=False,
        reason='Distress language detected' if severity in {'medium', 'high'} else '',
    ).to_payload()


def _classify_message_type(normalized_message: str) -> str:
    compact = re.sub(r'\s+', ' ', normalized_message).strip(' .,!?:;')
    if not compact:
        return 'short_unclear'

    if any(keyword in compact for keyword in HIGH_RISK_KEYWORDS):
        return 'serious_risk'

    if compact in GREETING_KEYWORDS:
        return 'greeting'

    if compact in SHORT_UNCLEAR_PATTERNS or len(compact.split()) <= 2:
        return 'short_unclear'

    if any(keyword in compact for keyword in MEDIUM_RISK_KEYWORDS | LOW_SIGNAL_KEYWORDS):
        return 'emotional'

    return 'emotional'


def _classify_severity(normalized_message: str, message_type: str) -> str:
    if message_type in {'greeting', 'short_unclear'}:
        return 'low'

    if any(keyword in normalized_message for keyword in MEDIUM_RISK_KEYWORDS):
        if any(keyword in normalized_message for keyword in {'hopeless', 'worthless'}):
            return 'high'
        return 'medium'
    if any(keyword in normalized_message for keyword in LOW_SIGNAL_KEYWORDS):
        return 'low'
    return 'low'


def _build_supportive_reply(severity: str, message_type: str) -> str:
    if message_type == 'greeting':
        return (
            "Hey, I am really glad you are here. "
            "How have you been feeling today?"
        )

    if message_type == 'short_unclear':
        return (
            "That is completely okay, take your time. "
            "What has been on your mind lately?"
        )

    if severity == 'high':
        return (
            "That sounds deeply exhausting, and it makes sense that this is weighing on you. "
            "You deserve steady support while things feel this heavy. "
            "What feels hardest to hold right now?"
        )

    if severity == 'medium':
        return (
            "It sounds like your mind has been carrying a lot at once. "
            "Anyone in that kind of pressure could feel stretched thin. "
            "Has this been building over time, or did it spike recently?"
        )

    return (
        "It sounds like things have been a bit draining lately. "
        "Your feelings make sense, and you are not alone in this. "
        "What would feel most supportive for you right now?"
    )
