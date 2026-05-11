import math
import os
from datetime import datetime, timezone


def process_expired_inventory(supabase) -> list[dict]:
    """Expire edilmiş stokları imha eder ve kooperatif puan cezası uygular."""
    now = datetime.now(timezone.utc)
    items = supabase.table("inventory").select("*").execute().data or []
    disposed_items = []

    for item in items:
        if float(item.get("quantity_kg", 0) or 0) <= 0:
            continue
        if item.get("disposed_at"):
            continue

        expires_at = _parse_datetime(item.get("expires_at"))
        if not expires_at or expires_at > now:
            continue

        penalty = calculate_disposal_penalty(float(item.get("quantity_kg", 0) or 0))
        _dispose_inventory_item(supabase, item, penalty, now)
        disposed_items.append({**item, "points_penalty": penalty, "disposed_at": now.isoformat()})

    return disposed_items


def calculate_disposal_penalty(quantity_kg: float) -> int:
    penalty_per_10kg = int(os.getenv("DISPOSAL_PENALTY_PER_10KG", "1"))
    max_penalty = int(os.getenv("DISPOSAL_MAX_PENALTY", "50"))
    return max(1, min(max_penalty, math.ceil(max(quantity_kg, 0) / 10) * penalty_per_10kg))


def _dispose_inventory_item(supabase, item: dict, penalty: int, now: datetime) -> None:
    quantity = float(item.get("quantity_kg", 0) or 0)
    update_payload = {
        "quantity_kg": 0,
        "risk_score": 1,
        "disposal_status": "disposed",
        "disposed_at": now.isoformat(),
        "disposed_quantity_kg": quantity,
        "disposal_penalty_points": penalty,
        "updated_at": now.isoformat(),
    }
    try:
        supabase.table("inventory").update(update_payload).eq("id", item["id"]).execute()
    except Exception:
        supabase.table("inventory").update(
            {"quantity_kg": 0, "risk_score": 1, "updated_at": now.isoformat()}
        ).eq("id", item["id"]).execute()

    _deduct_green_score(supabase, item.get("cooperative_id"), penalty)
    _log_disposal(supabase, item, penalty, quantity)


def _deduct_green_score(supabase, cooperative_id: str | None, penalty: int) -> None:
    if not cooperative_id:
        return
    rows = supabase.table("cooperatives").select("*").eq("id", cooperative_id).limit(1).execute().data or []
    if not rows:
        return
    current_score = int(rows[0].get("green_score", 0) or 0)
    supabase.table("cooperatives").update({"green_score": current_score - penalty}).eq("id", cooperative_id).execute()


def _log_disposal(supabase, item: dict, penalty: int, quantity: float) -> None:
    try:
        supabase.table("carbon_log").insert(
            {
                "cooperative_id": item.get("cooperative_id"),
                "event_type": "disposal",
                "kg_saved": 0,
                "points_earned": -penalty,
                "metadata": {
                    "inventory_id": item.get("id"),
                    "product_id": item.get("product_id"),
                    "disposed_quantity_kg": quantity,
                },
            }
        ).execute()
    except Exception:
        supabase.table("carbon_log").insert(
            {
                "cooperative_id": item.get("cooperative_id"),
                "event_type": "disposal",
                "kg_saved": 0,
                "points_earned": -penalty,
            }
        ).execute()


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed
