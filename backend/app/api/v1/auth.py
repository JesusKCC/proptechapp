import asyncio
from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token, get_current_user

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    expires_in: int


class UserResponse(BaseModel):
    username: str
    role: str


@router.post("/login", response_model=LoginResponse, summary="Iniciar sesión con usuario y contraseña")
async def login(body: LoginRequest):
    user = authenticate_user(body.username, body.password)
    if not user:
        # Slow down password guessing
        await asyncio.sleep(1)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
        )
    return LoginResponse(
        access_token=create_access_token(user["username"], user["role"]),
        username=user["username"],
        role=user["role"],
        expires_in=settings.ACCESS_TOKEN_EXPIRE_HOURS * 3600,
    )


@router.get("/me", response_model=UserResponse, summary="Usuario de la sesión actual")
async def me(user: Dict[str, str] = Depends(get_current_user)):
    return UserResponse(**user)
