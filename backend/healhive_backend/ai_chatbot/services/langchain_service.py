import json
import os
import re
from dataclasses import dataclass

try:
    from langchain.prompts import PromptTemplate
    from langchain.memory import ConversationBufferMemory
except Exception:
    PromptTemplate = None
    ConversationBufferMemory = None

try:
    from langchain_anthropic import ChatAnthropic
except Exception:
    ChatAnthropic = None


@dataclass
class EmotionAnalysis:
    primary_emotion: str
    confidence: float
    cues: list[str]


EMOTION_KEYWORDS = {
    'anxiety': ['anxious', 'panic', 'worry', 'nervous', 'overthinking'],
    'depression': ['sad', 'hopeless', 'empty', 'depressed', 'low'],
    'stress': ['stressed', 'pressure', 'burnout', 'overwhelmed', 'tension'],
    'loneliness': ['lonely', 'alone', 'isolated', 'disconnected', 'left out'],
}

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


class LangChainMentalHealthService:
    def __init__(self):
        self.memory = ConversationBufferMemory(return_messages=True) if ConversationBufferMemory else None
        self.model = None
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key and ChatAnthropic:
            self.model = ChatAnthropic(model='claude-3-5-sonnet-20241022', anthropic_api_key=anthropic_key, temperature=0.2)

        self.emotion_prompt = None
        if PromptTemplate:
            self.emotion_prompt = PromptTemplate.from_template(
                """
                You are a mental health support assistant. Analyze the message and infer emotional category.
                Categories: anxiety, depression, stress, loneliness.
                Message: {message}

                Return strict JSON:
                {{"emotion": "...", "confidence": 0.0, "cues": ["..."]}}
                """.strip()
            )

    def analyze_emotion(self, message: str) -> EmotionAnalysis:
        if self.model and self.emotion_prompt:
            try:
                prompt = self.emotion_prompt.format(message=message)
                raw = self.model.invoke(prompt)
                content = raw.content if hasattr(raw, 'content') else str(raw)
                parsed = json.loads(self._extract_json(content))
                return EmotionAnalysis(
                    primary_emotion=parsed.get('emotion', 'stress'),
                    confidence=float(parsed.get('confidence', 0.5)),
                    cues=parsed.get('cues', []),
                )
            except Exception:
                pass

        lowered = message.lower()
        scores = {}
        for emotion, keywords in EMOTION_KEYWORDS.items():
            scores[emotion] = sum(1 for word in keywords if word in lowered)

        primary = max(scores, key=scores.get) if any(scores.values()) else 'stress'
        cues = [word for word in EMOTION_KEYWORDS[primary] if word in lowered][:3]
        confidence = 0.9 if scores[primary] >= 2 else 0.6
        return EmotionAnalysis(primary_emotion=primary, confidence=confidence, cues=cues)

    def generate_supportive_reply(self, message: str, history: list[dict] | None = None, emotion: str = 'stress') -> str:
        history = history or []
        message_type = self._classify_message_type(message)
        if self.model:
            try:
                recent = history[-8:]
                history_text = '\n'.join([
                    f"{(m.get('role') or 'user').capitalize()}: {m.get('content', '')}" for m in recent
                ])
                prompt = (
                    "You are HealHive AI, an emotionally intelligent and anonymous mental health support assistant. "
                    "Create a safe, calm, human-like conversation where the user feels heard and supported. "
                    "Never repeat or echo the user message, never say 'you said', and never sound clinical. "
                    "Use simple natural language and keep replies short (2-4 lines). "
                    "Conversation flow must be: acknowledge emotion, validate feeling, gently guide forward, and ask one soft open-ended question. "
                    "Ask only one question at a time. Avoid diagnosis, medication, or medical advice. "
                    "Silently infer emotional tone and risk from context without mentioning analysis. "
                    "Internal severity guide: LOW normal stress, MEDIUM anxiety/overthinking, HIGH sadness/hopelessness, CRITICAL self-harm signals. "
                    "If CRITICAL signals appear, respond calmly, prioritize safety, and encourage reaching someone trusted immediately in a supportive tone.\n\n"
                    "Before replying, classify the latest user message internally as one of: GREETING, SHORT_UNCLEAR, EMOTIONAL, SERIOUS_RISK. "
                    "Response depth must match the input depth. "
                    "For GREETING: do not assume emotions; respond warm and invite sharing. "
                    "For SHORT_UNCLEAR: gently encourage expression with light tone. "
                    "For EMOTIONAL: use full empathy flow and one gentle question. "
                    "For SERIOUS_RISK: activate safety-first crisis support.\n\n"
                    f"Message type hint: {message_type}\n"
                    f"Detected emotion: {emotion}\n"
                    f"Conversation so far:\n{history_text}\n\n"
                    f"Latest user message: {message}\n\n"
                    "Return only the assistant reply text."
                )
                raw = self.model.invoke(prompt)
                content = raw.content if hasattr(raw, 'content') else str(raw)
                if isinstance(content, list):
                    content = ' '.join([str(x) for x in content])
                content = str(content).strip()
                if content:
                    return content
            except Exception:
                pass

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

        starters = {
            'anxiety': "That sounds really overwhelming, and it makes sense your mind feels on edge.",
            'depression': "That sounds very heavy to carry, and your feelings are completely valid.",
            'stress': "It sounds like a lot has been piling up, and that can wear anyone down.",
            'loneliness': "Feeling disconnected can hurt deeply, and it makes sense this feels hard.",
        }
        followups = {
            'anxiety': "Has this been building over time, or did it become intense more recently?",
            'depression': "What part of the day tends to feel heaviest for you lately?",
            'stress': "What has felt most draining for you today?",
            'loneliness': "When do you notice that sense of disconnection the most?",
        }
        return (
            f"{starters.get(emotion, starters['stress'])} "
            "We can move through this one step at a time. "
            f"{followups.get(emotion, followups['stress'])}"
        )

    def route_test(self, emotion: str) -> str:
        mapping = {
            'anxiety': 'GAD7',
            'depression': 'PHQ9',
            'stress': 'PSS',
            'loneliness': 'UCLA',
        }
        return mapping.get(emotion, 'PSS')

    @staticmethod
    def parse_numeric_answer(message: str, max_value: int = 4):
        match = re.search(r'\b([0-4])\b', message)
        if not match:
            return None
        score = int(match.group(1))
        if score > max_value:
            return None
        return score

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
