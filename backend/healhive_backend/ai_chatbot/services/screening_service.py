import json
import os
import re

from ai_chatbot.models import ScreeningSession
from reports.models import AssessmentReport, TherapyRequest
from .anthropic_client import get_anthropic_api_key, get_anthropic_client

try:
    from reports.email_alerts import send_urgent_report_email_async as _send_urgent_email
except Exception:
    _send_urgent_email = None

try:
    from langchain_anthropic import ChatAnthropic
except Exception:
    ChatAnthropic = None


SCREENING_QUESTIONS = [
    "Over the last 2 weeks, how often have you felt anxious, worried, or on edge?",
    "How has your sleep been (difficulty falling asleep, staying asleep, or oversleeping)?",
    "How often have you felt low mood, hopelessness, or lack of interest in daily activities?",
    "How much has stress affected your ability to focus at work/school/home?",
    "Have you had thoughts of harming yourself or feeling unsafe?",
]

SELF_HELP_RESOURCES = [
    "Practice 4-7-8 breathing for 5 minutes twice daily.",
    "Keep a consistent sleep schedule and avoid screens 1 hour before bed.",
    "Take a 10-minute mindful walk and note 3 things you can see/hear/feel.",
    "Reach out to one trusted person and share how you are feeling.",
]

HIGH_RISK_KEYWORDS = {
    'suicide',
    'kill myself',
    'end my life',
    'self harm',
    'self-harm',
    'harm myself',
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


class ClaudeScreeningService:
    def __init__(self):
        self.model = None
        self.api_key = get_anthropic_api_key()
        self.model_name = os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022')
        anthropic_key = self.api_key
        if anthropic_key and ChatAnthropic:
            self.model = ChatAnthropic(
                model=self.model_name,
                anthropic_api_key=anthropic_key,
                temperature=0.1,
            )

    def _direct_anthropic_reply(self, system: str, messages: list[dict], max_tokens: int = 350) -> str | None:
        client = get_anthropic_client()
        if client is None:
            return None
        try:
            response = client.messages.create(
                model=self.model_name,
                system=system,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.1,
            )
            parts = getattr(response, 'content', []) or []
            texts = [
                block.text
                for block in parts
                if getattr(block, 'type', '') == 'text' and getattr(block, 'text', '')
            ]
            combined = '\n'.join(texts).strip()
            return combined or None
        except Exception:
            return None

    def get_conversational_reply(self, user_message: str, chat_history: list) -> str:
        message_type = self._classify_message_type(user_message)
        system = (
            'You are HealHive AI, an emotionally intelligent and anonymous mental health support assistant. '
            'Keep users feeling safe, heard, and supported in natural human language. '
            'Never repeat or echo user wording, and never use robotic or clinical tone. '
            'Keep replies short (2-4 lines), ask one soft open-ended question only, and avoid diagnosis or medication advice. '
            'Follow this flow: acknowledge emotion, validate feeling, gently guide forward, then ask one question. '
            'Silently infer emotional tone and risk without telling the user they are being analyzed. '
            'Before replying, classify the latest user message internally as GREETING, SHORT_UNCLEAR, EMOTIONAL, or SERIOUS_RISK and match response depth to that class. '
            'Do not assume emotions for greetings or unclear short inputs. '
            'If self-harm intent appears, respond calmly, prioritize safety, and encourage reaching someone trusted immediately. '
            'Do not mention screening questionnaires yet.'
        )
        messages = []
        for turn in (chat_history or []):
            role = turn.get('role')
            content = str(turn.get('content') or '').strip()
            if role in {'user', 'assistant'} and content:
                messages.append({'role': role, 'content': content})
        messages.append({'role': 'user', 'content': user_message})

        raw_reply = self._direct_anthropic_reply(system=system, messages=messages, max_tokens=220)
        if raw_reply:
            return raw_reply

        if self.model:
            try:
                langchain_prompt = (
                    f"System: {system}\n\n"
                    f"History: {json.dumps(chat_history or [])}\n\n"
                    f"User: {user_message}\nAssistant:"
                )
                raw = self.model.invoke(langchain_prompt)
                content = raw.content if hasattr(raw, 'content') else str(raw)
                if content:
                    return str(content).strip()
            except Exception:
                pass

        # Fallback when no API key
        if message_type == 'serious_risk':
            return (
                "I am really sorry this feels so overwhelming right now. "
                "You do not have to face this alone, and your safety matters most. "
                "Would you feel comfortable reaching out to someone you trust right now?"
            )

        if message_type == 'greeting':
            return "Hey, I am really glad you are here. How have you been feeling today?"

        if message_type == 'short_unclear':
            return "That is okay, take your time. What has been on your mind lately?"

        return (
            "That sounds heavy, and your feelings make a lot of sense. "
            "We can go one step at a time together. "
            "What feels most difficult right now?"
        )

    def get_or_create_session(self, session_id: str, user=None) -> ScreeningSession:
        session, _ = ScreeningSession.objects.get_or_create(
            session_id=session_id,
            defaults={'user': user if getattr(user, 'is_authenticated', False) else None},
        )
        if getattr(user, 'is_authenticated', False) and not session.user:
            session.user = user
            session.save(update_fields=['user', 'updated_at'])
        return session

    def run_step(self, session: ScreeningSession, user_message: str):
        if session.completed:
            return {
                'reply': 'Your screening is already complete for this session. You can start a new chat to run a fresh screening.',
                'completed': True,
                'report': None,
            }

        responses = list(session.responses or [])
        current_index = session.current_question_index

        if current_index < len(SCREENING_QUESTIONS):
            responses.append(
                {
                    'question': SCREENING_QUESTIONS[current_index],
                    'answer': user_message,
                }
            )
            session.responses = responses
            session.current_question_index = current_index + 1
            session.save(update_fields=['responses', 'current_question_index', 'updated_at'])

        next_index = session.current_question_index
        if next_index < len(SCREENING_QUESTIONS):
            return {
                'reply': f"Screening Question {next_index + 1}/{len(SCREENING_QUESTIONS)}: {SCREENING_QUESTIONS[next_index]}",
                'completed': False,
                'report': None,
            }

        analysis = self._analyze_responses(responses)
        report = self._persist_report(session, analysis, user_message)

        session.completed = True
        session.save(update_fields=['completed', 'updated_at'])

        if analysis['severity'] == 'LOW':
            resources = '\n'.join([f"- {resource}" for resource in SELF_HELP_RESOURCES])
            reply = (
                'Thank you for completing the screening. Your current severity appears to be LOW. '
                'Here are self-help resources you can start with:\n'
                f"{resources}"
            )
        else:
            reply = (
                f"Thank you for completing the screening. Severity is {analysis['severity']}. "
                'A therapy request has been created for admin review and therapist assignment.'
            )

        return {
            'reply': reply,
            'completed': True,
            'report': {
                'id': report.id,
                'severity': report.severity,
                'indicators': report.indicators,
                'summary': report.ai_summary,
                'recommendation': report.recommendation,
                'answers': report.screening_answers,
            },
        }

    def _analyze_responses(self, responses: list[dict]):
        raw_system = (
            'You are a mental health screening classifier. '\
            'Return ONLY strict JSON with schema '\
            '{"severity":"LOW|MEDIUM|HIGH","indicators":["..."],"summary":"...","recommendation":"..."}. '\
            'If there is any affirmative self-harm/unsafe signal, severity must be HIGH.'
        )
        raw_prompt = f"Responses:\n{json.dumps(responses)}"
        raw_model_response = self._direct_anthropic_reply(
            system=raw_system,
            messages=[{'role': 'user', 'content': raw_prompt}],
            max_tokens=350,
        )

        if raw_model_response:
            try:
                parsed = json.loads(self._extract_json(raw_model_response))
                severity = str(parsed.get('severity', 'MEDIUM')).upper()
                if severity not in {'LOW', 'MEDIUM', 'HIGH'}:
                    severity = 'MEDIUM'
                return {
                    'severity': severity,
                    'indicators': parsed.get('indicators', [])[:6],
                    'summary': parsed.get('summary', 'User shows emotional distress requiring support.'),
                    'recommendation': parsed.get('recommendation', 'Therapist consultation recommended.'),
                }
            except Exception:
                pass

        if self.model:
            try:
                prompt = (
                    'You are a Mental Health Screening Assistant. '\
                    'Analyze the screening responses and return strict JSON only with this schema: '\
                    '{"severity":"LOW|MEDIUM|HIGH","indicators":["..."],"summary":"...","recommendation":"..."}. '\
                    'Use non-diagnostic supportive language.\n\n'
                    f"Responses:\n{json.dumps(responses)}"
                )
                raw = self.model.invoke(prompt)
                content = raw.content if hasattr(raw, 'content') else str(raw)
                parsed = json.loads(self._extract_json(str(content)))
                severity = str(parsed.get('severity', 'MEDIUM')).upper()
                if severity not in {'LOW', 'MEDIUM', 'HIGH'}:
                    severity = 'MEDIUM'
                return {
                    'severity': severity,
                    'indicators': parsed.get('indicators', [])[:6],
                    'summary': parsed.get('summary', 'User shows emotional distress requiring support.'),
                    'recommendation': parsed.get('recommendation', 'Therapist consultation recommended.'),
                }
            except Exception:
                pass

        text = ' '.join([(r.get('answer') or '').lower() for r in responses])
        weights = {
            'anxiety': ['anxious', 'panic', 'worry', 'racing thoughts', 'nervous'],
            'sleep disturbance': ['sleep', 'insomnia', 'nightmare', 'tired'],
            'low mood': ['sad', 'hopeless', 'empty', 'crying', 'low'],
            'stress': ['stress', 'pressure', 'overwhelmed', 'burnout'],
        }
        indicators = [name for name, terms in weights.items() if any(term in text for term in terms)]

        danger_terms = ['self-harm', 'harm myself', 'suicide', 'end my life', 'unsafe']
        high_risk = any(term in text for term in danger_terms)

        q5_answer = ''
        if len(responses) >= len(SCREENING_QUESTIONS):
            q5_answer = str(responses[-1].get('answer') or '').strip().lower()
            negation_terms = ['no', 'not', 'never', 'none', "don't", 'dont']
            affirmative_terms = ['yes', 'y', 'yeah', 'yep', 'yess', 'often', 'always', 'daily', 'true', 'i do', 'i have']
            if not any(term in q5_answer for term in negation_terms) and any(term in q5_answer for term in affirmative_terms):
                high_risk = True

        intensity_hits = len(re.findall(r'\b(always|daily|severe|extreme|cannot|can\'t)\b', text))
        if high_risk:
            severity = 'HIGH'
        elif intensity_hits >= 2 or len(indicators) >= 3:
            severity = 'MEDIUM'
        else:
            severity = 'LOW'

        summary_map = {
            'LOW': 'User shows mild emotional strain with manageable symptoms.',
            'MEDIUM': 'User shows moderate emotional distress and functional impact.',
            'HIGH': 'User shows high distress indicators and may require urgent human support.',
        }
        recommendation_map = {
            'LOW': 'Use self-help routines and monitor symptoms; seek therapy if symptoms persist.',
            'MEDIUM': 'Therapist consultation recommended within the next few days.',
            'HIGH': 'Urgent therapist review recommended; follow crisis support protocol if safety risk is present.',
        }

        return {
            'severity': severity,
            'indicators': indicators[:6] or ['emotional distress'],
            'summary': summary_map[severity],
            'recommendation': recommendation_map[severity],
        }

    def _persist_report(self, session: ScreeningSession, analysis: dict, last_message: str):
        therapist_report = self._format_therapist_report(analysis, session.responses)

        report = AssessmentReport.objects.create(
            session_id=session.session_id,
            user=session.user,
            user_message=last_message,
            therapist_report=therapist_report,
            tool_used='claude-screening',
            severity=analysis['severity'],
            indicators=analysis['indicators'],
            ai_summary=analysis['summary'],
            recommendation=analysis['recommendation'],
            screening_answers=session.responses,
        )

        if analysis['severity'] in {'MEDIUM', 'HIGH'}:
            TherapyRequest.objects.get_or_create(
                report=report,
                defaults={
                    'user': session.user,
                    'status': TherapyRequest.STATUS_PENDING,
                },
            )

        # Task 6: Send async email alert for high-severity reports.
        # This never blocks the consumer — runs in a daemon thread.
        if analysis['severity'] in {'SEVERE', 'CRITICAL', 'HIGH'} and _send_urgent_email is not None:
            _send_urgent_email(report)

        return report

    @staticmethod
    def _format_therapist_report(analysis: dict, responses: list[dict]) -> str:
        answers = '\n'.join(
            [f"Q{i + 1}: {item.get('question', '')}\nA{i + 1}: {item.get('answer', '')}" for i, item in enumerate(responses)]
        )
        indicators = ', '.join(analysis.get('indicators') or [])
        return (
            'HealHive AI Screening Report\n\n'
            f"Severity: {analysis.get('severity')}\n"
            f"Emotional Indicators: {indicators}\n"
            f"AI Summary: {analysis.get('summary')}\n"
            f"Recommendation: {analysis.get('recommendation')}\n\n"
            'Screening Answers:\n'
            f"{answers}"
        )

    @staticmethod
    def _extract_json(text: str) -> str:
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            return '{}'
        return text[start:end + 1]

    @staticmethod
    def _classify_message_type(message: str) -> str:
        normalized = re.sub(r'\s+', ' ', (message or '').lower()).strip(' .,!?:;')
        if not normalized:
            return 'short_unclear'

        if any(keyword in normalized for keyword in HIGH_RISK_KEYWORDS):
            return 'serious_risk'

        if normalized in GREETING_KEYWORDS:
            return 'greeting'

        if normalized in SHORT_UNCLEAR_PATTERNS or len(normalized.split()) <= 2:
            return 'short_unclear'

        return 'emotional'
