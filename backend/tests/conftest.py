import asyncio
import os
import sys
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Ensure backend root is on sys.path
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.db.base import Base
from app.core.security import get_current_user
from app.db.session import get_db
from app.main import app
from app.models.centro_comercial import CentroComercial
from app.models.plano_centro import PlanoCentro
from app.models.local import Local
from app.models.poligono import Poligono

# Test database: in-memory SQLite with StaticPool for async connection sharing
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a clean database session per test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def seeded_entities(db_session: AsyncSession):
    """Populates baseline entities: 1 Peru mall, 1 blueprint, 3 locales, 1 polygon."""
    mall = CentroComercial(
        id="mall-ves-001",
        nombre="Plaza Center Villa El Salvador",
        slug="plaza-center-villa-el-salvador",
        direccion="Av. Pachacútec con Av. El Sol, Villa El Salvador",
        departamento="Lima",
        provincia="Lima",
        distrito="Villa El Salvador",
        lat=-12.215,
        lon=-76.938,
        total_locales=26,
        superficie_total_m2=60000.0,
        imagen_url="https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800"
    )
    db_session.add(mall)

    # Secondary mall for geo collection testing
    mall_jockey = CentroComercial(
        id="mall-jockey-002",
        nombre="Jockey Plaza",
        slug="jockey-plaza",
        direccion="Av. Javier Prado Este 4200, Santiago de Surco",
        departamento="Lima",
        provincia="Lima",
        distrito="Santiago de Surco",
        lat=-12.0863,
        lon=-76.9763,
        total_locales=500,
        superficie_total_m2=170000.0
    )
    db_session.add(mall_jockey)

    plano = PlanoCentro(
        id="plano-ves-n1",
        centro_comercial_id=mall.id,
        nombre_piso="Nivel 1 - Galería Principal",
        archivo_pdf_url="/static/blueprints/pacita_ves_nivel1.pdf",
        ancho_unscaled_pt=2384.0,
        alto_unscaled_pt=1684.0
    )
    db_session.add(plano)

    local_1 = Local(
        id="loc-lce-103",
        centro_comercial_id=mall.id,
        plano_id=plano.id,
        codigo_local="LCE-103",
        nombre_comercial="COOLBOX",
        categoria="Tecnología",
        estado="arrendado",
        area_m2=29.70,
        precio_alquiler_mensual=1250.0,
        moneda="USD",
        piso_nivel="Nivel 1",
        descripcion="Local comercial Coolbox tecnología"
    )
    local_2 = Local(
        id="loc-lce-104",
        centro_comercial_id=mall.id,
        plano_id=plano.id,
        codigo_local="LCE-104",
        nombre_comercial="TINKA",
        categoria="Loterías",
        estado="disponible",
        area_m2=39.00,
        precio_alquiler_mensual=1500.0,
        moneda="USD",
        piso_nivel="Nivel 1",
        descripcion="Local comercial Tinka"
    )
    local_3 = Local(
        id="loc-lce-105",
        centro_comercial_id=mall.id,
        plano_id=plano.id,
        codigo_local="LCE-105",
        nombre_comercial="BITEL",
        categoria="Telecomunicaciones",
        estado="arrendado",
        area_m2=98.10,
        precio_alquiler_mensual=3200.0,
        moneda="USD",
        piso_nivel="Nivel 1",
        descripcion="Local comercial Bitel"
    )
    db_session.add_all([local_1, local_2, local_3])

    # 1 Test polygon with normalized relative coordinates in [0..1]
    polygon = Poligono(
        id="poly-lce-103",
        local_id=local_1.id,
        plano_id=plano.id,
        coordenadas_relativas=[
            {"x": 0.7383, "y": 0.4970},
            {"x": 0.7383, "y": 0.5258},
            {"x": 0.7659, "y": 0.5258},
            {"x": 0.7659, "y": 0.4970}
        ],
        color_relleno="#3b82f6",
        color_borde="#1d4ed8",
        opacidad=0.45,
        etiqueta="LCE-103"
    )
    db_session.add(polygon)
    await db_session.commit()

    return {
        "mall": mall,
        "mall_jockey": mall_jockey,
        "plano": plano,
        "locales": [local_1, local_2, local_3],
        "polygon": polygon
    }


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Async HTTP test client with overridden database dependency, signed in as an
    admin so each test picks its role with the X-User-Role header.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: {"username": "tester", "role": "admin"}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
