import os
import sys
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv

# Proje kök dizinini Python yoluna ekle
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

# Servisleri içeri alıyoruz
try:
    from app.services.supabase_client import get_supabase_client
except ImportError:
    get_supabase_client = None

try:
    from app.services.ai_service import get_coop_analysis
except ImportError:
    get_coop_analysis = None

load_dotenv()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    welcome_text = (
        f"Merhaba {user_name}! Ben *CooBot* 🤖\n\n"
        "👉 /stok - Canlı kooperatif envanterini listelerim.\n"
        "👉 /analiz - Gemini AI ile riskli ürünleri bulur, yeşil takas rotaları çizerim."
    )
    await update.message.reply_text(welcome_text, parse_mode="Markdown")

async def stok_listele(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not get_supabase_client:
        await update.message.reply_text("⚠️ Veritabanı bağlantısı yok.")
        return

    status_msg = await update.message.reply_text("🔄 Envanter taranıyor...")
    try:
        supabase = get_supabase_client()
        response = supabase.table("inventory").select("quantity_kg, risk_score, products(name), cooperatives(name)").execute()
        stoklar = response.data

        if not stoklar:
            await context.bot.edit_message_text(chat_id=update.effective_chat.id, message_id=status_msg.message_id, text="📭 Aktif stok bulunmuyor.")
            return

        rapor = "📦 *Güncel Kooperatif Envanteri*\n--------------------------------------\n"
        for kalem in stoklar:
            p_name = kalem.get('products', {}).get('name', 'Ürün')
            c_name = kalem.get('cooperatives', {}).get('name', 'Koop')
            qty = kalem.get('quantity_kg', 0)
            risk = kalem.get('risk_score', 0)
            icon = "🔴" if risk >= 0.8 else "🟡" if risk >= 0.4 else "🟢"
            rapor += f"{icon} *{c_name}*: {qty}kg {p_name}\n"

        await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=status_msg.message_id)
        await update.message.reply_text(rapor, parse_mode="Markdown")
    except Exception as e:
        print(f"Supabase Hatası: {e}")
        await update.message.reply_text("❌ Veri çekilemedi.")

async def analiz_yap(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not get_supabase_client or not get_coop_analysis:
        await update.message.reply_text("⚠️ Gerekli servisler yüklenemedi.")
        return

    status_msg = await update.message.reply_text("🧠 Gemini beyni devreye giriyor, veriler analiz ediliyor...")
    try:
        supabase = get_supabase_client()
        response = supabase.table("inventory").select("quantity_kg, risk_score, products(name), cooperatives(name)").execute()
        
        # Envanteri metne dönüştür
        inventory_text = ""
        for item in response.data:
            c_name = item.get('cooperatives', {}).get('name', '')
            p_name = item.get('products', {}).get('name', '')
            qty = item.get('quantity_kg', 0)
            risk = item.get('risk_score', 0)
            inventory_text += f"- {c_name}: {qty}kg {p_name} (Risk Skoru: {risk})\n"

        # Gemini'ye gönder
        analiz_sonucu = get_coop_analysis(inventory_text)
        
        await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=status_msg.message_id)
        await update.message.reply_text(analiz_sonucu)
    except Exception as e:
        print(f"Analiz Hatası: {e}")
        await update.message.reply_text("❌ Analiz yapılamadı.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Mesajını aldım! Analiz için lütfen /analiz komutunu kullan. 🧠✨")

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("❌ HATA: TELEGRAM_BOT_TOKEN bulunamadı!")
        return

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("stok", stok_listele))
    app.add_handler(CommandHandler("analiz", analiz_yap))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))

    print("🚀 CooBot aktif ve dinlemede! Terminali kapatma.")
    app.run_polling()

if __name__ == "__main__":
    main()
