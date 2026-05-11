import os
import re
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    ApplicationBuilder,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from app.agents.orchestrator import Orchestrator
from app.agents.stock_agent import calculate_risk
from app.api.swaps import propose_swap, update_swap
from app.models.swap import SwapStatus, SwapUpdate
from app.services.ai_service import get_coop_analysis
from app.services.supabase_client import get_supabase_client

load_dotenv()

ADD_STOCK_MODE = "add_stock"


def welcome_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Başla", callback_data="menu:start")]])


def main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("Stokları Göster", callback_data="menu:stock"),
                InlineKeyboardButton("Riskli Stoklar", callback_data="menu:risky"),
            ],
            [
                InlineKeyboardButton("Bekleyen Takaslar", callback_data="menu:swaps"),
                InlineKeyboardButton("AI Analiz", callback_data="menu:analysis"),
            ],
            [
                InlineKeyboardButton("Stok Ekle", callback_data="menu:add_stock"),
                InlineKeyboardButton("Müşteri Özeti", callback_data="menu:customer_summary"),
            ],
            [InlineKeyboardButton("Yardım", callback_data="menu:help")],
        ]
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _ensure_allowed(update):
        return

    user_name = update.effective_user.first_name or "operatör"
    text = (
        f"Merhaba {user_name}, CoopLink CooBot'a hoş geldin.\n\n"
        "Riskli stokları takip edebilir, takas önerileri oluşturabilir, bekleyen işlemleri "
        "onaylayabilir ve müşteri için kısa stok bilgilendirmesi hazırlayabilirsin."
    )
    await _reply(update, text, welcome_keyboard())
    _log_telegram_event(update, "start", text, "telegram_start", {"action": "start"})


async def stok_listele(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _ensure_allowed(update):
        return

    text, keyboard = _build_stock_message(risky_only=False)
    await _reply(update, text, keyboard)
    _log_telegram_event(update, "/stok", text, "telegram_stock", {"action": "stock_list"})


async def analiz_yap(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _ensure_allowed(update):
        return

    await _send_analysis(update)


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _ensure_allowed(update):
        return

    query = update.callback_query
    await query.answer()
    data = query.data or ""

    if data == "menu:start":
        text = "Operasyon menüsü hazır. Bir işlem seçebilirsin."
        await query.edit_message_text(text, reply_markup=main_keyboard())
        _log_telegram_event(update, "Başla", text, "telegram_button", {"action": "open_main_menu"})
        return

    if data == "menu:stock":
        text, keyboard = _build_stock_message(risky_only=False)
        await query.edit_message_text(text, reply_markup=keyboard)
        _log_telegram_event(update, "Stokları Göster", text, "telegram_button", {"action": "stock_list"})
        return

    if data == "menu:risky":
        text, keyboard = _build_stock_message(risky_only=True)
        await query.edit_message_text(text, reply_markup=keyboard)
        _log_telegram_event(update, "Riskli Stoklar", text, "telegram_button", {"action": "risky_stock_list"})
        return

    if data == "menu:swaps":
        text, keyboard = _build_pending_swaps_message()
        await query.edit_message_text(text, reply_markup=keyboard)
        _log_telegram_event(update, "Bekleyen Takaslar", text, "telegram_button", {"action": "pending_swaps"})
        return

    if data == "menu:analysis":
        await _send_analysis(update)
        return

    if data == "menu:customer_summary":
        text = _build_customer_summary()
        await query.edit_message_text(text, reply_markup=main_keyboard())
        _log_telegram_event(
            update,
            "Müşteri Özeti",
            text,
            "telegram_customer_summary",
            {"action": "customer_summary"},
        )
        return

    if data == "menu:add_stock":
        context.user_data["mode"] = ADD_STOCK_MODE
        text = (
            "Stok eklemek için şu formatta yaz:\n\n"
            "ürün miktar gün\n\n"
            "Örnek: domates 80 2\n"
            "Bu, varsayılan kooperatife 80 kg domates ve 2 gün son kullanma süresiyle stok ekler."
        )
        await query.edit_message_text(
            text,
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("İptal", callback_data="menu:cancel")]]),
        )
        _log_telegram_event(update, "Stok Ekle", text, "telegram_button", {"action": "add_stock_prompt"})
        return

    if data == "menu:help":
        await query.edit_message_text(_help_text(), reply_markup=main_keyboard())
        _log_telegram_event(update, "Yardım", "Telegram yardım menüsü açıldı.", "telegram_button", {"action": "help"})
        return

    if data == "menu:cancel":
        context.user_data.pop("mode", None)
        await query.edit_message_text("İşlem iptal edildi.", reply_markup=main_keyboard())
        _log_telegram_event(update, "İptal", "İşlem iptal edildi.", "telegram_button", {"action": "cancel"})
        return

    if data.startswith("propose:"):
        inventory_id = data.split(":", 1)[1]
        try:
            result = await propose_swap({"inventory_id": inventory_id})
            item = result.get("item", {})
            text = (
                "Takas önerisi hazır.\n"
                f"{item.get('quantity_kg', 0)} kg {item.get('product_name', 'ürün')}\n"
                f"{item.get('from_cooperative_name', 'Kooperatif')} -> "
                f"{item.get('to_cooperative_name', 'Kooperatif')}\n"
                f"Skor: {float(item.get('match_score', 0)):.2f}"
            )
            await query.edit_message_text(text, reply_markup=_swap_action_keyboard(item.get("id")))
            _log_telegram_event(
                update,
                f"propose:{inventory_id}",
                text,
                "telegram_propose_swap",
                {"inventory_id": inventory_id, "swap_id": item.get("id")},
            )
        except Exception as exc:
            text = f"Takas önerisi oluşturulamadı: {exc}"
            await query.edit_message_text(text, reply_markup=main_keyboard())
            _log_telegram_event(update, f"propose:{inventory_id}", text, "telegram_propose_swap", {"error": str(exc)})
        return

    if data.startswith("approve:") or data.startswith("reject:"):
        action, swap_id = data.split(":", 1)
        status = SwapStatus.approved if action == "approve" else SwapStatus.rejected
        try:
            result = await update_swap(swap_id, SwapUpdate(status=status))
            text = result.get("message", f"Takas {status.value} durumuna alındı.")
        except Exception as exc:
            text = f"Takas güncellenemedi: {exc}"
        await query.edit_message_text(text, reply_markup=main_keyboard())
        _log_telegram_event(update, data, text, "telegram_update_swap", {"swap_id": swap_id, "status": status.value})
        return

    await query.edit_message_text("Bu işlem tanınmadı.", reply_markup=main_keyboard())


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await _ensure_allowed(update):
        return

    message = update.message.text.strip()

    if context.user_data.get("mode") == ADD_STOCK_MODE:
        context.user_data.pop("mode", None)
        text = _create_stock_from_text(message)
        await update.message.reply_text(text, reply_markup=main_keyboard())
        _log_telegram_event(update, message, text, "telegram_add_inventory", {"action": "add_stock"})
        return

    orchestrator = Orchestrator()
    response = await orchestrator.handle_message(f"telegram:{update.effective_chat.id}", message)
    await update.message.reply_text(response, reply_markup=main_keyboard())


