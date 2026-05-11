from datetime import datetime
from pydantic import BaseModel, Field


class Product(BaseModel):
    id: str | None = None
    name: str
    category: str
    spoilage_rate_days: int = Field(gt=0)


class InventoryItem(BaseModel):
    id: str | None = None
    cooperative_id: str
    product_id: str
    quantity_kg: float = Field(ge=0)
    expires_at: datetime
    risk_score: float = Field(default=0, ge=0, le=1)
    disposal_status: str = "active"
    disposed_at: datetime | None = None
    disposed_quantity_kg: float = 0
    disposal_penalty_points: int = 0
    updated_at: datetime | None = None


class InventoryCreate(BaseModel):
    cooperative_id: str
    product_id: str
    quantity_kg: float = Field(gt=0)
    expires_at: datetime
