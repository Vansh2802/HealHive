from dataclasses import asdict
from django.utils import timezone
from ai_chatbot.assessment_data import TEST_DEFINITIONS
from ai_chatbot.models import (
    ChatConversation,
    ChatMessage,
    PsychologicalTest,
    TestQuestion,
    UserTestResponse,
    MentalHealthReport,
)
from .langchain_service import LangChainMentalHealthService
from .crew_agents import CrewAIAssessmentAgents


DISCLAIMER = 'This assessment is not a medical diagnosis and is intended for informational purposes only.'


def ensure_test_catalog():
    for code, definition in TEST_DEFINITIONS.items():
        test, _ = PsychologicalTest.objects.get_or_create(
            code=code,
            defaults={
                'name': definition['name'],
                'description': definition['description'],
            },
        )
        existing = {q.order: q for q in test.questions.all()}
        for idx, question_text in enumerate(definition['questions'], start=1):
            question = existing.get(idx)
            if question:
                question.question_text = question_text
                question.options_json = definition['options']
                question.save(update_fields=['question_text', 'options_json'])
            else:
                TestQuestion.objects.create(
                    test=test,
                    order=idx,
                    question_text=question_text,
                    options_json=definition['options'],
                )


def get_scale_max(test_code: str) -> int:
    if test_code == 'PSS':
        return 4
    return 3


def score_to_severity(test_code: str, score: int) -> str:
    if test_code == 'PHQ9':
        if score <= 4:
            return 'Minimal Depression'
        if score <= 9:
            return 'Mild Depression'
        if score <= 14:
            return 'Moderate Depression'
        if score <= 19:
            return 'Moderately Severe Depression'
        return 'Severe Depression'

    if test_code == 'GAD7':
        if score <= 4:
            return 'Minimal Anxiety'
        if score <= 9:
            return 'Mild Anxiety'
        if score <= 14:
            return 'Moderate Anxiety'
        return 'Severe Anxiety'

    if test_code == 'PSS':
        if score <= 13:
            return 'Low Stress'
        if score <= 26:
            return 'Moderate Stress'
        return 'High Perceived Stress'

    if score <= 10:
        return 'Low Loneliness'
    if score <= 20:
        return 'Moderate Loneliness'
    return 'High Loneliness'


def format_question(question: TestQuestion) -> str:
    options = '\n'.join([f"{o['score']} = {o['label']}" for o in question.options_json])
    return f"{question.question_text}\n\n{options}"


def get_or_create_conversation(user, conversation_id=None):
    if conversation_id:
        return ChatConversation.objects.filter(id=conversation_id, user=user).first()

    return ChatConversation.objects.create(
        user=user,
        title='Mental Health Assistant Session',
    )


