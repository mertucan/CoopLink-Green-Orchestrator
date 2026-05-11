from fastapi import APIRouter

from app.services.auth_service import public_user
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/cooperatives", tags=["cooperatives"])


@router.get("")
async def list_cooperatives():
    supabase = get_supabase_client()
    rows = supabase.table("cooperatives").select("*").eq("role", "cooperative").order("name").execute().data or []
    return {"items": [public_user(row) for row in rows]}
