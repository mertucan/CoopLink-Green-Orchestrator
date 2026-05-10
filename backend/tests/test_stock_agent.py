from datetime import datetime, timedelta, timezone

from app.agents.stock_agent import calculate_risk


def test_risk_is_between_zero_and_one():
    risk = calculate_risk(50, datetime.now(timezone.utc) + timedelta(days=3), 10)
    assert 0 <= risk <= 1


def test_expired_product_is_max_risk():
    risk = calculate_risk(50, datetime.now(timezone.utc) - timedelta(days=1), 10)
    assert risk == 1.0


def test_thirty_day_product_is_low_risk():
    risk = calculate_risk(5, datetime.now(timezone.utc) + timedelta(days=30), 30)
    assert risk < 0.02

