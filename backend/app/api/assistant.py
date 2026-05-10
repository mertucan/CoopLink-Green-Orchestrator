from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/assistant", tags=["assistant"])


class AssistantMessage(BaseModel):
    message: str = Field(min_length=1)
    channel_id: str = "admin-panel"


@router.post("/message")
async def assistant_message(payload: AssistantMessage):
    orchestrator = Orchestrator()
    response = await orchestrator.handle_message(payload.channel_id, payload.message)
    return {"channel_id": payload.channel_id, "message": payload.message, "response": response}
