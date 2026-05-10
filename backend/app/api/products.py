from fastapi import APIRouter

from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products():
    supabase = get_supabase_client()
    rows = supabase.table("products").select("*").order("name").execute().data or []
    return {"items": rows}