async def _send_analysis(update: Update):
    status_msg = await _reply(update, "AI analizi hazırlanıyor...")
    try:
        supabase = get_supabase_client()
        response = supabase.table("inventory").select("quantity_kg, risk_score, products(name), cooperatives(name)").execute()
        inventory_text = ""
        for item in response.data or []:
            c_name = item.get("cooperatives", {}).get("name", "")
            p_name = item.get("products", {}).get("name", "")
            qty = item.get("quantity_kg", 0)
            risk = item.get("risk_score", 0)
            inventory_text += f"- {c_name}: {qty}kg {p_name} (Risk Skoru: {risk})\n"

        result = get_coop_analysis(inventory_text)
        await status_msg.edit_text(result, reply_markup=main_keyboard())
        _log_telegram_event(update, "AI Analiz", result, "telegram_analysis", {"action": "analysis"})
    except Exception as exc:
        text = f"Analiz yapılamadı: {exc}"
        await status_msg.edit_text(text, reply_markup=main_keyboard())
        _log_telegram_event(update, "AI Analiz", text, "telegram_analysis", {"error": str(exc)})


def _build_stock_message(risky_only: bool) -> tuple[str, InlineKeyboardMarkup]:
    rows = _enriched_inventory()
    if risky_only:
        rows = [row for row in rows if float(row.get("risk_score", 0)) >= 0.7]
    rows = sorted(rows, key=lambda row: float(row.get("risk_score", 0)), reverse=True)[:8]

    if not rows:
        return "Listelenecek stok bulunamadı.", main_keyboard()

    title = "Riskli Stoklar" if risky_only else "Güncel Stoklar"
    lines = [title]
    buttons = []
    for row in rows:
        risk = float(row.get("risk_score", 0))
        status = "Süresi geçti" if row.get("is_expired") else "Takas bekliyor" if row.get("has_pending_swap") else f"Risk {risk:.2f}"
        lines.append(f"- {row.get('cooperative_name')}: {row.get('quantity_kg')} kg {row.get('product_name')} ({status})")
        if risk >= 0.7 and not row.get("is_expired") and not row.get("has_pending_swap"):
            buttons.append([InlineKeyboardButton(f"Takas öner: {row.get('product_name')}", callback_data=f"propose:{row.get('id')}")])
    buttons.append([InlineKeyboardButton("Menü", callback_data="menu:help")])
    return "\n".join(lines), InlineKeyboardMarkup(buttons)


