# HealHive WebSocket Chat Flow

## Connection

Endpoint options:
- `ws://<host>/ws/chat/<session_id>/?token=<jwt_or_temp_token>`
- `ws://<host>/ws/chat/?session_id=<session_id>&token=<jwt_or_temp_token>`

Client sends:

```json
{
  "event": "connect_session",
  "data": {
    "session_id": "abc123",
    "role": "user"
  }
}
```

Server replies:

```json
{
  "event": "connect_session",
  "data": {
    "session_id": "abc123",
    "connected": true,
    "role": "user",
    "token_provided": true
  }
}
```

## Message Send

Client sends:

```json
{
  "event": "send_message",
  "data": {
    "session_id": "abc123",
    "sender_type": "user",
    "content": "I am feeling anxious",
    "mode": "ai"
  }
}
```

Server broadcasts (same event contract):

```json
{
  "event": "receive_message",
  "data": {
    "id": 42,
    "session_id": "abc123",
    "sender_type": "user",
    "content": "I am feeling anxious",
    "timestamp": "2026-04-08T18:00:00Z"
  }
}
```

If AI mode is active and no therapist handoff is active, server emits another `receive_message` with `sender_type` = `ai`.

## Typing Signal

Client sends:

```json
{
  "event": "typing",
  "data": {
    "session_id": "abc123",
    "sender_type": "user",
    "is_typing": true
  }
}
```

Server forwards `typing` to all peers in the same chat group except the sender.

## Escalation

Client sends:

```json
{
  "event": "escalate_to_therapist",
  "data": {
    "session_id": "abc123",
    "severity": "high",
    "reason": "self-harm risk"
  }
}
```

Server broadcasts the same event to the session group.

## Migration Rollout

Phase 1:
- Deploy Django Channels and Redis while Node.js chat remains active.
- Introduce frontend websocket adapter toggle (`USE_DJANGO_WS=false` default).
- Run synthetic load and QA against Django websocket endpoint.

Phase 2:
- Route 10% traffic to Django websocket endpoint via feature flag or gateway rule.
- Track p95 latency, disconnect rate, error event count, and message loss.
- Roll back flag immediately if SLOs are breached.

Phase 3:
- Move 100% websocket traffic to Django Channels.
- Keep Node.js in standby for one release cycle.
- Remove Node.js chat routes and socket server after stability window.
