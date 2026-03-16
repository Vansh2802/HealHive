from ai_chatbot.services.crew_agents import CrewAIEmailAgents


def send_session_email(session):
    CrewAIEmailAgents().send_session_confirmation_email(session)
