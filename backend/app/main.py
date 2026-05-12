import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai_logs, assistant, auth, cooperatives, inventory, products, stats, swaps, chat
from app.services.supabase_client import test_connection

app = FastAPI(title="CoopLink - Green Orchestrator API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    test_connection()


@app.get("/health")
async def health():
    return {"status": "ok", "supabase": "connected"}


app.include_router(ai_logs.router)
app.include_router(assistant.router)
app.include_router(auth.router)
app.include_router(cooperatives.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(stats.router)
app.include_router(swaps.router)
app.include_router(chat.router, prefix="/api", tags=["Chat"])