def _build_pending_swaps_message() -> tuple[str, InlineKeyboardMarkup]:
    supabase = get_supabase_client()
    swaps = supabase.table("swaps").select("*").eq("status", "pending").execute().data or []
    enriched = _enrich_swaps(swaps)
    if not enriched:
        return "Bekleyen takas bulunmuyor.", main_keyboard()

    lines = ["Bekleyen Takaslar"]
    buttons = []
    for swap in enriched[:8]:
        lines.append(
            f"- {swap.get('quantity_kg')} kg {swap.get('product_name')} | "
            f"{swap.get('from_cooperative_name')} -> {swap.get('to_cooperative_name')} | "
            f"Skor {float(swap.get('match_score', 0)):.2f}"
        )
        buttons.append(
            [
                InlineKeyboardButton("Onayla", callback_data=f"approve:{swap.get('id')}"),
                InlineKeyboardButton("Reddet", callback_data=f"reject:{swap.get('id')}"),
            ]
        )
    buttons.append([InlineKeyboardButton("Menü", callback_data="menu:help")])
    return "\n".join(lines), InlineKeyboardMarkup(buttons)


def _build_customer_summary() -> str:
    rows = _enriched_inventory()
    available_rows = [
        row
        for row in rows
        if not row.get("is_expired") and not row.get("has_pending_swap") and float(row.get("quantity_kg", 0)) > 0
    ]
    available_rows = sorted(available_rows, key=lambda row: float(row.get("risk_score", 0)))[:6]
    if not available_rows:
        return "Müşteriye iletilebilecek uygun stok bulunmuyor."

    lines = ["Müşteri bilgilendirme özeti"]
    for row in available_rows:
        lines.append(f"- {row.get('product_name')}: {row.get('quantity_kg')} kg | {row.get('cooperative_name')}")
    lines.append("\nRiskli veya son kullanımı geçmiş ürünler bu özete eklenmedi.")
    return "\n".join(lines)


