from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.agents.stock_agent import calculate_risk
from app.models.inventory import InventoryCreate
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(cooperative_id: str | None = Query(default=None)):
    supabase = get_supabase_client()
    query = supabase.table("inventory").select("*")
    if cooperative_id:
        query = query.eq("cooperative_id", cooperative_id)
    items = query.execute().data or []
    products = supabase.table("products").select("*").execute().data or []
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    product_map = {row["id"]: row for row in products}
    cooperative_map = {row["id"]: row for row in cooperatives}

    enriched = []
    for item in items:
        product = product_map.get(item.get("product_id"), {})
        cooperative = cooperative_map.get(item.get("cooperative_id"), {})
        enriched.append(
            {
                **item,
                "product_name": product.get("name", item.get("product_id")),
                "product_category": product.get("category", ""),
                "product_spoilage_rate_days": product.get("spoilage_rate_days"),
                "cooperative_name": cooperative.get("name", item.get("cooperative_id")),
                "cooperative_region": cooperative.get("region", ""),
            }
        )
    return {"items": enriched}


@router.post("")
async def create_inventory(item: InventoryCreate):
    supabase = get_supabase_client()
    product_rows = supabase.table("products").select("*").eq("id", item.product_id).limit(1).execute().data
    if not product_rows:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı.")
    risk = calculate_risk(item.quantity_kg, item.expires_at, int(product_rows[0]["spoilage_rate_days"]))
    payload = item.model_dump()
    payload["expires_at"] = item.expires_at.isoformat()
    payload["risk_score"] = risk
    payload["updated_at"] = datetime.utcnow().isoformat()
    created = supabase.table("inventory").insert(payload).execute().data
    return {"item": created[0] if created else payload}
