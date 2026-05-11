from datetime import datetime, timedelta, timezone
from random import Random

from app.agents.stock_agent import calculate_risk
from app.services.auth_service import hash_password
from app.services.supabase_client import get_supabase_client

COOPERATIVES = [
    {"name": "Ege Tarım Kooperatifi", "region": "İzmir", "contact_phone": "+905321110001", "green_score": 285, "latitude": 38.4237, "longitude": 27.1428},
    {"name": "Akdeniz Üreticileri", "region": "Antalya", "contact_phone": "+905321110002", "green_score": 220, "latitude": 36.8969, "longitude": 30.7133},
    {"name": "İç Anadolu Tarım", "region": "Konya", "contact_phone": "+905321110003", "green_score": 165, "latitude": 37.8746, "longitude": 32.4932},
    {"name": "Karadeniz Fındık Kooperatifi", "region": "Trabzon", "contact_phone": "+905321110004", "green_score": 132, "latitude": 41.0027, "longitude": 39.7168},
    {"name": "Trakya Tahıl Birliği", "region": "Edirne", "contact_phone": "+905321110005", "green_score": 188, "latitude": 41.6771, "longitude": 26.5557},
]

PRODUCTS = [
    ("domates", "sebze", 5), ("biber", "sebze", 6), ("elma", "meyve", 25), ("armut", "meyve", 18),
    ("süt", "süt ürünü", 4), ("yoğurt", "süt ürünü", 10), ("peynir", "süt ürünü", 30), ("buğday", "tahıl", 180),
    ("mısır", "tahıl", 120), ("fındık", "tahıl", 240), ("zeytin", "meyve", 90), ("üzüm", "meyve", 7),
    ("portakal", "meyve", 21), ("limon", "meyve", 30), ("patates", "sebze", 60), ("soğan", "sebze", 75),
    ("sarımsak", "sebze", 120), ("bal", "tahıl", 365), ("yumurta", "süt ürünü", 20), ("zeytinyağı", "tahıl", 365),
]


def seed() -> None:
    rng = Random(42)
    supabase = get_supabase_client()
    coop_rows = []
    product_rows = []

    for idx, coop in enumerate(COOPERATIVES, start=1):
        row = {
            "id": f"00000000-0000-0000-0000-00000000010{idx}",
            "role": "cooperative",
            "password_hash": hash_password("demo123"),
            **coop,
        }
        coop_rows.append(row)
    coop_rows.append(
        {
            "id": "00000000-0000-0000-0000-000000000199",
            "name": "CoopLink Admin",
            "region": "Merkez",
            "contact_phone": "+905321119999",
            "role": "admin",
            "password_hash": hash_password("admin123"),
            "green_score": 0,
            "latitude": 39.0,
            "longitude": 35.0,
        }
    )
    for idx, (name, category, spoilage) in enumerate(PRODUCTS, start=1):
        product_rows.append(
            {
                "id": f"00000000-0000-0000-0000-0000000002{idx:02d}",
                "name": name,
                "category": category,
                "spoilage_rate_days": spoilage,
            }
        )

    supabase.table("cooperatives").insert(coop_rows).execute()
    supabase.table("products").insert(product_rows).execute()

    now = datetime.now(timezone.utc)
    inventory_rows = []
    for coop in coop_rows:
        for product in rng.sample(product_rows, rng.randint(5, 8)):
            quantity = rng.choice([18, 35, 50, 80, 120, 160])
            days_left = rng.choice([1, 2, 3, 7, 14, 30, 45])
            expires_at = now + timedelta(days=days_left)
            risk = calculate_risk(quantity, expires_at, product["spoilage_rate_days"])
            inventory_rows.append(
                {
                    "cooperative_id": coop["id"],
                    "product_id": product["id"],
                    "quantity_kg": quantity,
                    "expires_at": expires_at.isoformat(),
                    "risk_score": risk,
                }
            )
    supabase.table("inventory").insert(inventory_rows).execute()

    swaps = [
        {
            "from_cooperative_id": coop_rows[0]["id"],
            "to_cooperative_id": coop_rows[1]["id"],
            "product_id": product_rows[0]["id"],
            "quantity_kg": 80,
            "match_score": 0.87,
            "status": "pending",
            "carbon_saved_kg": 2.1,
        },
        {
            "from_cooperative_id": coop_rows[2]["id"],
            "to_cooperative_id": coop_rows[4]["id"],
            "product_id": product_rows[7]["id"],
            "quantity_kg": 120,
            "match_score": 0.74,
            "status": "approved",
            "carbon_saved_kg": 4.2,
        },
    ]
    supabase.table("swaps").insert(swaps).execute()
    print(f"Seed tamamlandı: {len(coop_rows)} kooperatif, {len(product_rows)} ürün, {len(inventory_rows)} envanter.")


if __name__ == "__main__":
    seed()
