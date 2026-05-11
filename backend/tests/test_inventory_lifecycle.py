from datetime import datetime, timedelta, timezone

from app.services.inventory_lifecycle import calculate_disposal_penalty, process_expired_inventory
from app.services.supabase_client import DemoSupabaseClient


def test_disposal_penalty_scales_by_quantity():
    assert calculate_disposal_penalty(1) == 1
    assert calculate_disposal_penalty(10) == 1
    assert calculate_disposal_penalty(11) == 2


def test_expired_inventory_is_disposed_and_penalizes_cooperative():
    client = DemoSupabaseClient()
    coop_id = client.data["cooperatives"][0]["id"]
    initial_score = client.data["cooperatives"][0]["green_score"]
    expired_item = {
        "id": "expired-test",
        "cooperative_id": coop_id,
        "product_id": client.data["products"][0]["id"],
        "quantity_kg": 24,
        "expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "risk_score": 1,
    }
    client.data["inventory"].append(expired_item)

    disposed = process_expired_inventory(client)

    assert disposed[0]["id"] == "expired-test"
    assert expired_item["quantity_kg"] == 0
    assert expired_item["disposal_status"] == "disposed"
    assert client.data["cooperatives"][0]["green_score"] == initial_score - 3
