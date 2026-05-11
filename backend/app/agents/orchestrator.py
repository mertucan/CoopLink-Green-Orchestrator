import asyncio
import os
import re
from dotenv import load_dotenv

from app.agents.logistics_agent import LogisticsAgent
from app.agents.stock_agent import StockAgent
from app.agents.swap_agent import SwapAgent
from app.services.supabase_client import get_supabase_client

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

SYSTEM_PROMPT = (
    "Sen CoopLink - Green Orchestrator asistanısın. Tarım ve gıda kooperatifleri ağını yönetir, "
    "stok, takas ve teslimat sorularına kısa ve Türkçe yanıt verirsin."
)

TOOLS = [
    {"name": "query_stock", "description": "Ağdaki stok durumunu sorgula", "parameters": {"product_name": "string"}},
    {"name": "propose_swap", "description": "İsraf riski olan ürün için takas öner", "parameters": {"product_name": "string", "quantity_kg": "number"}},
    {"name": "track_delivery", "description": "Teslimat durumunu sorgula", "parameters": {"delivery_id": "string"}},
]

PRODUCT_WORDS = [
    "domates", "biber", "elma", "armut", "süt", "yoğurt", "peynir", "buğday", "mısır", "fındık",
    "zeytin", "üzüm", "portakal", "limon", "patates", "soğan", "sarımsak", "bal", "yumurta", "zeytinyağı",
]


def detect_intent(message: str) -> str:
    text = message.lower()
    delivery_words = ["nerede", "teslimat", "sipariş", "rota", "kargo"]
    waste_words = ["elimde", "kaldı", "bozul", "fazla", "acil", "satılmadı", "takas"]
    query_words = ["var mı", "stok", "bulabilir", "lazım", "ihtiyaç", "arıyorum", "sanırım"]
    if any(word in text for word in delivery_words):
        return "track_delivery"
    explicit_waste = any(word in text for word in ["bozul", "fazla", "acil", "satılmadı", "takas"])
    quantity_report = "elimde" in text and re.search(r"\d+", text)
    if any(word in text for word in waste_words) and (explicit_waste or quantity_report):
        return "propose_swap"
    if any(word in text for word in query_words) or any(product in text for product in PRODUCT_WORDS):
        return "query_stock"
    return "query_stock"


def extract_product(message: str) -> str:
    text = message.lower()
    return next((product for product in PRODUCT_WORDS if product in text), "ürün")


def extract_quantity(message: str) -> float:
    match = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|kilo|lt|litre)?", message.lower())
    if not match:
        return 10.0
    return float(match.group(1).replace(",", "."))


class Orchestrator:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.stock_agent = StockAgent()
        self.swap_agent = SwapAgent()
        self.logistics_agent = LogisticsAgent()

    async def handle_message(self, channel_id: str, message: str) -> str:
        fallback_intent = detect_intent(message)
        intent = fallback_intent
        used_gemini = False
        fallback_used = True
        gemini_response = None
        model_name = "local-intent-fallback"
        prompt = "Mesaj için intent seç: query_stock, propose_swap, track_delivery. Sadece intent yaz."
        try:
            if os.getenv("GEMINI_API_KEY") and not os.getenv("GEMINI_API_KEY", "").startswith("your-"):
                gemini_result = await self._gemini_intent_with_backoff(message, intent)
                intent = gemini_result["intent"]
                used_gemini = gemini_result["used_gemini"]
                fallback_used = gemini_result["fallback_used"]
                gemini_response = gemini_result["raw_response"]
                model_name = GEMINI_MODEL if used_gemini else "local-intent-fallback"

            if intent == "propose_swap":
                result = await self.swap_agent.propose_swap(extract_product(message), extract_quantity(message))
            elif intent == "track_delivery":
                result = await self.logistics_agent.track_delivery()
            else:
                result = await self.stock_agent.query_stock(extract_product(message))

            response = result.get("message") or result.get("error") or "İşlemi tamamladım."
            self._persist_context(channel_id, message, response, intent)
            self._log_ai_decision(
                channel_id=channel_id,
                message=message,
                intent=intent,
                prompt=prompt,
                gemini_response=gemini_response,
                response=response,
                used_gemini=used_gemini,
                fallback_used=fallback_used,
                model_name=model_name,
            )
            return response
        except Exception as exc:
            response = "Üzgünüm, şu an işlem yapamıyorum. Lütfen tekrar deneyin."
            self._log_ai_decision(
                channel_id=channel_id,
                message=message,
                intent=intent,
                prompt=prompt,
                gemini_response=gemini_response,
                response=response,
                used_gemini=used_gemini,
                fallback_used=True,
                model_name=model_name,
                metadata={"error": str(exc), "fallback_intent": fallback_intent},
            )
            return response

    async def _gemini_intent_with_backoff(self, message: str, fallback: str) -> dict:
        for delay in (1, 2, 4):
            try:
                import google.generativeai as genai

                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=SYSTEM_PROMPT)
                prompt = f"Mesaj için intent seç: query_stock, propose_swap, track_delivery. Sadece intent yaz.\nMesaj: {message}"
                response = await asyncio.to_thread(model.generate_content, prompt)
                candidate = response.text.strip()
                if candidate in {"query_stock", "propose_swap", "track_delivery"}:
                    return {"intent": candidate, "used_gemini": True, "fallback_used": False, "raw_response": candidate}
            except Exception:
                await asyncio.sleep(delay)
        return {"intent": fallback, "used_gemini": False, "fallback_used": True, "raw_response": None}

    def _persist_context(self, channel_id: str, message: str, response: str, intent: str) -> None:
        existing = self.supabase.table("sessions").select("*").eq("channel_id", channel_id).limit(1).execute().data
        previous_context = existing[0].get("context", []) if existing else []
        context = (
            previous_context
            + [{"role": "user", "content": message}, {"role": "assistant", "content": response}]
        )[-5:]
        payload = {"channel_id": channel_id, "context": context, "last_intent": intent}
        if existing:
            self.supabase.table("sessions").update(payload).eq("id", existing[0]["id"]).execute()
        else:
            self.supabase.table("sessions").insert(payload).execute()

    def _log_ai_decision(
        self,
        channel_id: str,
        message: str,
        intent: str,
        prompt: str,
        gemini_response: str | None,
        response: str,
        used_gemini: bool,
        fallback_used: bool,
        model_name: str,
        metadata: dict | None = None,
    ) -> None:
        payload = {
            "channel_id": channel_id,
            "user_message": message,
            "detected_intent": intent,
            "selected_tool": intent,
            "model_name": model_name,
            "used_gemini": used_gemini,
            "fallback_used": fallback_used,
            "prompt": prompt,
            "gemini_response": gemini_response,
            "final_response": response,
            "metadata": {
                "product": extract_product(message),
                "quantity_kg": extract_quantity(message),
                **(metadata or {}),
            },
        }
        self.supabase.table("ai_logs").insert(payload).execute()
