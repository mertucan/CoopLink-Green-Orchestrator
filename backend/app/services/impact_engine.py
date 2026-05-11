KG_PER_MEAL = 0.714
POTENTIAL_CARBON_KG_PER_FOOD_KG = 0.02625

PRODUCT_PRICE_TL_PER_KG = {
    "domates": 18.125,
    "biber": 34,
    "elma": 22,
    "armut": 28,
    "süt": 32,
    "yoğurt": 45,
    "peynir": 180,
    "buğday": 12,
    "mısır": 11,
    "fındık": 220,
    "zeytin": 75,
    "üzüm": 38,
    "portakal": 24,
    "limon": 30,
    "patates": 16,
    "soğan": 14,
    "sarımsak": 95,
    "bal": 240,
    "yumurta": 60,
    "zeytinyağı": 210,
}

CATEGORY_PRICE_TL_PER_KG = {
    "sebze": 22,
    "meyve": 30,
    "süt ürünü": 55,
    "tahıl": 18,
}


def calculate_saved_meals(quantity_kg: float) -> int:
    return round(max(float(quantity_kg or 0), 0) / KG_PER_MEAL)


def estimate_local_value_tl(quantity_kg: float, product: dict | None = None) -> float:
    product = product or {}
    product_name = str(product.get("name", "")).lower()
    category = str(product.get("category", "")).lower()
    price = PRODUCT_PRICE_TL_PER_KG.get(product_name) or CATEGORY_PRICE_TL_PER_KG.get(category) or 25
    return round(max(float(quantity_kg or 0), 0) * price, 2)


def build_impact_summary(quantity_kg: float, carbon_saved_kg: float = 0, product: dict | None = None) -> dict:
    local_value = estimate_local_value_tl(quantity_kg, product)
    meals = calculate_saved_meals(quantity_kg)
    return {
        "saved_meals": meals,
        "local_value_tl": local_value,
        "impact_sentence": (
            f"{float(quantity_kg or 0):g} kg {product.get('name', 'ürün') if product else 'ürün'}, "
            f"{meals} öğün, {float(carbon_saved_kg or 0):.1f} kg CO2 ve "
            f"{local_value:,.0f} TL yerel değer kurtarıldı."
        ),
    }


def build_loss_projection(quantity_kg: float, product: dict | None = None) -> dict:
    quantity = max(float(quantity_kg or 0), 0)
    local_value = estimate_local_value_tl(quantity, product)
    meals = calculate_saved_meals(quantity)
    potential_carbon = round(quantity * POTENTIAL_CARBON_KG_PER_FOOD_KG, 2)
    return {
        "lost_meals_if_unrescued": meals,
        "lost_local_value_tl_if_unrescued": local_value,
        "potential_carbon_kg_if_unrescued": potential_carbon,
        "loss_sentence": (
            f"Kurtarılmazsa {meals} öğün, {local_value:,.0f} TL yerel değer ve "
            f"{potential_carbon:.1f} kg CO2 etkisi kaybedilebilir."
        ),
    }
