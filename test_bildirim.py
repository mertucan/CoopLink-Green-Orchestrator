import sys
import os
import asyncio
from dotenv import load_dotenv

# Dosyaları bulabilmesi için ana dizini yola ekliyoruz
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app.services.notification_service import send_push_notification

# .env dosyasındaki değişkenleri okuması için load_dotenv'i çağırıyoruz
load_dotenv()

# ID'yi kodun içine DEĞİL, güvenli olan .env dosyasından çekiyoruz
TEST_CHAT_ID = os.getenv("TELEGRAM_ADMIN_ID")

mesaj = """
🔔 **TEST BİLDİRİMİ!**

Bu mesaj CoopLink Yeşil Orkestra sisteminin bildirim altyapısını test etmek için gönderilmiştir.
Eğer bu mesajı okuyorsan, sistem kusursuz çalışıyor demektir! 🚀
"""

if TEST_CHAT_ID:
    print(f"🚀 Füze ateşleniyor... Hedef ID: {TEST_CHAT_ID}")
    asyncio.run(send_push_notification(TEST_CHAT_ID, mesaj))
else:
    print("⚠️ HATA: .env dosyasında TELEGRAM_ADMIN_ID bulunamadı!")
    print("Lütfen .env dosyanıza TELEGRAM_ADMIN_ID=123456789 formatında kendi ID'nizi ekleyin.")