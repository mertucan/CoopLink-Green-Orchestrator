from app.services.carbon_engine import calculate_carbon_saving


def optimize_route(points: list[dict]) -> list[dict]:
    if not points:
        return []
    remaining = points[:]
    route = [remaining.pop(0)]
    while remaining:
        last = route[-1]
        nearest = min(
            remaining,
            key=lambda point: (last["latitude"] - point["latitude"]) ** 2 + (last["longitude"] - point["longitude"]) ** 2,
        )
        remaining.remove(nearest)
        route.append(nearest)
    return route


class LogisticsAgent:
    async def track_delivery(self, delivery_id: str | None = None) -> dict:
        saved = calculate_carbon_saving(42, 31)
        return {
            "intent": "track_delivery",
            "delivery_id": delivery_id,
            "carbon_saved_kg": round(saved, 2),
            "message": f"Teslimat yarın 10:00'da. Rota optimize edildi, {saved:.1f} kg CO2 tasarruf edildi.",
        }

