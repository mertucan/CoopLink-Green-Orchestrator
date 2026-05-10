import os
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.agents.stock_agent import calculate_risk
from app.models.inventory import InventoryCreate
from app.services.supabase_client import get_supabase_client

# Bizim bildirim servisini dahil ediyoruz
from app.services.notification_service import send_push_notification

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
    
    # Bildirimde ürünün adını göstermek için yakalıyoruz
    product_name = product_rows[0].get("name", "Bilinmeyen Ürün")
    
    risk = calculate_risk(item.quantity_kg, item.expires_at, int(product_rows[0]["spoilage_rate_days"]))
    payload = item.model_dump()
    payload["expires_at"] = item.expires_at.isoformat()
    payload["risk_score"] = risk
    payload["updated_at"] = datetime.utcnow().isoformat()
    
    # Veriyi Supabase'e ekliyoruz
    created = supabase.table("inventory").insert(payload).execute().data
    
    # --- YENİ BİLDİRİM KODU BAŞLANGICI ---
    if created:
        # ID'yi kodun içinden değil, güvenli .env dosyasından alıyoruz
        CHAT_ID = os.getenv("TELEGRAM_ADMIN_ID")
        
        if CHAT_ID:
            mesaj = (
                f"🔔 **YENİ İLAN SİSTEME DÜŞTÜ!**\n\n"
                f"📦 **Ürün:** {product_name}\n"
                f"⚖️ **Miktar:** {item.quantity_kg}kg\n"
                f"⚠️ **Risk Skoru:** {risk:.2f}\n\n"
                f"Asistan analizini görmek için /analiz komutunu kullanabilirsin."
            )
            
            # Endpoint'i yavaşlatmamak için bildirimi arka planda asenkron olarak gönderiyoruz
            asyncio.create_task(send_push_notification(CHAT_ID, mesaj))
        else:
            print("⚠️ TELEGRAM_ADMIN_ID .env dosyasında bulunamadığı için bildirim atılamadı.")
    # --- BİLDİRİM KODU SONU ---

    return {"item": created[0] if created else payload}