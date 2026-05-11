import os
from functools import lru_cache
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()


class DemoQuery:
    def __init__(self, table_name: str, client: "DemoSupabaseClient"):
        self.table_name = table_name
        self.client = client
        self._payload = None
        self._filters: list[tuple[str, object]] = []
        self._limit: int | None = None
        self._order: tuple[str, bool] | None = None
        self._operation = "select"

    def select(self, *_args):
        return self

    def insert(self, payload):
        self._payload = payload
        self._operation = "insert"
        return self

    def update(self, payload):
        self._payload = payload
        self._operation = "update"
        return self

    def eq(self, key, value):
        self._filters.append((key, value))
        return self

    def limit(self, value):
        self._limit = value
        return self

    def order(self, key, desc=False):
        self._order = (key, desc)
        return self

    def execute(self):
        table = self.client.data.setdefault(self.table_name, [])
        rows = list(table)
        for key, value in self._filters:
            rows = [row for row in rows if row.get(key) == value]
        if self._operation == "insert" and self._payload is not None:
            payload = self._payload if isinstance(self._payload, list) else [self._payload]
            for row in payload:
                row.setdefault("id", str(uuid4()))
                if self.table_name in {"sessions", "inventory"}:
                    row.setdefault("updated_at", datetime.now(timezone.utc).isoformat())
                if self.table_name in {"swaps", "carbon_log", "cooperatives", "ai_logs"}:
                    row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            table.extend(payload)
            rows = payload
        if self._operation == "update" and self._payload is not None:
            updated = []
            for row in table:
                if all(row.get(key) == value for key, value in self._filters):
                    row.update(self._payload)
                    updated.append(row)
            rows = updated
        if self._order:
            key, desc = self._order
            rows.sort(key=lambda row: row.get(key, 0), reverse=desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        return type("DemoResponse", (), {"data": rows})()


class DemoSupabaseClient:
    def __init__(self):
        now = datetime.now(timezone.utc)
        self.data = {
            "cooperatives": [
                {"id": "00000000-0000-0000-0000-000000000101", "name": "Ege Tarım Kooperatifi", "region": "İzmir", "contact_phone": "+905321110001", "green_score": 285, "latitude": 38.4237, "longitude": 27.1428},
                {"id": "00000000-0000-0000-0000-000000000102", "name": "Akdeniz Üreticileri", "region": "Antalya", "contact_phone": "+905321110002", "green_score": 220, "latitude": 36.8969, "longitude": 30.7133},
                {"id": "00000000-0000-0000-0000-000000000103", "name": "İç Anadolu Tarım", "region": "Konya", "contact_phone": "+905321110003", "green_score": 165, "latitude": 37.8746, "longitude": 32.4932},
                {"id": "00000000-0000-0000-0000-000000000104", "name": "Karadeniz Fındık Kooperatifi", "region": "Trabzon", "contact_phone": "+905321110004", "green_score": 132, "latitude": 41.0027, "longitude": 39.7168},
                {"id": "00000000-0000-0000-0000-000000000105", "name": "Trakya Tahıl Birliği", "region": "Edirne", "contact_phone": "+905321110005", "green_score": 188, "latitude": 41.6771, "longitude": 26.5557},
            ],
            "products": [
                {"id": "00000000-0000-0000-0000-000000000201", "name": "domates", "category": "sebze", "spoilage_rate_days": 5},
                {"id": "00000000-0000-0000-0000-000000000202", "name": "biber", "category": "sebze", "spoilage_rate_days": 6},
                {"id": "00000000-0000-0000-0000-000000000203", "name": "elma", "category": "meyve", "spoilage_rate_days": 25},
                {"id": "00000000-0000-0000-0000-000000000205", "name": "süt", "category": "süt ürünü", "spoilage_rate_days": 4},
                {"id": "00000000-0000-0000-0000-000000000206", "name": "yoğurt", "category": "süt ürünü", "spoilage_rate_days": 10},
                {"id": "00000000-0000-0000-0000-000000000208", "name": "buğday", "category": "tahıl", "spoilage_rate_days": 180},
                {"id": "00000000-0000-0000-0000-000000000213", "name": "portakal", "category": "meyve", "spoilage_rate_days": 21},
                {"id": "00000000-0000-0000-0000-000000000219", "name": "yumurta", "category": "süt ürünü", "spoilage_rate_days": 20},
            ],
            "inventory": [
                {"id": "20000000-0000-0000-0000-000000000001", "cooperative_id": "00000000-0000-0000-0000-000000000101", "product_id": "00000000-0000-0000-0000-000000000201", "quantity_kg": 80, "expires_at": (now + timedelta(days=1)).isoformat(), "risk_score": 1.0},
                {"id": "20000000-0000-0000-0000-000000000002", "cooperative_id": "00000000-0000-0000-0000-000000000101", "product_id": "00000000-0000-0000-0000-000000000203", "quantity_kg": 140, "expires_at": (now + timedelta(days=18)).isoformat(), "risk_score": 0.31},
                {"id": "20000000-0000-0000-0000-000000000003", "cooperative_id": "00000000-0000-0000-0000-000000000102", "product_id": "00000000-0000-0000-0000-000000000206", "quantity_kg": 65, "expires_at": (now + timedelta(days=2)).isoformat(), "risk_score": 1.0},
                {"id": "20000000-0000-0000-0000-000000000004", "cooperative_id": "00000000-0000-0000-0000-000000000103", "product_id": "00000000-0000-0000-0000-000000000208", "quantity_kg": 600, "expires_at": (now + timedelta(days=120)).isoformat(), "risk_score": 0.03},
                {"id": "20000000-0000-0000-0000-000000000005", "cooperative_id": "00000000-0000-0000-0000-000000000105", "product_id": "00000000-0000-0000-0000-000000000213", "quantity_kg": 85, "expires_at": (now + timedelta(days=5)).isoformat(), "risk_score": 0.81},
            ],
            "swaps": [
                {"id": "10000000-0000-0000-0000-000000000001", "from_cooperative_id": "00000000-0000-0000-0000-000000000101", "to_cooperative_id": "00000000-0000-0000-0000-000000000102", "product_id": "00000000-0000-0000-0000-000000000201", "quantity_kg": 80, "match_score": 0.87, "status": "pending", "carbon_saved_kg": 2.1, "created_at": now.isoformat()},
                {"id": "10000000-0000-0000-0000-000000000003", "from_cooperative_id": "00000000-0000-0000-0000-000000000103", "to_cooperative_id": "00000000-0000-0000-0000-000000000105", "product_id": "00000000-0000-0000-0000-000000000208", "quantity_kg": 120, "match_score": 0.74, "status": "approved", "carbon_saved_kg": 4.2, "created_at": (now - timedelta(days=3)).isoformat(), "resolved_at": (now - timedelta(days=2)).isoformat()},
            ],
            "sessions": [],
            "carbon_log": [],
            "ai_logs": [
                {
                    "id": "40000000-0000-0000-0000-000000000001",
                    "channel_id": "admin-panel",
                    "user_message": "10 kg elma var mı?",
                    "detected_intent": "query_stock",
                    "selected_tool": "query_stock",
                    "model_name": "local-intent-fallback",
                    "used_gemini": False,
                    "fallback_used": True,
                    "prompt": "Mesaj için intent seç: query_stock, propose_swap, track_delivery.",
                    "gemini_response": None,
                    "final_response": "Ağda 1 uygun stok kaydı bulundu.",
                    "metadata": {"product": "elma", "quantity_kg": 10},
                    "created_at": (now - timedelta(minutes=18)).isoformat(),
                },
                {
                    "id": "40000000-0000-0000-0000-000000000002",
                    "channel_id": "admin-panel",
                    "user_message": "Elimde 80 kg domates kaldı",
                    "detected_intent": "propose_swap",
                    "selected_tool": "propose_swap",
                    "model_name": "gemini-2.0-flash",
                    "used_gemini": True,
                    "fallback_used": False,
                    "prompt": "Mesaj için intent seç: query_stock, propose_swap, track_delivery.",
                    "gemini_response": "propose_swap",
                    "final_response": "Takas önerisi oluşturuldu.",
                    "metadata": {"product": "domates", "quantity_kg": 80},
                    "created_at": (now - timedelta(minutes=7)).isoformat(),
                },
            ],
        }

    def table(self, table_name: str):
        return DemoQuery(table_name, self)


@lru_cache(maxsize=1)
def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key or "your-project" in url:
        return DemoSupabaseClient()
    from supabase import create_client

    return create_client(url, key)


def test_connection() -> bool:
    client = get_supabase_client()
    client.table("cooperatives").select("id").limit(1).execute()
    return True
