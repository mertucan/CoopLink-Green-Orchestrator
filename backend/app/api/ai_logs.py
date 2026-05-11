from fastapi import APIRouter, Depends, Query

from app.services.auth_service import require_admin
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/ai-logs", tags=["ai-logs"])


@router.get("")
async def list_ai_logs(limit: int = Query(default=25, ge=1, le=100), user: dict = Depends(require_admin)):
    supabase = get_supabase_client()
    rows = supabase.table("ai_logs").select("*").order("created_at", desc=True).limit(limit).execute().data or []
    return {"items": rows}
