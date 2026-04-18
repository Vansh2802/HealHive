from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from therapy_sessions.models import TherapySession


class VideoCallConsumer(AsyncJsonWebsocketConsumer):
    room_participants = {}

    async def connect(self):
        self.user = self.scope.get('user')
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.group_name = f"session_{self.room_id}"

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.session = await self.get_authorized_session(self.room_id, self.user.id)
        if not self.session:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({'type': 'connected', 'room_id': self.room_id})

    async def disconnect(self, _close_code):
        if self.room_id in self.room_participants and self.channel_name in self.room_participants[self.room_id]:
            self.room_participants[self.room_id].discard(self.channel_name)
            if not self.room_participants[self.room_id]:
                await self.mark_session_ended(self.room_id)

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get('type')
        if event_type not in {'join_room', 'offer', 'answer', 'ice_candidate', 'leave_room'}:
            await self.send_json({'type': 'error', 'message': 'Unsupported message type'})
            return

        if event_type == 'join_room':
            self.room_participants.setdefault(self.room_id, set()).add(self.channel_name)
            await self.mark_session_started(self.room_id)
            participant_count = len(self.room_participants.get(self.room_id, set()))

            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'participant.joined',
                    'sender_channel': self.channel_name,
                    'user_id': self.user.id,
                    'participant_count': participant_count,
                },
            )
            status = 'connected' if participant_count > 1 else 'waiting'
            await self.send_json({'type': 'connection_status', 'status': status, 'participant_count': participant_count})
            return

        if event_type == 'leave_room':
            if self.room_id in self.room_participants and self.channel_name in self.room_participants[self.room_id]:
                self.room_participants[self.room_id].discard(self.channel_name)
            participant_count = len(self.room_participants.get(self.room_id, set()))
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'participant.left',
                    'sender_channel': self.channel_name,
                    'user_id': self.user.id,
                    'participant_count': participant_count,
                },
            )
            if participant_count == 0:
                await self.mark_session_ended(self.room_id)
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'signal.message',
                'sender_channel': self.channel_name,
                'signal_type': event_type,
                'payload': content.get('payload', {}),
            },
        )

    async def participant_joined(self, event):
        participant_count = event.get('participant_count', 1)
        status = 'connected' if participant_count > 1 else 'waiting'
        await self.send_json({'type': 'connection_status', 'status': status, 'participant_count': participant_count})
        if event['sender_channel'] == self.channel_name:
            return
        await self.send_json({'type': 'peer_joined', 'user_id': event.get('user_id')})

    async def participant_left(self, event):
        participant_count = event.get('participant_count', 0)
        status = 'connected' if participant_count > 1 else 'waiting'
        await self.send_json({'type': 'connection_status', 'status': status, 'participant_count': participant_count})
        if event['sender_channel'] == self.channel_name:
            return
        await self.send_json({'type': 'peer_left', 'user_id': event.get('user_id')})

    async def signal_message(self, event):
        if event['sender_channel'] == self.channel_name:
            return

        await self.send_json(
            {
                'type': event['signal_type'],
                'payload': event['payload'],
            }
        )

    @database_sync_to_async
    def get_authorized_session(self, room_id, user_id):
        try:
            session = TherapySession.objects.select_related('therapist__user', 'patient__user').get(room_id=room_id)
        except TherapySession.DoesNotExist:
            return None

        allowed_user_ids = {session.therapist.user_id, session.patient.user_id}
        if user_id not in allowed_user_ids:
            return None
        return session

    @database_sync_to_async
    def mark_session_started(self, room_id):
        TherapySession.objects.filter(room_id=room_id, session_start_time__isnull=True).update(session_start_time=timezone.now())

    @database_sync_to_async
    def mark_session_ended(self, room_id):
        TherapySession.objects.filter(room_id=room_id, session_end_time__isnull=True).update(
            session_end_time=timezone.now(),
            session_status=TherapySession.STATUS_COMPLETED,
        )
