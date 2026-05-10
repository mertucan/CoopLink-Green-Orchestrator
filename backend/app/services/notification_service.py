import os
import asyncio
from telegram import Bot
from dotenv import load_dotenv

load_dotenv()

async def send_push_notification(chat_id: str, message: str):
    """
    Sistemde yeni bir gelişme olduğunda kullanıcıya anında bildirim atar.
    FastAPI endpoint'leri içinden çağrılmak üzere tasarlanmıştır.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("HATA: Token bulunamadı!")
        return

    # Sadece mesaj göndermek için hafif bir Bot objesi yaratıyoruz
    bot = Bot(token=token)
    
    try:
        await bot.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
        print(f"✅ Bildirim başarıyla gönderildi: {chat_id}")
    except Exception as e:
        print(f"❌ Bildirim gönderilemedi. Hata: {e}")