from datetime import datetime, timezone

from app.agents.swap_agent import SwapAgent
from app.services.supabase_client import get_supabase_client


def calculate_risk(quantity_kg: float, expires_at: datetime, spoilage_rate_days: int) -> float:
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    days_left = (expires_at - now).total_seconds() / 86400
    risk = (1 / max(days_left, 0.1)) * quantity_kg * (1 / spoilage_rate_days)
    return round(min(max(risk, 0), 1.0), 4)


class StockAgent:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.swap_agent = SwapAgent()

    async def query_stock(self, product_name: str | None = None) -> dict:
        try:
            rows = self.supabase.table("inventory").select("*").execute().data or []
            products = self.supabase.table("products").select("*").execute().data or []
            cooperatives = self.supabase.table("cooperatives").select("*").execute().data or []
            product_map = {row["id"]: row for row in products}
            cooperative_map = {row["id"]: row for row in cooperatives}
            enriched = []
            for row in rows:
                product = product_map.get(row.get("product_id"), {})
                cooperative = cooperative_map.get(row.get("cooperative_id"), {})
                enriched.append(
                    {
                        **row,
                        "product_name": product.get("name", row.get("product_id")),
                        "product_category": product.get("category", ""),
                        "cooperative_name": cooperative.get("name", row.get("cooperative_id")),
                        "cooperative_region": cooperative.get("region", ""),
                    }
                )
            if product_name:
                enriched = [
                    row
                    for row in enriched
                    if product_name.lower() in str(row.get("product_name", "")).lower()
                    or product_name.lower() in str(row.get("product_category", "")).lower()
                ]
            return {
                "intent": "query_stock",
                "items": enriched,
                "message": f"Ağda {len(enriched)} uygun stok kaydı bulundu.",
            }
        except Exception as exc:
            return {"intent": "query_stock", "error": f"Stok sorgusu tamamlanamadı: {exc}"}

    async def update_risk_for_item(self, item: dict, spoilage_rate_days: int) -> float:
        expires_at = item["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        risk = calculate_risk(float(item["quantity_kg"]), expires_at, spoilage_rate_days)
        if item.get("id"):
            self.supabase.table("inventory").update({"risk_score": risk}).eq("id", item["id"]).execute()
        if risk > 0.7:
            await self.swap_agent.propose_swap(str(item.get("product_id", "ürün")), float(item["quantity_kg"]), risk)
        return risk
