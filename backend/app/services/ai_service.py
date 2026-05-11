import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
else:
    print("HATA: .env dosyasında GEMINI_API_KEY bulunamadı!")
    model = None

def get_coop_analysis(inventory_data: str) -> str:
    """Supabase'den gelen stok verisini okuyup takas önerisi üreten fonksiyon."""
    if not model:
        return _local_inventory_analysis(inventory_data, "Gemini API anahtarı eksik olduğu için yerel analiz kullanıldı.")

    prompt = f"""
    Sen CoopLink projesinin 'Green Orchestrator' yapay zeka asistanısın. 
    Aşağıdaki kooperatif envanter verilerini analiz etmeni istiyorum.
    
    Görevlerin:
    1. Bozulma riski çok yüksek (risk_score >= 0.8) olan ürünleri acil olarak tespit et.
    2. Bu ürünlerin israf olmaması için kooperatifler arası takas/transfer önerileri sun.
    3. 'Yeşil Lojistik' ve 'Karbon Tasarrufu' vurgusu yap (Örn: Yakın mesafeli transferler).
    4. Yanıtın Telegram'da okunacak şekilde kısa, profesyonel ve Markdown formatında olsun.

    Envanter Verileri:
    {inventory_data}

    Lütfen analizini şu 3 başlık altında sun:
    🚨 **Kritik Riskler**
    🤝 **Önerilen Yeşil Rotalar**
    🌱 **Tahmini Çevresel Etki**
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_text = str(e)
        if "429" in error_text or "quota" in error_text.lower() or "rate" in error_text.lower():
            return _local_inventory_analysis(
                inventory_data,
                "Gemini kotası dolduğu için yerel analiz kullanıldı.",
            )
        return _local_inventory_analysis(
            inventory_data,
            f"Gemini analizi tamamlanamadı; yerel analiz kullanıldı. Model: {GEMINI_MODEL}",
        )


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
            "- Risk skoru en yüksek ürünlerden başlayarak takas önerisi oluştur.",
            "- Son kullanma tarihi yakın ürünleri aynı şehir veya yakın kooperatiflerle eşleştir.",
            "- Müşteri özeti için düşük riskli ve bekleyen takası olmayan stokları paylaş.",
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
