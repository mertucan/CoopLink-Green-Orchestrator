import pytest

from app.agents.orchestrator import detect_intent


@pytest.mark.parametrize(
    ("message", "intent"),
    [
        ("10 kg elma var mı?", "query_stock"),
        ("Elimde 50 kg yoğurt kaldı", "propose_swap"),
        ("Siparişim nerede?", "track_delivery"),
        ("biraz domates kaldı sanırım", "query_stock"),
        ("Organik süt bulabilir miyiz?", "query_stock"),
        ("Teslimat rotası belli mi?", "track_delivery"),
        ("120 kilo biber bozulacak", "propose_swap"),
        ("Peynir stok durumunu öğrenmek istiyorum", "query_stock"),
        ("Araç nerede kaldı?", "track_delivery"),
        ("Fazla portakal var takas edelim", "propose_swap"),
    ],
)
def test_detect_intent_for_turkish_messages(message, intent):
    assert detect_intent(message) == intent
