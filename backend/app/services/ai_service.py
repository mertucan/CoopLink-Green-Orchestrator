import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Yeni nesil Gemini Client'ı kuruyoruz
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
else:
    print("⚠️ HATA: .env dosyasında GEMINI_API_KEY bulunamadı!")
    client = None

def get_coop_analysis(inventory_data: str) -> str:
    """Supabase'den gelen stok verisini okuyup takas önerisi üreten fonksiyon."""
    if not client:
        return "⚠️ Gemini API anahtarı eksik olduğu için analiz yapılamıyor."

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
        # Yeni kütüphanenin çağrı yapısı
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Analiz sırasında bir hata oluştu: {str(e)}"