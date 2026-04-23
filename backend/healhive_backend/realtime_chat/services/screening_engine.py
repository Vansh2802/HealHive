from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4

from django.db import transaction

from realtime_chat.models import ChatSession

try:
    from anthropic import Anthropic
except Exception:  # pragma: no cover - optional runtime dependency guard
    Anthropic = None


_STAGE_ORDER = [
    ChatSession.STAGE_EMOTIONAL_CHECK,
    ChatSession.STAGE_LIFESTYLE_SLEEP,
    ChatSession.STAGE_SOCIAL_WORK,
    ChatSession.STAGE_DEEP_MENTAL_STATE,
    ChatSession.STAGE_RISK_ASSESSMENT,
]

_STAGE_TARGETS = {
    ChatSession.STAGE_EMOTIONAL_CHECK: 2,
    ChatSession.STAGE_LIFESTYLE_SLEEP: 2,
    ChatSession.STAGE_SOCIAL_WORK: 2,
    ChatSession.STAGE_DEEP_MENTAL_STATE: 2,
    ChatSession.STAGE_RISK_ASSESSMENT: 2,
}

_FALLBACK_QUESTIONS = {
    ChatSession.STAGE_EMOTIONAL_CHECK: [
        {
            'question': "Thank you for being here today. Which feeling has been strongest lately?",
            'options': ["Mostly okay", "Stressed", "Anxious", "Very low"],
        },
        {
            'question': "When these feelings come up, how intense do they feel for you?",
            'options': ["Mild and manageable", "Noticeable but manageable", "Hard to control", "Overwhelming"],
        },
    ],
    ChatSession.STAGE_LIFESTYLE_SLEEP: [
        {
            'question': "How has your sleep been this week?",
            'options': ["Restful", "Light sleep", "Frequent wake-ups", "Very poor sleep"],
        },
        {
            'question': "How is your day-to-day energy right now?",
            'options': ["Steady", "Slightly low", "Often drained", "Completely exhausted"],
        },
    ],
    ChatSession.STAGE_SOCIAL_WORK: [
        {
            'question': "How supported do you feel by people around you?",
            'options': ["Well supported", "Some support", "Mostly alone", "Isolated"],
        },
        {
            'question': "How has work or study pressure felt recently?",
            'options': ["Balanced", "A bit heavy", "Very stressful", "Unmanageable"],
        },
    ],
    ChatSession.STAGE_DEEP_MENTAL_STATE: [
        {
            'question': "How often have thoughts felt heavy or hopeless?",
            'options': ["Rarely", "Sometimes", "Often", "Almost always"],
        },
        {
            'question': "How hard is it to enjoy things you usually like?",
            'options': ["Not hard", "Somewhat hard", "Very hard", "I cannot enjoy anything"],
        },
    ],
    ChatSession.STAGE_RISK_ASSESSMENT: [
        {
            'question': "When stress peaks, what is most true for you?",
            'options': ["I cope and recover", "I shut down for a while", "I feel unsafe emotionally", "I have thoughts of harming myself"],
        },
        {
            'question': "How safe do you feel right now in this moment?",
            'options': ["Safe", "A little unsafe", "Very unsafe", "I need urgent help"],
        },
    ],
}

_OPTION_WEIGHTS = {
    'mostly okay': 0,
    'mild': 1,
    'manageable': 1,
    'stressed': 1,
    'worried': 1,
    'anxious': 2,
    'panic': 2,
    'drained': 2,
    'hopeless': 3,
    'worthless': 3,
    'overwhelming': 3,
    'isolated': 3,
    'unsafe': 4,
    'self-harm': 5,
    'harming myself': 5,
    'urgent help': 6,
}

