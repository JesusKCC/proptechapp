from fastapi import APIRouter
from app.api.v1.centros_comerciales import router as centros_router
from app.api.v1.locales import router as locales_router
from app.api.v1.planos import router as planos_router
from app.api.v1.poligonos import router as poligonos_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.webhooks import router as webhooks_router

api_router = APIRouter()

api_router.include_router(centros_router, prefix="/centros-comerciales", tags=["Centros Comerciales"])
api_router.include_router(locales_router, prefix="/locales", tags=["Locales Comerciales"])
api_router.include_router(planos_router, prefix="/planos", tags=["Planos Arquitectónicos"])
api_router.include_router(poligonos_router, prefix="/poligonos", tags=["Polígonos de Planos"])
api_router.include_router(tickets_router, prefix="/tickets", tags=["Tickets y Requerimientos"])
api_router.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks CRM / Outbox"])
