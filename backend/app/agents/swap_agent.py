import math
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

from app.services.carbon_engine import calculate_green_points
from app.services.supabase_client import get_supabase_client

load_dotenv()


def _weights() -> tuple[float, float, float, float]:
    return (
        float(os.getenv("SWAP_WEIGHT_DEMAND", "0.4")),
        float(os.getenv("SWAP_WEIGHT_DISTANCE", "0.2")),
        float(os.getenv("SWAP_WEIGHT_URGENCY", "0.3")),
        float(os.getenv("SWAP_WEIGHT_CARBON", "0.1")),
    )


def calculate_match_score(
    demand_match_ratio: float,
    distance_km: float,
    urgency_score: float,
    carbon_saving_kg: float,
    weights: tuple[float, float, float, float] | None = None,
) -> float:
    w1, w2, w3, w4 = weights or _weights()
    score = (
        w1 * max(min(demand_match_ratio, 1), 0)
        + w2 * (1 / max(distance_km, 1))
        + w3 * max(min(urgency_score, 1), 0)
        + w4 * max(carbon_saving_kg, 0) / 10
    )
    return round(max(score, 0), 4)


def haversine_km(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    radius = 6371
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi = math.radians(b_lat - a_lat)
    d_lambda = math.radians(b_lng - a_lng)
    x = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))


def generate_swap_protocol(from_name: str, to_name: str, product_name: str, quantity_kg: float, carbon_saved_kg: float) -> str:
    return (
        f"Takas önerisi: {from_name} -> {to_name}. "
        f"Ürün: {product_name}, miktar: {quantity_kg:.1f} kg. "
        f"Tahmini teslimat: yarın 10:00. Tahmini CO2 tasarrufu: {carbon_saved_kg:.1f} kg."
    )


class SwapAgent:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def propose_swap(self, product_name: str, quantity_kg: float, urgency_score: float = 0.8) -> dict:
        try:
            carbon_saved = max(quantity_kg * 0.025, 0.2)
            score = calculate_match_score(0.9, 24, urgency_score, carbon_saved)
            protocol = generate_swap_protocol(
                "Bildiren Kooperatif",
                "En Yakın Uygun Kooperatif",
                product_name,
                quantity_kg,
                carbon_saved,
            )
            return {
                "intent": "propose_swap",
                "match_score": score,
                "carbon_saved_kg": round(carbon_saved, 2),
                "message": f"{protocol} Skor: {score:.2f}. Onayla / Reddet / Değiştir",
            }
        except Exception as exc:
            return {"intent": "propose_swap", "error": f"Takas önerisi üretilemedi: {exc}"}

    async def approve_swap(self, swap_id: str, cooperative_id: str, carbon_saved_kg: float, food_saved_kg: float) -> dict:
        points = calculate_green_points(carbon_saved_kg, food_saved_kg)
        self.supabase.table("swaps").update(
            {"status": "approved", "resolved_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", swap_id).execute()
        self.supabase.table("carbon_log").insert(
            {
                "cooperative_id": cooperative_id,
                "event_type": "swap",
                "kg_saved": carbon_saved_kg,
                "points_earned": points,
            }
        ).execute()
        return {"status": "approved", "points_earned": points}