def _create_stock_from_text(text: str) -> str:
    match = re.search(r"([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s+(\d+(?:[.,]\d+)?)\s+(\d+)", text)
    if not match:
        return "Format anlaşılamadı. Örnek: domates 80 2"

    product_text = match.group(1).lower()
    quantity = float(match.group(2).replace(",", "."))
    days = int(match.group(3))
    supabase = get_supabase_client()
    products = supabase.table("products").select("*").execute().data or []
    product = next((row for row in products if product_text in str(row.get("name", "")).lower()), None)
    if not product:
        return f"Ürün bulunamadı: {product_text}"

    cooperative_id = os.getenv("TELEGRAM_DEFAULT_COOPERATIVE_ID")
    if not cooperative_id:
        cooperatives = supabase.table("cooperatives").select("*").limit(1).execute().data or []
        cooperative_id = cooperatives[0]["id"] if cooperatives else None
    if not cooperative_id:
        return "Stok eklemek için kooperatif bulunamadı."

    expires_at = datetime.now(timezone.utc) + timedelta(days=days)
    risk = calculate_risk(quantity, expires_at, int(product.get("spoilage_rate_days", 7)))
    payload = {
        "cooperative_id": cooperative_id,
        "product_id": product["id"],
        "quantity_kg": quantity,
        "expires_at": expires_at.isoformat(),
        "risk_score": risk,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("inventory").insert(payload).execute()
    return f"Stok eklendi: {quantity:g} kg {product.get('name')} | Son kullanma: {days} gün | Risk: {risk:.2f}"


def _enriched_inventory() -> list[dict]:
    supabase = get_supabase_client()
    inventory = supabase.table("inventory").select("*").execute().data or []
    products = supabase.table("products").select("*").execute().data or []
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    pending_swaps = supabase.table("swaps").select("*").eq("status", "pending").execute().data or []
    product_map = {row["id"]: row for row in products}
    cooperative_map = {row["id"]: row for row in cooperatives}
    pending_map = {(row.get("from_cooperative_id"), row.get("product_id")): row for row in pending_swaps}
    now = datetime.now(timezone.utc)
    rows = []
    for item in inventory:
        product = product_map.get(item.get("product_id"), {})
        coop = cooperative_map.get(item.get("cooperative_id"), {})
        expires_at = datetime.fromisoformat(str(item.get("expires_at")).replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        rows.append(
            {
                **item,
                "product_name": product.get("name", item.get("product_id")),
                "cooperative_name": coop.get("name", item.get("cooperative_id")),
                "is_expired": expires_at <= now,
                "has_pending_swap": pending_map.get((item.get("cooperative_id"), item.get("product_id"))) is not None,
            }
        )
    return rows


def _enrich_swaps(swaps: list[dict]) -> list[dict]:
    supabase = get_supabase_client()
    products = supabase.table("products").select("*").execute().data or []
    cooperatives = supabase.table("cooperatives").select("*").execute().data or []
    product_map = {row["id"]: row for row in products}
    cooperative_map = {row["id"]: row for row in cooperatives}
    return [
        {
            **swap,
            "product_name": product_map.get(swap.get("product_id"), {}).get("name", swap.get("product_id")),
            "from_cooperative_name": cooperative_map.get(swap.get("from_cooperative_id"), {}).get("name", swap.get("from_cooperative_id")),
            "to_cooperative_name": cooperative_map.get(swap.get("to_cooperative_id"), {}).get("name", swap.get("to_cooperative_id")),
        }
        for swap in swaps
    ]


def _swap_action_keyboard(swap_id: str | None) -> InlineKeyboardMarkup:
    if not swap_id:
        return main_keyboard()
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("Onayla", callback_data=f"approve:{swap_id}"),
                InlineKeyboardButton("Reddet", callback_data=f"reject:{swap_id}"),
            ],
            [InlineKeyboardButton("Menü", callback_data="menu:help")],
        ]
    )


def _log_telegram_event(update: Update, message: str, response: str, selected_tool: str, metadata: dict | None = None):
    try:
        supabase = get_supabase_client()
        supabase.table("ai_logs").insert(
            {
                "channel_id": f"telegram:{update.effective_chat.id}",
                "user_message": message,
                "detected_intent": selected_tool,
                "selected_tool": selected_tool,
                "model_name": "telegram-action",
                "used_gemini": False,
                "fallback_used": False,
                "prompt": "Telegram button/message action",
                "gemini_response": None,
                "final_response": response,
                "metadata": {
                    "telegram_user_id": update.effective_user.id if update.effective_user else None,
                    "telegram_username": update.effective_user.username if update.effective_user else None,
                    **(metadata or {}),
                },
            }
        ).execute()
    except Exception as exc:
        print(f"AI log yazılamadı: {exc}")


async def _reply(update: Update, text: str, keyboard: InlineKeyboardMarkup | None = None):
    if update.message:
        return await update.message.reply_text(text, reply_markup=keyboard)
    return await update.callback_query.message.reply_text(text, reply_markup=keyboard)


async def _ensure_allowed(update: Update) -> bool:
    allowed_ids = [item.strip() for item in os.getenv("TELEGRAM_ADMIN_ID", "").split(",") if item.strip()]
    if not allowed_ids:
        return True

    user_id = str(update.effective_user.id) if update.effective_user else ""
    if user_id in allowed_ids:
        return True

    await _reply(update, "Bu bot için yetkin bulunmuyor.")
    return False


def _help_text() -> str:
    return (
        "CooBot hızlı işlemler:\n\n"
        "- Stokları göster: canlı stok listesi\n"
        "- Riskli stoklar: acil ürünler ve takas önerisi\n"
        "- Bekleyen takaslar: onay/red\n"
        "- Stok ekle: örnek format domates 80 2\n"
        "- Müşteri özeti: paylaşılabilir uygun stok bilgisi\n"
        "- Serbest mesaj: stok sorgusu, takas veya teslimat sorusu"
    )


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("HATA: TELEGRAM_BOT_TOKEN bulunamadı.")
        return

    app = ApplicationBuilder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("menu", start))
    app.add_handler(CommandHandler("stok", stok_listele))
    app.add_handler(CommandHandler("analiz", analiz_yap))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))

    print("CooBot aktif ve dinlemede. Terminali kapatma.")
    app.run_polling()


if __name__ == "__main__":
    main()
