import sys
import os
import asyncio

# Dosyaları bulabilmesi için ana dizini yola ekliyoruz
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app.services.notification_service import send_push_notification

# Senin Telegram Kimliğin
TUBA_CHAT_ID = "8266316848"

mesaj = """
🔔 **SİSTEM UYARISI: YENİ İLAN!**

🌱 Ege Tarım Kooperatifi sisteme yeni bir ürün ekledi.
📦 **Ürün:** 50kg Domates
⚠️ **Durum:** Acil takas bekleniyor!

Hemen /analiz komutunu kullanarak yeşil rotaları hesaplayabilirsin.
"""

print(f"🚀 Füze ateşleniyor... Hedef ID: {TUBA_CHAT_ID}")
# Bildirimi gönderiyoruz
asyncio.run(send_push_notification(TUBA_CHAT_ID, mesaj))