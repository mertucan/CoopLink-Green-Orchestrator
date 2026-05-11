import os
import re

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "true").lower() not in {"0", "false", "no", "off"}
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
GEMINI_FALLBACK_MODELS = os.getenv(
    "GEMINI_FALLBACK_MODELS",
    "gemini-2.5-flash-lite,gemini-2.5-flash,gemini-2.0-flash-lite,gemini-2.0-flash",
)


def _build_model_candidates() -> list[str]:
    candidates = [GEMINI_MODEL]
    candidates.extend(model.strip() for model in GEMINI_FALLBACK_MODELS.split(",") if model.strip())

    unique_candidates = []
    for candidate in candidates:
        if candidate and candidate not in unique_candidates:
            unique_candidates.append(candidate)
    return unique_candidates


GEMINI_MODELS = _build_model_candidates()

if api_key and GEMINI_ENABLED:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    print(f"Gemini model sırası: {', '.join(GEMINI_MODELS)}")
elif api_key:
    print("Gemini devre dışı: GEMINI_ENABLED=false")
    model = None
else:
    print("HATA: .env dosyasında GEMINI_API_KEY bulunamadı!")
    model = None


def get_coop_analysis(inventory_data: str) -> str:
    """Supabase'den gelen stok verisini okuyup takas önerisi üretir."""
    if not GEMINI_ENABLED:
        return _local_inventory_analysis(
            inventory_data,
            "Gemini devre dışı olduğu için yerel analiz kullanıldı.",
        )

    if not api_key:
        return _local_inventory_analysis(
            inventory_data,
            "Gemini API anahtarı eksik olduğu için yerel analiz kullanıldı.",
        )

    prompt = _build_analysis_prompt(inventory_data)
    errors = []

    for model_name in GEMINI_MODELS:
        try:
            response = genai.GenerativeModel(model_name).generate_content(prompt)
            text = (getattr(response, "text", "") or "").strip()
            if text:
                return text
            errors.append(f"{model_name}: boş yanıt")
        except Exception as exc:
            error_text = str(exc)
            reason = _classify_gemini_error(error_text)
            errors.append(f"{model_name}: {reason}")
            print(f"Gemini hata verdi. Model={model_name} Hata={error_text}")

    reason = "Gemini modelleri yanıt veremedi; yerel analiz kullanıldı."
    if errors:
        reason += f" Denenenler: {' | '.join(errors[:3])}"
    return _local_inventory_analysis(inventory_data, reason)


def _build_analysis_prompt(inventory_data: str) -> str:
    compact_inventory = _compact_inventory_data(inventory_data)
    return f"""
Sen CoopLink Green Orchestrator asistanısın.
Aşağıdaki stokları kısa ve Türkçe analiz et.

Odak:
- Risk skoru 0.80 ve üstü stokları acil göster.
- Yakın/uygun kooperatifler için takas veya transfer öner.
- Karbon ve israf azaltımı etkisini kısa özetle.

Yanıtı Telegram'da okunacak şekilde kısa Markdown ver.

Stoklar:
{compact_inventory}
""".strip()


def _compact_inventory_data(inventory_data: str) -> str:
    lines = [line.strip() for line in inventory_data.splitlines() if line.strip()]
    if not lines:
        return "Stok verisi yok."
    return "\n".join(lines)[:6000]


def _classify_gemini_error(error_text: str) -> str:
    lowered = error_text.lower()
    if "429" in error_text or "quota" in lowered or "rate" in lowered:
        if "limit: 0" in lowered:
            return "bu model için ücretsiz kota 0"
        return "kota veya hız limiti"
    if "404" in error_text or "notfound" in lowered or "not found" in lowered:
        return "model bulunamadı veya API key erişemiyor"
    if "503" in error_text or "unavailable" in lowered:
        return "Gemini geçici olarak yanıt veremiyor"
    return "Gemini hatası"


def _local_inventory_analysis(inventory_data: str, reason: str) -> str:
    rows = _parse_inventory_rows(inventory_data)
    if not rows:
        return f"{reason}\n\nStok verisi bulunamadığı için analiz üretilemedi."

    critical = [row for row in rows if row["risk"] >= 0.8]
    warning = [row for row in rows if 0.6 <= row["risk"] < 0.8]
    top_risks = sorted(critical or warning or rows, key=lambda row: row["risk"], reverse=True)[:5]
    total_critical_kg = sum(row["quantity"] for row in critical)
    avg_risk = sum(row["risk"] for row in rows) / len(rows)

    lines = [
        reason,
        "",
        "Kritik riskler",
    ]
    for row in top_risks:
        label = "Acil" if row["risk"] >= 0.8 else "İzle"
        lines.append(f"- {label}: {row['cooperative']} | {row['quantity']:g} kg {row['product']} | risk {row['risk']:.2f}")

    if not critical:
        lines.append("- Acil eşik üstünde stok yok; riskli ürünler izleme listesinde tutulmalı.")

    lines.extend(
        [
            "",
            "Önerilen aksiyonlar",
            "- En riskli ürünlerden başlayarak takas önerisi oluştur.",
            "- Yakın şehir veya aynı bölgedeki kooperatiflerle eşleştir.",
            "- Bekleyen takası olmayan güvenli stokları müşteri özetine ekle.",
            "",
            "Özet",
            f"- Ortalama risk: {avg_risk:.2f}",
            f"- Acil stok miktarı: {total_critical_kg:g} kg",
        ]
    )
    return "\n".join(lines)


def _parse_inventory_rows(inventory_data: str) -> list[dict]:
    rows = []
    pattern = re.compile(r"-\s*(.*?):\s*([\d.,]+)\s*kg\s*(.*?)\s*\(Risk Skoru:\s*([\d.,]+)\)", re.IGNORECASE)
    for line in inventory_data.splitlines():
        match = pattern.search(line)
        if not match:
            continue
        rows.append(
            {
                "cooperative": match.group(1).strip() or "Kooperatif",
                "quantity": float(match.group(2).replace(",", ".")),
                "product": match.group(3).strip() or "ürün",
                "risk": float(match.group(4).replace(",", ".")),
            }
        )
    return rows