class ChatbotOrchestrator:
    def __init__(self):
        self.langchain = LangChainMentalHealthService()
        self.crewai = CrewAIAssessmentAgents()

    def process(self, conversation: ChatConversation, user_message: str):
        if user_message:
            ChatMessage.objects.create(conversation=conversation, role=ChatMessage.ROLE_USER, content=user_message)

        if conversation.state == ChatConversation.STATE_INTAKE:
            response = self._handle_intake(conversation, user_message)
        elif conversation.state == ChatConversation.STATE_ASSESSMENT:
            response = self._handle_assessment(conversation, user_message)
        else:
            response = {
                'message': 'Your assessment is complete. You can review your latest report below.',
                'state': conversation.state,
                'progress': {'current': 0, 'total': 0},
            }

        ChatMessage.objects.create(conversation=conversation, role=ChatMessage.ROLE_ASSISTANT, content=response['message'])
        return response

    def _handle_intake(self, conversation: ChatConversation, user_message: str):
        if not user_message:
            return {
                'message': (
                    "Hi, I am HealHive AI. This is a private, supportive space where you can share freely. "
                    "What has been feeling the hardest for you lately?"
                ),
                'state': conversation.state,
                'progress': {'current': 0, 'total': 0},
            }

        analysis = self.langchain.analyze_emotion(user_message)
        conversation.detected_emotion = analysis.primary_emotion
        test_code = self.langchain.route_test(analysis.primary_emotion)
        test = PsychologicalTest.objects.get(code=test_code)
        conversation.active_test = test
        conversation.state = ChatConversation.STATE_ASSESSMENT
        conversation.current_question_index = 0
        conversation.save(update_fields=['detected_emotion', 'active_test', 'state', 'current_question_index', 'updated_at'])

        first_question = test.questions.order_by('order').first()
        message = (
            "Thank you for opening up. To better support you, I will ask a short set of check-in questions. "
            f"{DISCLAIMER}\n\n"
            f"Question 1/{test.questions.count()}:\n{format_question(first_question)}"
        )
        return {
            'message': message,
            'state': conversation.state,
            'recommended_test': test.code,
            'emotion_analysis': asdict(analysis),
            'progress': {'current': 1, 'total': test.questions.count()},
        }

    def _handle_assessment(self, conversation: ChatConversation, user_message: str):
        test = conversation.active_test
        questions = list(test.questions.order_by('order'))
        index = conversation.current_question_index

        if index >= len(questions):
            return self._finalize_report(conversation, '')

        current_question = questions[index]
        parsed = self.langchain.parse_numeric_answer(user_message or '', max_value=get_scale_max(test.code))
        if parsed is None:
            return {
                'message': (
                    'Please answer with a number from the provided options only.\n\n'
                    f"Question {index + 1}/{len(questions)}:\n{format_question(current_question)}"
                ),
                'state': conversation.state,
                'progress': {'current': index + 1, 'total': len(questions)},
            }

        UserTestResponse.objects.update_or_create(
            conversation=conversation,
            question=current_question,
            defaults={
                'user': conversation.user,
                'test': test,
                'score': parsed,
                'answer_text': str(parsed),
            },
        )

        next_index = index + 1
        conversation.current_question_index = next_index
        conversation.save(update_fields=['current_question_index', 'updated_at'])

        if next_index >= len(questions):
            return self._finalize_report(conversation, user_message)

        next_question = questions[next_index]
        return {
            'message': f"Thank you.\n\nQuestion {next_index + 1}/{len(questions)}:\n{format_question(next_question)}",
            'state': conversation.state,
            'progress': {'current': next_index + 1, 'total': len(questions)},
        }

    def _finalize_report(self, conversation: ChatConversation, last_message: str):
        test = conversation.active_test
        responses = UserTestResponse.objects.filter(conversation=conversation, test=test)
        total_score = sum(r.score for r in responses)
        severity = score_to_severity(test.code, total_score)

        crew_output = self.crewai.run_collaboration(
            user_message=last_message or 'Assessment completed.',
            selected_test=test.code,
            score=total_score,
            severity=severity,
        )

        report = MentalHealthReport.objects.create(
            user=conversation.user,
            conversation=conversation,
            test=test,
            total_score=total_score,
            severity_level=severity,
            emotional_observations=crew_output['emotional_observations'],
            recommended_next_steps=crew_output['recommended_next_steps'],
            suggested_therapy_options=crew_output['suggested_therapy_options'],
            structured_json={
                'assessment': test.name,
                'score': total_score,
                'severity': severity,
                'recommendation': crew_output['recommended_next_steps'],
            },
        )

        conversation.state = ChatConversation.STATE_REPORT_READY
        conversation.completed_at = timezone.now()
        conversation.save(update_fields=['state', 'completed_at', 'updated_at'])

        report_message = (
            'HealHive Mental Health Report\n\n'
            f"Assessment: {test.name}\n"
            f"Severity: {severity}\n\n"
            f"Emotional Observations: {report.emotional_observations}\n\n"
            f"Recommended Next Steps: {report.recommended_next_steps}\n\n"
            f"Suggested Therapy Options: {report.suggested_therapy_options}"
        )

        return {
            'message': report_message,
            'state': conversation.state,
            'report_id': report.id,
            'progress': {'current': responses.count(), 'total': responses.count()},
        }
