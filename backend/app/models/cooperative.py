from datetime import datetime
from pydantic import BaseModel, Field

class Cooperative(BaseModel):
    id: str | None = None
    name: str
    region: str
    contact_phone: str
    role: str = "cooperative"
    green_score: int = 0
    trust_score: int = Field(default=50, ge=0, le=100)  # 🌟 Yeni eklenen Güven Puanı alanı
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime | None = None

class LeaderboardRow(Cooperative):
    total_swaps: int = 0
    carbon_saved_kg: float = Field(default=0, ge=0)