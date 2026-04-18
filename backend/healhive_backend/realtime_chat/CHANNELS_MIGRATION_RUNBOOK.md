# HealHive Channels Migration Runbook

## Scope
- Remove Node.js chat transport from production traffic.
- Keep React UI mostly unchanged through a Socket.io-style adapter.
- Use Django Channels + Redis for real-time transport.
- Use MongoDB for chat messages only.
- Use PostgreSQL for users, therapists, sessions metadata, and payments.

## Architecture After Migration
- Frontend chat transport: native WebSocket via adapter in `src/services/chat/websocketAdapter.js`.
- WebSocket endpoint: `ws://localhost:8000/ws/chat/{session_id}/`.
- Consumer: `realtime_chat/consumers.py`.
- Mongo persistence: `realtime_chat/services/mongo_connection.py`.
- Channel layer: Redis configured in `healhive_backend/settings.py`.

## Event Contract (Unchanged)
- `connect_session`
- `send_message`
- `receive_message`
- `typing`
- `escalate_to_therapist`

Message envelope:
```json
{
  "event": "event_name",
  "data": {}
}
```

## Deployment Phases

### Phase 1: Parallel Run
1. Deploy Django Channels, Mongo config, and Redis channel layer.
2. Keep Node online but do not route new chat clients to it.
3. Validate these checks:
   - WebSocket connect/disconnect
   - `send_message` saves in Mongo
   - `receive_message` fan-out via Redis group
   - AI placeholder emits response

### Phase 2: Canary (10%)
1. Route 10% users to Django chat endpoint through feature flag.
2. Track:
   - connect success rate
   - message latency (p95)
   - reconnect success rate
   - message persistence success in Mongo
3. Roll back canary if thresholds are breached.

### Phase 3: Full Cutover
1. Route 100% chat traffic to Django endpoint.
2. Remove Node chat route and Socket.io runtime.
3. Keep observability checks for one release cycle.

## Testing Checklist
- Multiple users in same `session_id` receive broadcasts.
- Therapist connects with role `therapist` and receives session messages.
- AI response path works when therapist is not connected.
- Mongo `messages` collection stores each message document.
- Redis channel layer handles group fan-out under concurrent sessions.
- Client reconnect re-establishes `connect_session` flow.
- Invalid JSON and missing `session_id` return error events/close codes.

## Operational Commands

Install backend dependencies:
```powershell
cd d:/projectPBL/healhive_backend
../.venv/Scripts/python.exe -m pip install -r requirements.txt
```

Apply migrations:
```powershell
cd d:/projectPBL/healhive_backend
../.venv/Scripts/python.exe manage.py migrate
```

Start Django:
```powershell
cd d:/projectPBL/healhive_backend
../.venv/Scripts/python.exe manage.py runserver 0.0.0.0:8000
```

Start frontend:
```powershell
cd d:/projectPBL
npm run dev
```

## Redis Requirement
Redis must be running at `REDIS_URL` (default `redis://127.0.0.1:6379/1`) before Channels group messaging will work.
