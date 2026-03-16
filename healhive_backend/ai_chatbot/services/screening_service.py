import json
import os
import re

from ai_chatbot.models import ScreeningSession
from reports.models import AssessmentReport, TherapyRequest

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


class ClaudeScreeningService:
    def __init__(self):
        self.model = None
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key and ChatAnthropic:
            self.model = ChatAnthropic(
                model='claude-3-5-sonnet-20241022',
                anthropic_api_key=anthropic_key,
                temperature=0.1,
            )

    def get_conversational_reply(self, user_message: str, chat_history: list) -> str:
        """Send the user message to Claude for a warm, natural empathetic reply."""
        if self.model:
            try:
                system = (
                    'You are a warm, empathetic mental wellness companion for HealHive. '
                    'Your role right now is to have a brief, genuine conversation with the user — '
                    'listen actively, acknowledge their feelings, and ask one simple follow-up question. '
                    'Keep replies to 2-3 sentences. Never diagnose. Never mention questionnaires or screening yet.'
                )
                messages = [{'role': 'system', 'content': system}]
                for turn in (chat_history or []):
                    messages.append({'role': turn['role'], 'content': turn['content']})
                messages.append({'role': 'user', 'content': user_message})
                raw = self.model.invoke(messages)
                return raw.content.strip() if hasattr(raw, 'content') else str(raw).strip()
            except Exception:
                pass
        # Fallback when no API key
        return "Thanks for reaching out — I'm here to listen. How are you feeling right now?"

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
