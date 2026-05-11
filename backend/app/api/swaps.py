from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException

from app.models.swap import SwapUpdate
from app.agents.swap_agent import calculate_match_score, haversine_km
from app.services.carbon_engine import calculate_carbon_saving, calculate_green_points
from app.services.auth_service import get_current_user, get_optional_user
from app.services.impact_engine import build_impact_summary
from app.services.inventory_lifecycle import process_expired_inventory
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/swaps", tags=["swaps"])


@router.get("")
async def list_swaps(status: str | None = None, user: dict | None = Depends(get_optional_user)):
    supabase = get_supabase_client()
    query = supabase.table("swaps").select("*")
    if status:
        query = query.eq("status", status)
    rows = query.execute().data or []
    if user and user.get("role") == "cooperative":
        rows = [
            row
            for row in rows
            if row.get("from_cooperative_id") == user["id"] or row.get("to_cooperative_id") == user["id"]
        ]
    return {"items": _enrich_swaps(supabase, rows)}


@router.post("/propose")
async def propose_swap(payload: dict, user: dict = Depends(get_current_user)):
    inventory_id = payload.get("inventory_id")
    if not inventory_id:
        raise HTTPException(status_code=400, detail="Envanter kaydı seçilmedi.")

    supabase = get_supabase_client()
    process_expired_inventory(supabase)
    inventory_rows = supabase.table("inventory").select("*").eq("id", inventory_id).limit(1).execute().data or []
    if not inventory_rows:
        raise HTTPException(status_code=404, detail="Envanter kaydı bulunamadı.")

    item = inventory_rows[0]
    if item.get("disposal_status") == "disposed" or item.get("disposed_at") or float(item.get("quantity_kg", 0)) <= 0:
        raise HTTPException(status_code=400, detail="Bu stok imha edildiği için takas önerisi oluşturulamaz.")
    if user.get("role") == "cooperative" and item.get("cooperative_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Sadece kendi stoklarınız için takas önerebilirsiniz.")
    expires_at = datetime.fromisoformat(str(item["expires_at"]).replace("Z", "+00:00"))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Son kullanma tarihi geçmiş stok için takas önerisi oluşturulamaz. Bu ürün için ayrı aksiyon alınmalı.")

    existing_pending = (
        supabase.table("swaps")
        .select("*")
        .eq("from_cooperative_id", item["cooperative_id"])
        .eq("product_id", item["product_id"])
        .eq("status", "pending")
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing_pending:
        return {"item": _enrich_swaps(supabase, existing_pending)[0], "reused": True}

    cooperatives = supabase.table("cooperatives").select("*").eq("role", "cooperative").execute().data or []
    source = next((coop for coop in cooperatives if coop.get("id") == item.get("cooperative_id")), None)
    candidates = [coop for coop in cooperatives if coop.get("id") != item.get("cooperative_id")]
    if not source or not candidates:
        raise HTTPException(status_code=400, detail="Takas için uygun kooperatif bulunamadı.")

    scored_candidates = []
    for candidate in candidates:
        if all(candidate.get(key) is not None for key in ("latitude", "longitude")) and all(source.get(key) is not None for key in ("latitude", "longitude")):
            distance = haversine_km(float(source["latitude"]), float(source["longitude"]), float(candidate["latitude"]), float(candidate["longitude"]))
        else:
            distance = 35.0
        scored_candidates.append((distance, candidate))

    distance_km, target = min(scored_candidates, key=lambda pair: pair[0])
    separate_distance = distance_km * 2
    optimized_distance = distance_km * 1.35
    carbon_saved = calculate_carbon_saving(separate_distance, optimized_distance)
    urgency = max(float(item.get("risk_score", 0.5)), 0.5)
    quantity = float(item.get("quantity_kg", 0))
    score = calculate_match_score(0.85, distance_km, urgency, carbon_saved)
    swap = {
        "id": str(uuid4()),
        "from_cooperative_id": item["cooperative_id"],
        "to_cooperative_id": target["id"],
        "product_id": item["product_id"],
        "quantity_kg": quantity,
        "match_score": score,
        "status": "pending",
        "carbon_saved_kg": round(carbon_saved, 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    created = supabase.table("swaps").insert(swap).execute().data or [swap]
    return {"item": _enrich_swaps(supabase, created)[0]}


@router.patch("/{swap_id}")
async def update_swap(swap_id: str, update: SwapUpdate, user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    existing_rows = supabase.table("swaps").select("*").eq("id", swap_id).limit(1).execute().data or []
    if not existing_rows:
        raise HTTPException(status_code=404, detail="Takas bulunamadı.")
    if user.get("role") == "cooperative" and user["id"] not in {
        existing_rows[0].get("from_cooperative_id"),
        existing_rows[0].get("to_cooperative_id"),
    }:
        raise HTTPException(status_code=403, detail="Bu takası güncelleme yetkiniz yok.")
    previous_status = existing_rows[0].get("status")
    payload = {"status": update.status.value}
    if update.status.value in {"approved", "rejected"}:
        payload["resolved_at"] = datetime.now(timezone.utc).isoformat()
    rows = supabase.table("swaps").update(payload).eq("id", swap_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Takas bulunamadı.")
    points = 0
    log_created = False
    if previous_status == "pending" and update.status.value == "approved":
        swap = rows[0]
        points = calculate_green_points(float(swap.get("carbon_saved_kg", 0)), float(swap.get("quantity_kg", 0)))
        supabase.table("carbon_log").insert(
            {
                "cooperative_id": swap.get("from_cooperative_id"),
                "event_type": "swap",
                "kg_saved": swap.get("carbon_saved_kg", 0),
                "points_earned": points,
            }
        ).execute()
        cooperatives = supabase.table("cooperatives").select("*").eq("id", swap.get("from_cooperative_id")).limit(1).execute().data or []
        if cooperatives:
            current_score = int(cooperatives[0].get("green_score", 0))
            supabase.table("cooperatives").update({"green_score": current_score + points}).eq("id", swap.get("from_cooperative_id")).execute()
        _reduce_inventory_after_approval(supabase, swap)
        log_created = True

    enriched = _enrich_swaps(supabase, rows)[0]
    message = _swap_update_message(enriched, previous_status, update.status.value, points)
    return {
        "status": update.status.value,
        "id": swap_id,
        "item": enriched,
        "points_earned": points,
        "log_created": log_created,
        "message": message,
    }


def _swap_update_message(swap: dict, previous_status: str, next_status: str, points: int) -> str:
    product = swap.get("product_name", "ürün")
    quantity = float(swap.get("quantity_kg", 0))
    from_name = swap.get("from_cooperative_name", "Kooperatif")
    to_name = swap.get("to_cooperative_name", "kooperatif")
    carbon = float(swap.get("carbon_saved_kg", 0))
    meals = int(swap.get("saved_meals", 0))
    local_value = float(swap.get("local_value_tl", 0))
    if previous_status != "pending":
        return f"{product} takası zaten {previous_status} durumundaydı; ek puan yazılmadı."
    if next_status == "approved":
        return f"{quantity:g} kg {product} takası onaylandı. {meals} öğün, {carbon:.1f} kg CO2 ve {local_value:,.0f} TL yerel değer kurtarıldı. {from_name} +{points} yeşil puan aldı."
    if next_status == "rejected":
        return f"{quantity:g} kg {product} takası reddedildi. {from_name} -> {to_name} akışı kapatıldı."
    return f"{product} takası {next_status} durumuna alındı."


def _reduce_inventory_after_approval(supabase, swap: dict) -> None:
    rows = (
        supabase.table("inventory")
        .select("*")
        .eq("cooperative_id", swap.get("from_cooperative_id"))
        .eq("product_id", swap.get("product_id"))
        .execute()
        .data
        or []
    )
    if not rows:
        return
    rows.sort(key=lambda row: row.get("expires_at", ""))
    remaining = float(swap.get("quantity_kg", 0))
    for row in rows:
        if remaining <= 0:
            break
        current_quantity = float(row.get("quantity_kg", 0))
        used = min(current_quantity, remaining)
        remaining -= used
        new_quantity = round(current_quantity - used, 2)
        supabase.table("inventory").update(
            {"quantity_kg": new_quantity, "risk_score": 0 if new_quantity <= 0 else row.get("risk_score", 0)}
        ).eq("id", row["id"]).execute()


def _enrich_swaps(supabase, swaps: list[dict]) -> list[dict]:
    products = supabase.table("products").select("*").execute().data or []
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    product_map = {row["id"]: row for row in products}
    cooperative_map = {row["id"]: row for row in cooperatives}

    enriched = []
    for swap in swaps:
        product = product_map.get(swap.get("product_id"), {})
        from_coop = cooperative_map.get(swap.get("from_cooperative_id"), {})
        to_coop = cooperative_map.get(swap.get("to_cooperative_id"), {})
        enriched.append(
            {
                **swap,
                "product_name": product.get("name", swap.get("product_id")),
                "from_cooperative_name": from_coop.get("name", swap.get("from_cooperative_id")),
                "to_cooperative_name": to_coop.get("name", swap.get("to_cooperative_id")),
                **build_impact_summary(
                    float(swap.get("quantity_kg", 0)),
                    float(swap.get("carbon_saved_kg", 0)),
                    product,
                ),
            }
        )
    return enriched
