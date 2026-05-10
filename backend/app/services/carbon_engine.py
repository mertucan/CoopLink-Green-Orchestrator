import os
from dotenv import load_dotenv

load_dotenv()


def emission_factor() -> float:
    return float(os.getenv("EMISSION_FACTOR_KG_PER_KM", "0.21"))


def calculate_carbon_saving(
    distance_separate_km: float,
    distance_optimized_km: float,
    emission_factor_kg_per_km: float | None = None,
) -> float:
    factor = emission_factor_kg_per_km if emission_factor_kg_per_km is not None else emission_factor()
    return max(distance_separate_km - distance_optimized_km, 0) * factor


def calculate_green_points(kg_saved: float, food_saved_kg: float = 0) -> int:
    return max(round((kg_saved * 10) + (food_saved_kg * 0.2)), 1)

