import json
import logging
from datetime import datetime, timezone
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import ChatSession
from .services.ai_handler import generate_ai_response
from .services.mongo_connection import get_messages_collection

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Event-compatible websocket consumer for chat migration from Socket.io.

    Incoming payload shape:
      {"event": "send_message", "data": {...}}

    Compatibility:
    - Also accepts legacy shape where data is at root level.
    - Emits exact event names in the "event" field.
    """

    async def connect(self):
        self.session_id = self._extract_session_id()
        self.client_token = self._extract_token()
        self.session_group = None
        self.session_role = 'user'
        self.escalation_requested = False
        self.therapist_connected = False

        if not self._is_valid_session_id(self.session_id):
            logger.warning('WebSocket rejected: invalid session_id=%s', self.session_id)
            await self.close(code=4001)
            return

        self.chat_session = await self._ensure_chat_session_metadata(self.session_id)
        if not self.chat_session:
            logger.warning('WebSocket rejected: unable to provision metadata session_id=%s', self.session_id)
            await self.close(code=4002)
            return

        self.session_group = self._group_name(self.session_id)
        await self.accept()
        await self.channel_layer.group_add(self.session_group, self.channel_name)
        logger.info('WebSocket connected session_id=%s channel=%s', self.session_id, self.channel_name)

    async def disconnect(self, close_code):
        if self.session_group:
            await self.channel_layer.group_discard(self.session_group, self.channel_name)

        logger.info(
            'WebSocket disconnected session_id=%s channel=%s code=%s',
            self.session_id,
            self.channel_name,
            close_code,
        )

    async def receive(self, text_data=None, bytes_data=None):
        if bytes_data is not None:
            await self._send_error('Unsupported binary payload')
            return

        try:
            content = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            await self._send_error('Invalid JSON payload')
            return

        await self.receive_json(content)

    async def receive_json(self, content, **kwargs):
        event_name, payload = self._parse_event(content)

        if event_name == 'connect_session':
            await self._handle_connect_session(payload)
            return

        if event_name == 'send_message':
            await self._handle_send_message(payload)
            return

        if event_name == 'typing':
            await self._handle_typing(payload)
            return

        if event_name == 'escalate_to_therapist':
            await self._handle_escalation(payload)
            return

        await self._send_error(f'Unsupported event: {event_name}')

    async def _handle_connect_session(self, payload):
        payload_session_id = str(payload.get('session_id') or self.session_id)
        if payload_session_id != self.session_id:
            await self._send_error('session_id mismatch')
            return

        role = str(payload.get('role') or payload.get('sender_type') or 'user').lower()
        self.session_role = role
        self.therapist_connected = role == 'therapist'
        if role == 'therapist':
            await self._mark_session_mode(self.session_id, ChatSession.MODE_THERAPIST)

        ack_data = {
            'session_id': self.session_id,
            'connected': True,
            'role': role,
            'token_provided': bool(self.client_token),
        }
        await self._send_event('connect_session', ack_data)

    async def _handle_send_message(self, payload):
        message_session_id = str(payload.get('session_id') or self.session_id)
        if message_session_id != self.session_id:
            await self._send_error('session_id mismatch')
            return

        content = str(payload.get('content') or '').strip()
        if not content:
            await self._send_error('content is required')
            return

        sender_type = str(payload.get('sender_type') or 'user').lower()
        if sender_type not in {'user', 'ai', 'therapist'}:
            await self._send_error('Invalid sender_type')
            return

        stored = await self._store_message(
            session_id=message_session_id,
            sender_type=sender_type,
            content=content,
        )
        await self._broadcast_receive_message(stored)

        should_call_ai = self._should_generate_ai_reply(payload=payload, sender_type=sender_type)
        if should_call_ai:
            ai_data = await generate_ai_response(self.session_id, content)
            ai_stored = await self._store_message(
                session_id=self.session_id,
                sender_type='ai',
                content=str(ai_data.get('content') or '').strip(),
            )
            await self._broadcast_receive_message(ai_stored)

            if ai_data.get('should_escalate'):
                await self._handle_escalation(
                    {
                        'session_id': self.session_id,
                        'severity': ai_data.get('severity', 'high'),
                        'reason': ai_data.get('reason', 'AI escalation recommended'),
                    }
                )

    async def _handle_typing(self, payload):
        payload_session_id = str(payload.get('session_id') or self.session_id)
        if payload_session_id != self.session_id:
            await self._send_error('session_id mismatch')
            return

        await self.channel_layer.group_send(
            self.session_group,
            {
                'type': 'chat.broadcast',
                'event_name': 'typing',
                'data': payload,
                'exclude_channel': self.channel_name,
            },
        )

    async def _handle_escalation(self, payload):
        self.escalation_requested = True
        payload_session_id = str(payload.get('session_id') or self.session_id)
        if payload_session_id != self.session_id:
            await self._send_error('session_id mismatch')
            return

        await self.channel_layer.group_send(
            self.session_group,
            {
                'type': 'chat.broadcast',
                'event_name': 'escalate_to_therapist',
                'data': payload,
                'exclude_channel': None,
            },
        )

    async def chat_broadcast(self, event):
        if event.get('exclude_channel') == self.channel_name:
            return
        await self._send_event(event['event_name'], event['data'])

    async def _broadcast_receive_message(self, message_data):
        await self.channel_layer.group_send(
            self.session_group,
            {
                'type': 'chat.broadcast',
                'event_name': 'receive_message',
                'data': message_data,
                'exclude_channel': None,
            },
        )

    async def _send_event(self, event_name, data):
        await self.send(text_data=json.dumps({'event': event_name, 'data': data}, default=str))

    async def _send_error(self, message):
        await self.send(text_data=json.dumps({'event': 'error', 'data': {'message': message}}, default=str))

    def _parse_event(self, content):
        event_name = content.get('event')
        payload = content.get('data')

        if not event_name:
            event_name = content.get('type')
            payload = content.get('payload', payload)

        if payload is None:
            payload = content.get('data') if content.get('data') is not None else content

        return str(event_name or '').strip(), payload if isinstance(payload, dict) else {}

    def _extract_session_id(self):
        from_path = self.scope.get('url_route', {}).get('kwargs', {}).get('session_id')
        if from_path:
            return str(from_path)

        query = parse_qs((self.scope.get('query_string') or b'').decode('utf-8'))
        from_query = query.get('session_id', [''])[0]
        return str(from_query)

    def _extract_token(self):
        query = parse_qs((self.scope.get('query_string') or b'').decode('utf-8'))
        return str(query.get('token', [''])[0])

    @staticmethod
    def _is_valid_session_id(session_id):
        if not session_id:
            return False
        if len(session_id) > 128:
            return False
        return all(ch.isalnum() or ch in {'-', '_'} for ch in session_id)

    @staticmethod
    def _group_name(session_id):
        return f'chat_session_{session_id}'

    def _should_generate_ai_reply(self, payload, sender_type):
        if sender_type != 'user':
            return False
        if self.escalation_requested:
            return False

        mode = str(payload.get('mode') or '').lower()
        if mode in {'therapist', 'human', 'handoff'}:
            return False

        therapist_connected = bool(payload.get('therapist_connected')) or self.therapist_connected
        return not therapist_connected

    async def _store_message(self, session_id, sender_type, content):
        timestamp = datetime.now(timezone.utc)
        document = {
            'session_id': session_id,
            'sender_type': sender_type,
            'content': content,
            'timestamp': timestamp,
        }

        collection = get_messages_collection()
        result = await collection.insert_one(document)
        await self._touch_session_timestamp(session_id, timestamp)
        logger.debug('Stored chat message session_id=%s sender_type=%s id=%s', session_id, sender_type, result.inserted_id)

        return {
            'id': str(result.inserted_id),
            'session_id': session_id,
            'sender_type': sender_type,
            'content': content,
            'timestamp': timestamp.isoformat(),
        }

    @database_sync_to_async
    def _ensure_chat_session_metadata(self, session_id):
        from therapy_sessions.models import TherapySession
        
        try:
            # We assume session_id is either a UUID room_id or an integer PK
            # We will try looking up by id first, then room_id.
            if session_id.isdigit():
                therapy_session = TherapySession.objects.select_related(
                    'patient__user',
                    'therapist',
                ).get(id=int(session_id))
            else:
                therapy_session = TherapySession.objects.select_related(
                    'patient__user',
                    'therapist',
                ).get(room_id=session_id)

            if therapy_session.current_status != 'ongoing':
                logger.warning(
                    'WebSocket rejected: session_id=%s is not ongoing (status=%s)',
                    session_id,
                    therapy_session.current_status,
                )
                return None

            chat_session, _ = ChatSession.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'current_mode': ChatSession.MODE_AI,
                    'severity': ChatSession.SEVERITY_LOW,
                    'user': getattr(therapy_session.patient, 'user', None),
                    'therapist': therapy_session.therapist,
                },
            )
            return chat_session

        except TherapySession.DoesNotExist:
            logger.warning('WebSocket rejected: no TherapySession for session_id=%s', session_id)
            return None

    @database_sync_to_async
    def _touch_session_timestamp(self, session_id, timestamp):
        ChatSession.objects.filter(session_id=session_id).update(last_message_at=timestamp)

    @database_sync_to_async
    def _mark_session_mode(self, session_id, mode):
        ChatSession.objects.filter(session_id=session_id).update(current_mode=mode)
