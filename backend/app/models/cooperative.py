from datetime import datetime
from pydantic import BaseModel, Field


class Cooperative(BaseModel):
    id: str | None = None
    name: str
    region: str
    contact_phone: str
    green_score: int = 0
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime | None = None


class LeaderboardRow(Cooperative):
    total_swaps: int = 0
    carbon_saved_kg: float = Field(default=0, ge=0)
