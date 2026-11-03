import base64
import hashlib
import hmac
import json
import time
from enum import Enum
from typing import Dict, List, Optional
from fastapi import Depends, Header, HTTPException, status
from app.core.config import settings


class UserRole(str, Enum):
    COMERCIAL = "comercial"
    PROYECTOS = "proyectos"
    ADMIN = "admin"


VALID_ROLES = {r.value for r in UserRole}


# ---------------------------------------------------------------------------
# Users: configured through the AUTH_USERS env var, never stored in the repo.
# Format: "usuario:contraseña:rol;otro:clave:rol" (rol = comercial|proyectos|admin)
# ---------------------------------------------------------------------------
def load_users() -> Dict[str, Dict[str, str]]:
    users: Dict[str, Dict[str, str]] = {}
    for entry in (settings.AUTH_USERS or "").split(";"):
        entry = entry.strip()
        if not entry:
            continue
        credentials, _, role = entry.rpartition(":")
        username, _, password = credentials.partition(":")
        role = role.strip().lower()
        if not username or not password or role not in VALID_ROLES:
            continue
        users[username.strip().lower()] = {"password": password, "role": role}
    return users


def authenticate_user(username: str, password: str) -> Optional[Dict[str, str]]:
    user = load_users().get((username or "").strip().lower())
    # Compare digests so the check takes the same time for any input
    expected = user["password"] if user else ""
    ok = hmac.compare_digest(
        hashlib.sha256(password.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )
    if not user or not ok:
        return None
    return {"username": username.strip().lower(), "role": user["role"]}


# ---------------------------------------------------------------------------
# Tokens: base64url(payload).base64url(HMAC-SHA256(payload, SECRET_KEY))
# ---------------------------------------------------------------------------
def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _sign(payload: str) -> str:
    return _b64encode(hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).digest())


def create_access_token(username: str, role: str) -> str:
    exp = int(time.time()) + settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600
    payload = _b64encode(json.dumps({"sub": username, "role": role, "exp": exp}).encode())
    return f"{payload}.{_sign(payload)}"


def decode_access_token(token: str) -> Optional[Dict]:
    try:
        payload, signature = token.split(".", 1)
        if not hmac.compare_digest(signature, _sign(payload)):
            return None
        data = json.loads(_b64decode(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if data.get("exp", 0) < time.time() or data.get("role") not in VALID_ROLES:
        return None
    # A user removed from AUTH_USERS loses access even with a live token
    if data.get("sub") not in load_users():
        return None
    return data


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, str]:
    """Requires a valid 'Authorization: Bearer <token>' header."""
    scheme, _, token = (authorization or "").partition(" ")
    data = decode_access_token(token.strip()) if scheme.lower() == "bearer" else None
    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión no válida o expirada. Inicie sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"username": data["sub"], "role": data["role"]}


def get_current_role(
    user: Dict[str, str] = Depends(get_current_user),
    x_user_role: Optional[str] = Header(default=None, alias="X-User-Role"),
) -> str:
    """
    The role comes from the authenticated user. Only admins may act as another
    role through the X-User-Role header (used by the navbar role switcher).
    """
    if user["role"] == UserRole.ADMIN.value and x_user_role:
        requested = x_user_role.strip().lower()
        if requested in VALID_ROLES:
            return requested
    return user["role"]


def require_role(allowed_roles: List[str]):
    """
    Factory dependency enforcing RBAC against the authenticated user's role.
    Returns HTTP 403 Forbidden if the user's role is not authorized.
    """
    def role_checker(current_role: str = Depends(get_current_role)) -> str:
        normalized_allowed = [r.lower() for r in allowed_roles]

        if current_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: El rol '{current_role}' no tiene permisos para realizar esta operación. Roles requeridos: {allowed_roles}"
            )
        return current_role

    return role_checker


# Convenience role dependencies
require_proyectos = require_role([UserRole.PROYECTOS.value, UserRole.ADMIN.value])
require_comercial_or_proyectos = require_role([
    UserRole.COMERCIAL.value,
    UserRole.PROYECTOS.value,
    UserRole.ADMIN.value
])
