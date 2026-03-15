import os

try:
    from crewai import Agent, Task, Crew
except Exception:
    Agent = None
    Task = None
    Crew = None

class CrewAIAssessmentAgents:
    def __init__(self):
        self.enabled = all([Agent, Task, Crew])
        self.llm_model = os.getenv('CREWAI_MODEL', 'gpt-4o-mini')

    def build_agents(self):
        if not self.enabled:
            return None

        emotion_agent = Agent(
            role='Emotion Detection Agent',
            goal='Analyze user messages and identify dominant emotional signals.',
            backstory='A compassionate analyst trained to detect emotional cues without diagnosing.',
            verbose=False,
        )

        selector_agent = Agent(
            role='Test Selection Agent',
            goal='Select the most appropriate psychological assessment based on emotional cues.',
            backstory='An assessment coordinator that routes users to validated questionnaires.',
            verbose=False,
        )

        assessment_agent = Agent(
            role='Assessment Agent',
            goal='Administer psychological tests one question at a time in supportive language.',
            backstory='A calm conversational guide for safe, non-diagnostic assessment flow.',
            verbose=False,
        )

        report_agent = Agent(
            role='Report Generator Agent',
            goal='Generate a structured mental health report with score and severity.',
            backstory='A structured clinical-style summarizer for informational feedback.',
            verbose=False,
        )

        therapist_agent = Agent(
            role='Therapist Recommendation Agent',
            goal='Suggest practical therapy options and next steps based on score severity.',
            backstory='A care navigator that promotes safe escalation and support options.',
            verbose=False,
        )

        return {
            'emotion': emotion_agent,
            'selector': selector_agent,
            'assessment': assessment_agent,
            'report': report_agent,
            'therapist': therapist_agent,
        }

    def run_collaboration(self, user_message: str, selected_test: str, score: int, severity: str):
        agents = self.build_agents()
        if not agents:
            return {
                'emotional_observations': f'User narrative indicates signs aligned with {selected_test}.',
                'recommended_next_steps': 'Continue self-care, monitor symptoms, and consider talking to a licensed therapist if symptoms persist.',
                'suggested_therapy_options': 'Cognitive Behavioral Therapy (CBT), supportive counseling, mindfulness-based interventions.',
            }

        emotion_task = Task(
            description=f'Analyze emotional cues from message: {user_message}',
            expected_output='Short emotional cue summary',
            agent=agents['emotion'],
        )
        report_task = Task(
            description=f'Generate short report summary for {selected_test} with score {score} and severity {severity}',
            expected_output='Observations + next steps + therapy options',
            agent=agents['report'],
        )

        crew = Crew(
            agents=[agents['emotion'], agents['selector'], agents['assessment'], agents['report'], agents['therapist']],
            tasks=[emotion_task, report_task],
            verbose=False,
        )

        try:
            crew_output = str(crew.kickoff())
        except Exception:
            crew_output = ''

        return {
            'emotional_observations': crew_output[:350] or f'User narrative indicates signs aligned with {selected_test}.',
            'recommended_next_steps': 'Schedule a therapy session if distress is moderate/severe or persistent for two weeks.',
            'suggested_therapy_options': 'CBT, ACT, group therapy, and psychoeducation support plans.',
        }
