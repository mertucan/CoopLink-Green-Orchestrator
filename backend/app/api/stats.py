from datetime import datetime, timedelta, timezone
from fastapi import APIRouter

from app.services.impact_engine import build_impact_summary
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def stats():
    supabase = get_supabase_client()
    swaps = supabase.table("swaps").select("*").execute().data or []
    products = supabase.table("products").select("*").execute().data or []
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    product_map = {row["id"]: row for row in products}
    approved = [swap for swap in swaps if swap.get("status") == "approved"]
    pending = [swap for swap in swaps if swap.get("status") == "pending"]
    week_start = datetime.now(timezone.utc) - timedelta(days=7)

    def in_week(row):
        value = row.get("resolved_at") or row.get("created_at")
        if not value:
            return False
        return datetime.fromisoformat(value.replace("Z", "+00:00")) >= week_start

    approved_week = [swap for swap in approved if in_week(swap)]
    approved_impact = [
        build_impact_summary(
            float(swap.get("quantity_kg", 0)),
            float(swap.get("carbon_saved_kg", 0)),
            product_map.get(swap.get("product_id"), {}),
        )
        for swap in approved
    ]
    approved_week_impact = [
        build_impact_summary(
            float(swap.get("quantity_kg", 0)),
            float(swap.get("carbon_saved_kg", 0)),
            product_map.get(swap.get("product_id"), {}),
        )
        for swap in approved_week
    ]
    weekly_carbon = []
    for offset in range(6, -1, -1):
        day = datetime.now(timezone.utc).date() - timedelta(days=offset)
        day_total = 0.0
        for swap in approved:
            value = swap.get("resolved_at") or swap.get("created_at")
            if not value:
                continue
            resolved_day = datetime.fromisoformat(value.replace("Z", "+00:00")).date()
            if resolved_day == day:
                day_total += float(swap.get("carbon_saved_kg", 0))
        weekly_carbon.append({"day": day.strftime("%d.%m"), "kg": round(day_total, 2)})
    return {
        "total_food_saved_kg": round(sum(float(s.get("quantity_kg", 0)) for s in approved), 2),
        "total_carbon_saved_kg": round(sum(float(s.get("carbon_saved_kg", 0)) for s in approved), 2),
        "total_saved_meals": sum(item["saved_meals"] for item in approved_impact),
        "total_local_value_tl": round(sum(item["local_value_tl"] for item in approved_impact), 2),
        "total_swaps": len(swaps),
        "total_swaps_pending": len(pending),
        "active_cooperatives": len(cooperatives),
        "this_week": {
            "food_saved_kg": round(sum(float(s.get("quantity_kg", 0)) for s in approved_week), 2),
            "carbon_saved_kg": round(sum(float(s.get("carbon_saved_kg", 0)) for s in approved_week), 2),
            "saved_meals": sum(item["saved_meals"] for item in approved_week_impact),
            "local_value_tl": round(sum(item["local_value_tl"] for item in approved_week_impact), 2),
            "swaps_completed": len(approved_week),
        },
        "weekly_carbon": weekly_carbon,
    }


@router.get("/leaderboard")
async def leaderboard():
    supabase = get_supabase_client()
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    swaps = supabase.table("swaps").select("*").execute().data or []
    rows = []
    for coop in cooperatives:
        coop_swaps = [
            s
            for s in swaps
            if s.get("status") == "approved"
            and (s.get("from_cooperative_id") == coop.get("id") or s.get("to_cooperative_id") == coop.get("id"))
        ]
        rows.append(
            {
                **coop,
                "total_swaps": len(coop_swaps),
                "carbon_saved_kg": round(sum(float(s.get("carbon_saved_kg", 0)) for s in coop_swaps), 2),
            }
        )
    return {"items": sorted(rows, key=lambda row: row.get("green_score", 0), reverse=True)}
