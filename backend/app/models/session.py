from datetime import datetime
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class SessionState(BaseModel):
    id: str | None = None
    channel_id: str
    context: list[ChatMessage] = []
    last_intent: str | None = None
    updated_at: datetime | None = None