_KEY_ISSUE_KEYWORDS = {
    'stress': {'stressed', 'stressful', 'pressure', 'unmanageable'},
    'anxiety': {'anxious', 'panic', 'overwhelming', 'unsafe'},
    'sleep issues': {'sleep', 'wake', 'poor sleep', 'restful'},
    'social isolation': {'alone', 'isolated'},
    'low mood': {'low', 'hopeless', 'worthless'},
    'self-harm risk': {'self-harm', 'harming myself', 'urgent help'},
}


class ScreeningEngine:
    def __init__(self):
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY', '').strip()
        self.anthropic_model = os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-latest').strip()
        self._anthropic_client = None
        if self.anthropic_api_key and Anthropic:
            self._anthropic_client = Anthropic(api_key=self.anthropic_api_key)

    def create_or_get_session(self, session_id: str, user=None) -> ChatSession:
        defaults = {
            'anonymous_user_id': f'ANON-{uuid4().hex[:8].upper()}',
            'user': user if getattr(user, 'is_authenticated', False) else None,
            'messages': [],
            'current_stage': ChatSession.STAGE_EMOTIONAL_CHECK,
            'severity_score': 0,
            'severity_level': 'LOW',
            'question_count': 0,
            'completed': False,
            'report_visible_to_therapist': True,
            'report_visible_to_user': False,
        }
        session, _ = ChatSession.objects.get_or_create(session_id=session_id, defaults=defaults)
        if not session.anonymous_user_id:
            session.anonymous_user_id = f'ANON-{uuid4().hex[:8].upper()}'
            session.save(update_fields=['anonymous_user_id', 'updated_at'])
        return session

    @transaction.atomic
    def bootstrap_session(self, session: ChatSession) -> dict:
        if session.messages:
            last_bot = self._last_bot_turn(session.messages)
            return {
                'session': session,
                'bot_message': last_bot,
                'is_new': False,
            }

        opening = {
            'question': "Hi, I am really glad you reached out today. How are you feeling right now?",
            'options': ["Mostly okay", "Stressed", "Anxious", "Very low"],
        }
        self._append_bot_message(session, opening)
        self._save_session(session)
        return {
            'session': session,
            'bot_message': opening,
            'is_new': True,
        }

    @transaction.atomic
    def process_option(self, session: ChatSession, selected_option: str) -> dict:
        selected_option = (selected_option or '').strip()
        if not selected_option:
            raise ValueError('Selected option is required.')

        if session.completed:
            return {
                'status': 'completed',
                'session': session,
                'report': session.final_report,
                'bot_message': {
                    'question': 'Thank you for checking in today. If you want, we can begin another supportive check-in anytime.',
                    'options': ['Start a new check-in', 'Connect with a Therapist'],
                },
            }

        self._append_user_message(session, selected_option)
        session.severity_score = min(25, session.severity_score + self._score_option(selected_option))
        session.severity_level = self._classify_severity_level(session.severity_score)
        session.question_count += 1

        next_stage = self._advance_stage(session.current_stage, session.question_count)
        session.current_stage = next_stage

        if session.question_count >= 10 or next_stage == ChatSession.STAGE_ANALYSIS:
            report = self._build_final_report(session)
            supportive_message = self._build_user_support_message(session)
            session.completed = True
            session.current_stage = ChatSession.STAGE_ANALYSIS
            session.final_report = report
            session.report_visible_to_therapist = True
            session.report_visible_to_user = False
            self._append_bot_message(
                session,
                {
                    'question': supportive_message,
                    'options': ['Connect with a Therapist', 'Start a new check-in'],
                },
            )
            self._save_session(session)
            return {
                'status': 'completed',
                'session': session,
                'report': report,
                'bot_message': self._last_bot_turn(session.messages),
            }

        bot_message = self._generate_next_question(session, selected_option)
        self._append_bot_message(session, bot_message)
        self._save_session(session)

        return {
            'status': 'in_progress',
            'session': session,
            'report': None,
            'bot_message': bot_message,
        }

    def _generate_next_question(self, session: ChatSession, selected_option: str) -> dict:
        history = session.messages[-10:]
        if self._anthropic_client:
            ai_result = self._anthropic_question(history, session.current_stage, selected_option, session.severity_score)
            if ai_result:
                return ai_result

        return self._fallback_question(session.current_stage, selected_option, session.question_count)

    def _anthropic_question(self, history: list, current_stage: str, selected_option: str, severity_score: int) -> dict | None:
        if not self._anthropic_client:
            return None

        prompt = (
            'You are a compassionate therapist assistant. Respond ONLY in JSON with keys '
            '"question" and "options".\n'
            'Rules:\n'
            '- Ask exactly one contextual question.\n'
            '- Make the tone empathetic and human.\n'
            '- Return exactly 4 short options.\n'
            '- Options must be clickable phrases, no free text request.\n'
            '- Keep question under 28 words.\n\n'
            f'Current stage: {current_stage}\n'
            f'Latest user option: {selected_option}\n'
            f'Severity score: {severity_score}\n'
            f'Previous messages: {history}\n'
        )

        try:
            response = self._anthropic_client.messages.create(
                model=self.anthropic_model,
                max_tokens=240,
                temperature=0.5,
                system='Generate mental health check-in question JSON only.',
                messages=[{'role': 'user', 'content': prompt}],
            )
            text_parts = []
            for block in response.content:
                if getattr(block, 'type', '') == 'text':
                    text_parts.append(block.text)
            raw_text = ''.join(text_parts).strip()
            if not raw_text:
                return None

            # Minimal robust JSON parsing for models that may wrap markdown fences.
            cleaned = raw_text
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
                cleaned = cleaned.replace('json', '', 1).strip()
            import json
            parsed = json.loads(cleaned)
            question = str(parsed.get('question') or '').strip()
            options = parsed.get('options') or []
            options = [str(opt).strip() for opt in options if str(opt).strip()][:4]
            if not question or len(options) < 2:
                return None
            while len(options) < 4:
                options.append('Not sure')
            return {'question': question, 'options': options[:4]}
        except Exception:
            return None

    def _fallback_question(self, stage: str, selected_option: str, question_count: int) -> dict:
        pool = _FALLBACK_QUESTIONS.get(stage) or _FALLBACK_QUESTIONS[ChatSession.STAGE_EMOTIONAL_CHECK]
        candidate = pool[question_count % len(pool)]
        question = candidate['question']
        if selected_option:
            question = f"Thanks for sharing that. {question}"
        return {
            'question': question,
            'options': list(candidate['options']),
        }

    def _score_option(self, selected_option: str) -> int:
        normalized = selected_option.lower()
        score = 0
        for phrase, points in _OPTION_WEIGHTS.items():
            if phrase in normalized:
                score = max(score, points)
        if score == 0:
            if any(token in normalized for token in {'bad', 'hard', 'heavy'}):
                return 1
        return score

    def _advance_stage(self, stage: str, question_count: int) -> str:
        if question_count >= 10:
            return ChatSession.STAGE_ANALYSIS

        if stage not in _STAGE_ORDER:
            return ChatSession.STAGE_EMOTIONAL_CHECK

        current_index = _STAGE_ORDER.index(stage)
        stage_limit = sum(_STAGE_TARGETS[s] for s in _STAGE_ORDER[: current_index + 1])
        if question_count >= stage_limit and current_index < len(_STAGE_ORDER) - 1:
            return _STAGE_ORDER[current_index + 1]
        return stage

    def _classify_severity_level(self, score: int) -> str:
        if score <= 3:
            return 'LOW'
        if score <= 6:
            return 'MEDIUM'
        if score <= 10:
            return 'HIGH'
        if score <= 15:
            return 'SEVERE'
        if score <= 20:
            return 'CRITICAL'
        return 'EMERGENCY'

    def _build_final_report(self, session: ChatSession) -> dict:
        messages = session.messages or []
        user_text = ' '.join(
            str(item.get('text') or '') for item in messages if item.get('role') == 'user'
        ).lower()

        key_issues = []
        for issue, keywords in _KEY_ISSUE_KEYWORDS.items():
            if any(keyword in user_text for keyword in keywords):
                key_issues.append(issue)

        if not key_issues:
            key_issues = ['stress'] if session.severity_score >= 2 else ['general wellness check-in']

        recommendations = {
            'LOW': 'Continue self-care habits and maintain routine emotional check-ins.',
            'MEDIUM': 'Consider speaking with a counselor if symptoms continue this week.',
            'HIGH': 'Therapy is recommended. Early intervention can help reduce escalation.',
            'SEVERE': 'Priority therapist follow-up is strongly recommended within 24-48 hours.',
            'CRITICAL': 'Urgent therapist intervention is required with close safety planning.',
            'EMERGENCY': 'Immediate emergency support is recommended right now.',
        }

        actions = [
            'Talk to a therapist',
            'Improve sleep cycle',
            'Daily journaling',
        ]
        if session.severity_level in {'SEVERE', 'CRITICAL', 'EMERGENCY'}:
            actions.insert(0, 'Reach out to trusted support person today')

        summary = (
            'The user described persistent emotional strain during this session. '
            f'Primary concern areas include {", ".join(key_issues[:3])}. '
            'Severity was estimated using structured options and emotional indicators.'
        )

        return {
            'user_id': session.anonymous_user_id,
            'summary': summary,
            'key_issues': key_issues,
            'severity_score': session.severity_score,
            'severity_level': session.severity_level,
            'recommendation': recommendations.get(session.severity_level, recommendations['MEDIUM']),
            'suggested_actions': actions,
            'visible_to_therapist': True,
            'visible_to_user': False,
            'generated_at': datetime.now(timezone.utc).isoformat(),
        }

    def _build_user_support_message(self, session: ChatSession) -> str:
        report = session.final_report or self._build_final_report(session)
        key_issues = list(report.get('key_issues') or [])
        gentle_focus = 'stress and emotional strain'
        if key_issues:
            gentle_focus = ', '.join(key_issues[:2]).replace('self-harm risk', 'emotional safety concerns')

        return (
            'Thank you for sharing this with me. It sounds like you have been carrying a lot lately, '
            'and your feelings are valid.\n\n'
            f'From what you shared, it seems like {gentle_focus} may be affecting your day-to-day wellbeing. '
            'Small steps like keeping a gentle routine, resting when you can, and talking with someone you trust can help.\n\n'
            'If you feel comfortable, you can connect with a therapist here for extra support at your own pace. '
            'You do not have to go through this alone.'
        )

    def _append_user_message(self, session: ChatSession, text: str):
        messages = list(session.messages or [])
        messages.append(
            {
                'role': 'user',
                'text': text,
                'stage': session.current_stage,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }
        )
        session.messages = messages

    def _append_bot_message(self, session: ChatSession, bot_message: dict):
        messages = list(session.messages or [])
        messages.append(
            {
                'role': 'assistant',
                'text': bot_message.get('question', ''),
                'options': list(bot_message.get('options') or []),
                'stage': session.current_stage,
                'report': bot_message.get('report') or None,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }
        )
        session.messages = messages

    def _last_bot_turn(self, messages: list) -> dict:
        for item in reversed(messages):
            if item.get('role') == 'assistant':
                return {
                    'question': item.get('text') or '',
                    'options': item.get('options') or [],
                    'report': item.get('report') or None,
                }
        return {'question': '', 'options': []}

    def _save_session(self, session: ChatSession):
        session.last_message_at = datetime.now(timezone.utc)
        session.save(
            update_fields=[
                'messages',
                'current_stage',
                'severity_score',
                'severity_level',
                'question_count',
                'completed',
                'final_report',
                'report_visible_to_therapist',
                'report_visible_to_user',
                'last_message_at',
                'updated_at',
            ]
        )
