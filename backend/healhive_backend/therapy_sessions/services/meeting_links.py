from __future__ import annotations

import uuid


def generate_meeting_link() -> str:
    room_name = f"healhive-{uuid.uuid4()}"
    return f"https://meet.jit.si/{room_name}"
