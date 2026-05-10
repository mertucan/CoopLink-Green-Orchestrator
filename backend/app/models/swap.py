from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class SwapStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Swap(BaseModel):
    id: str | None = None
    from_cooperative_id: str
    to_cooperative_id: str
    product_id: str
    quantity_kg: float = Field(gt=0)
    match_score: float = Field(ge=0)
    status: SwapStatus = SwapStatus.pending
    carbon_saved_kg: float = 0
    created_at: datetime | None = None
    resolved_at: datetime | None = None


class SwapUpdate(BaseModel):
    status: SwapStatus

