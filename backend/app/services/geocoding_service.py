import json
import re

from app.services.ai_service import model

PROVINCE_COORDINATES = {
    "Adana": (37.0000, 35.3213), "Adıyaman": (37.7648, 38.2786), "Afyonkarahisar": (38.7569, 30.5387),
    "Ağrı": (39.7191, 43.0503), "Amasya": (40.6533, 35.8331), "Ankara": (39.9334, 32.8597),
    "Antalya": (36.8969, 30.7133), "Artvin": (41.1828, 41.8183), "Aydın": (37.8560, 27.8416),
    "Balıkesir": (39.6533, 27.8903), "Bilecik": (40.1426, 29.9793), "Bingöl": (38.8847, 40.4939),
    "Bitlis": (38.3938, 42.1232), "Bolu": (40.7320, 31.6082), "Burdur": (37.7203, 30.2908),
    "Bursa": (40.1826, 29.0665), "Çanakkale": (40.1467, 26.4086), "Çankırı": (40.6013, 33.6134),
    "Çorum": (40.5506, 34.9556), "Denizli": (37.7765, 29.0864), "Diyarbakır": (37.9144, 40.2306),
    "Edirne": (41.6771, 26.5557), "Elazığ": (38.6748, 39.2225), "Erzincan": (39.7500, 39.5000),
    "Erzurum": (39.9043, 41.2679), "Eskişehir": (39.7767, 30.5206), "Gaziantep": (37.0662, 37.3833),
    "Giresun": (40.9128, 38.3895), "Gümüşhane": (40.4603, 39.4814), "Hakkari": (37.5744, 43.7408),
    "Hatay": (36.2023, 36.1613), "Isparta": (37.7648, 30.5566), "Mersin": (36.8121, 34.6415),
    "İstanbul": (41.0082, 28.9784), "İzmir": (38.4237, 27.1428), "Kars": (40.6013, 43.0975),
    "Kastamonu": (41.3887, 33.7827), "Kayseri": (38.7205, 35.4826), "Kırklareli": (41.7351, 27.2252),
    "Kırşehir": (39.1425, 34.1709), "Kocaeli": (40.8533, 29.8815), "Konya": (37.8746, 32.4932),
    "Kütahya": (39.4167, 29.9833), "Malatya": (38.3552, 38.3095), "Manisa": (38.6191, 27.4289),
    "Kahramanmaraş": (37.5753, 36.9228), "Mardin": (37.3122, 40.7350), "Muğla": (37.2153, 28.3636),
    "Muş": (38.9462, 41.7539), "Nevşehir": (38.6244, 34.7240), "Niğde": (37.9698, 34.6766),
    "Ordu": (40.9862, 37.8797), "Rize": (41.0201, 40.5234), "Sakarya": (40.7569, 30.3781),
    "Samsun": (41.2867, 36.3300), "Siirt": (37.9274, 41.9453), "Sinop": (42.0264, 35.1551),
    "Sivas": (39.7477, 37.0179), "Tekirdağ": (40.9780, 27.5110), "Tokat": (40.3167, 36.5500),
    "Trabzon": (41.0027, 39.7168), "Tunceli": (39.3074, 39.4388), "Şanlıurfa": (37.1674, 38.7955),
    "Uşak": (38.6823, 29.4082), "Van": (38.4891, 43.4089), "Yozgat": (39.8181, 34.8147),
    "Zonguldak": (41.4564, 31.7987), "Aksaray": (38.3687, 34.0370), "Bayburt": (40.2552, 40.2249),
    "Karaman": (37.1811, 33.2150), "Kırıkkale": (39.8468, 33.5153), "Batman": (37.8812, 41.1351),
    "Şırnak": (37.4187, 42.4918), "Bartın": (41.5811, 32.4610), "Ardahan": (41.1105, 42.7022),
    "Iğdır": (39.9237, 44.0450), "Yalova": (40.6500, 29.2667), "Karabük": (41.2061, 32.6204),
    "Kilis": (36.7184, 37.1212), "Osmaniye": (37.0742, 36.2478), "Düzce": (40.8438, 31.1565),
}


def get_region_coordinates(region: str) -> tuple[float | None, float | None]:
    prompt = (
        "Türkiye'deki bu ilin merkez koordinatlarını JSON olarak ver. "
        "Sadece şu formatta yanıtla: {\"latitude\": 39.0, \"longitude\": 35.0}. "
        f"İl: {region}"
    )
    if model:
        try:
            response = model.generate_content(prompt)
            match = re.search(r"\{.*\}", response.text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return float(data["latitude"]), float(data["longitude"])
        except Exception:
            pass

    return PROVINCE_COORDINATES.get(region, (None, None))
