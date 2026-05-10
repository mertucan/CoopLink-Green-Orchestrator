from app.agents.swap_agent import calculate_match_score


def test_high_urgency_near_distance_high_score():
    assert calculate_match_score(1.0, 1, 1.0, 2.0) > 0.9


def test_low_urgency_far_distance_low_score():
    assert calculate_match_score(0.3, 200, 0.1, 0.1) < 0.2


def test_full_demand_beats_partial_demand():
    full = calculate_match_score(1.0, 20, 0.5, 1.0)
    partial = calculate_match_score(0.4, 20, 0.5, 1.0)
    assert full > partial


def test_high_carbon_far_distance_medium_score():
    assert 0.45 < calculate_match_score(0.8, 160, 0.4, 15) < 0.7


def test_zero_distance_is_bounded():
    assert calculate_match_score(0.7, 0, 0.7, 1.0) <= 0.8


def test_negative_carbon_does_not_reduce_below_other_factors():
    assert calculate_match_score(0.8, 10, 0.8, -5) > 0.55


def test_urgency_increases_score():
    low = calculate_match_score(0.7, 30, 0.1, 1.0)
    high = calculate_match_score(0.7, 30, 0.9, 1.0)
    assert high - low > 0.2


def test_close_distance_beats_far_distance():
    close = calculate_match_score(0.7, 2, 0.5, 1.0)
    far = calculate_match_score(0.7, 120, 0.5, 1.0)
    assert close > far


def test_custom_weights_can_prioritize_carbon():
    score = calculate_match_score(0.2, 100, 0.1, 20, weights=(0.1, 0.1, 0.1, 0.7))
    assert score > 1.4


def test_score_is_never_negative():
    assert calculate_match_score(-1, 100, -1, -1) >= 0

