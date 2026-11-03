import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    await init_db()
    
    # Ensure blueprint directory exists
    os.makedirs(settings.BLUEPRINTS_DIR, exist_ok=True)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory for architectural blueprints
os.makedirs(settings.BLUEPRINTS_DIR, exist_ok=True)
app.mount("/static/blueprints", StaticFiles(directory=settings.BLUEPRINTS_DIR), name="blueprints")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "sqlite_postgis_dual_tier"
    }


@app.get("/", tags=["Root"])
def root_redirect():
    return {
        "message": "PropTech Commercial Asset Management API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }
