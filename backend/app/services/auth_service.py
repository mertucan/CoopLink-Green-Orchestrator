import base64
import hashlib
import hmac
import json
import os
import time
from secrets import compare_digest
from typing import Any

from fastapi import Depends, Header, HTTPException

from app.services.supabase_client import get_supabase_client

PASSWORD_ITERATIONS = 120_000
TOKEN_TTL_SECONDS = 60 * 60 * 12


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        scheme, iterations, salt, expected = password_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64decode(salt),
            int(iterations),
        )
        return compare_digest(_b64encode(digest), expected)
    except (TypeError, ValueError):
        return False


def create_token(user: dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "role": user.get("role", "cooperative"),
        "name": user.get("name"),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def read_token(token: str) -> dict[str, Any] | None:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError:
        return None
    if not compare_digest(_sign(encoded_payload), signature):
        return None
    try:
        payload = json.loads(_b64decode(encoded_payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return payload


def public_user(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "region": row.get("region"),
        "contact_phone": row.get("contact_phone"),
        "role": row.get("role", "cooperative"),
        "green_score": row.get("green_score", 0),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
    }


def normalize_turkey_phone(value: str) -> str:
    digits = "".join(char for char in value if char.isdigit())
    if digits.startswith("90") and len(digits) == 12:
        local = digits[2:]
        if local.startswith("5"):
            return f"+{digits}"
    if digits.startswith("0") and len(digits) == 11:
        local = digits[1:]
        if local.startswith("5"):
            return f"+90{local}"
    if digits.startswith("5") and len(digits) == 10:
        return f"+90{digits}"
    raise HTTPException(status_code=422, detail="Lütfen geçerli bir Türkiye cep telefonu numarası girin.")


async def get_optional_user(authorization: str | None = Header(default=None)) -> dict[str, Any] | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    payload = read_token(token)
    if not payload:
        return None
    supabase = get_supabase_client()
    rows = supabase.table("cooperatives").select("*").eq("id", payload["sub"]).limit(1).execute().data or []
    if not rows:
        return None
    return public_user(rows[0])


async def get_current_user(user: dict[str, Any] | None = Depends(get_optional_user)) -> dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Giriş yapmanız gerekiyor.")
    return user


def require_admin(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için admin yetkisi gerekiyor.")
    return user


def _secret() -> bytes:
    return os.getenv("AUTH_SECRET", os.getenv("SUPABASE_KEY", "cooplink-dev-secret")).encode("utf-8")


def _sign(value: str) -> str:
    return _b64encode(hmac.new(_secret(), value.encode("utf-8"), hashlib.sha256).digest())


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
