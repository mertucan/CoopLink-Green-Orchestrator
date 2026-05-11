from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.services.auth_service import (
    create_token,
    get_current_user,
    hash_password,
    normalize_turkey_phone,
    public_user,
    verify_password,
)
from app.services.geocoding_service import get_region_coordinates
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    contact_phone: str
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    region: str = Field(min_length=2)
    contact_phone: str
    password: str = Field(min_length=6)


@router.post("/login")
async def login(payload: LoginRequest):
    supabase = get_supabase_client()
    contact_phone = normalize_turkey_phone(payload.contact_phone)
    rows = (
        supabase.table("cooperatives")
        .select("*")
        .eq("contact_phone", contact_phone)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows or not verify_password(payload.password, rows[0].get("password_hash")):
        raise HTTPException(status_code=401, detail="Telefon veya şifre hatalı.")
    user = public_user(rows[0])
    return {"token": create_token(user), "user": user}


@router.post("/register", status_code=201)
async def register(payload: RegisterRequest):
    supabase = get_supabase_client()
    contact_phone = normalize_turkey_phone(payload.contact_phone)
    existing = (
        supabase.table("cooperatives")
        .select("id")
        .eq("contact_phone", contact_phone)
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing:
        raise HTTPException(status_code=409, detail="Bu telefon numarası ile kayıtlı bir kooperatif var.")

    latitude, longitude = get_region_coordinates(payload.region)
    row = {
        "name": payload.name.strip(),
        "region": payload.region.strip(),
        "contact_phone": contact_phone,
        "green_score": 0,
        "latitude": latitude,
        "longitude": longitude,
        "password_hash": hash_password(payload.password),
        "role": "cooperative",
    }
    created = supabase.table("cooperatives").insert(row).execute().data or []
    if not created:
        raise HTTPException(status_code=500, detail="Kayıt oluşturulamadı.")
    user = public_user(created[0])
    return {"token": create_token(user), "user": user}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}
