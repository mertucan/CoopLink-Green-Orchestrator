import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
else:
    print("⚠️ HATA: .env dosyasında GEMINI_API_KEY bulunamadı!")
    model = None

def get_coop_analysis(inventory_data: str) -> str:
    """Supabase'den gelen stok verisini okuyup takas önerisi üreten fonksiyon."""
    if not model:
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
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Analiz sırasında bir hata oluştu: {str(e)}"
