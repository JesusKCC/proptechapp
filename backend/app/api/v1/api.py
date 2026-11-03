from fastapi import APIRouter, Depends
from app.api.v1.auth import router as auth_router
from app.api.v1.centros_comerciales import router as centros_router
from app.api.v1.locales import router as locales_router
from app.api.v1.planos import router as planos_router
from app.api.v1.poligonos import router as poligonos_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.webhooks import router as webhooks_router
from app.core.security import get_current_user

api_router = APIRouter()

# Login is the only public endpoint; everything else requires a valid session token.
protected = [Depends(get_current_user)]

api_router.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(centros_router, prefix="/centros-comerciales", tags=["Centros Comerciales"], dependencies=protected)
api_router.include_router(locales_router, prefix="/locales", tags=["Locales Comerciales"], dependencies=protected)
api_router.include_router(planos_router, prefix="/planos", tags=["Planos Arquitectónicos"], dependencies=protected)
api_router.include_router(poligonos_router, prefix="/poligonos", tags=["Polígonos de Planos"], dependencies=protected)
api_router.include_router(tickets_router, prefix="/tickets", tags=["Tickets y Requerimientos"], dependencies=protected)
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks CRM / Outbox"], dependencies=protected)
