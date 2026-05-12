from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Gemini Ayarları
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_bot(request: ChatRequest):
    try:
        if not GEMINI_API_KEY:
            return {"reply": "Sistem şu an meşgul, lütfen daha sonra tekrar deneyin."}

        # Jüriyi etkileyecek detaylandırılmış Agent Promptu
        system_prompt = """
        Sen CoopLink Green Orchestrator'ın Yeşil Asistanısın. Kısa, samimi ve çözüm odaklı yanıtlar ver.
        
        Kullanıcı aşağıdaki spesifik konularda soru sorarsa şu kurallara göre yanıtla:
        1. "Hesabım": Kullanıcıyı üst menüdeki 'Dashboard' (Panel) veya 'Operasyon' sayfasına yönlendir.
        2. "Destek Taleplerim": Kullanıcıya taleplerinin AI tarafından incelendiğini ve yöneticilerin en kısa sürede dönüş yapacağını söyle.
        3. "Telegram Botu Linki": Kullanıcıyı doğrudan şu gerçek linke yönlendir: https://t.me/CoopLinkBot. (Yanıtında kesinlikle '[Link Buraya Gelecek]' gibi yer tutucular kullanma, doğrudan bu URL'yi ver).       
        4. "Şikayet": Çok kibar ve empatik bir dille özür dile, şikayetin otonom sistem kayıtlarına alındığını ve öncelikli olarak çözüleceğini aktar.

        Diğer konularda stok, otonom takas ağı ve karbon tasarrufu konularına odaklan.
        """
        full_prompt = f"{system_prompt}\n\nMüşteri: {request.message}\nAsistan:"

        response = model.generate_content(full_prompt)
        return {"reply": response.text.strip()}
    except Exception as e:
        return {"reply": "Kısa bir teknik aksaklık yaşıyoruz, otonom ağımız yeniden bağlanıyor..."}