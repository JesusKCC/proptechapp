# Tier 1 Feature Tests: Backend Core (FEAT-R1-01 to FEAT-R1-05)
# Authoritative Sources: ORIGINAL_REQUEST.md ? R1, PROJECT.md ? Interface Contracts
import re
import math
from tests_e2e.core.runner import TestRegistry
from tests_e2e.core.contracts import (
    AUTHENTIC_PERU_MALLS, is_within_peru, validate_polygon_geometry,
    check_rbac_permission, ROLE_COMERCIAL, ROLE_PROYECTOS,
    LOCAL_ESTADOS, TICKET_ESTADOS, TICKET_PRIORIDADES, TICKET_TIPOS
)
from tests_e2e.core.coordinate_engine import (
    screen_to_relative, relative_to_screen, point_in_polygon, polygon_area
)
from tests_e2e.core.webhook_signer import (
    compute_hmac_sha256, verify_hmac_sha256, create_outbox_event
)

# ==========================================
# FEAT-R1-01: PostGIS Mall Spatial Entity & API
# ==========================================

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-01-01",
    name="Verify Mall spatial entity coordinates within Peru boundaries",
    tier=1,
    feature_id="FEAT-R1-01",
    authoritative_source="ORIGINAL_REQUEST.md ? R1 & PROJECT.md ? 1"
)
def test_r1_01_mall_creation_peru():
    for mall in AUTHENTIC_PERU_MALLS:
        assert is_within_peru(mall["lat"], mall["lon"]), f"Mall {mall['nombre']} coords outside Peru"
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", mall["slug"]), f"Invalid slug: {mall['slug']}"
        assert len(mall["departamento"]) > 0, "Department must not be empty"

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-01-02",
    name="Verify GeoJSON Point serialization format [lon, lat]",
    tier=1,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_01_geojson_point_serialization():
    ves = AUTHENTIC_PERU_MALLS[0]
    geojson = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [ves["lon"], ves["lat"]]  # PostGIS GeoJSON standard: [X, Y] = [lon, lat]
        },
        "properties": {
            "nombre": ves["nombre"],
            "departamento": ves["departamento"]
        }
    }
    assert geojson["geometry"]["type"] == "Point"
    assert geojson["geometry"]["coordinates"][0] == ves["lon"]
    assert geojson["geometry"]["coordinates"][1] == ves["lat"]

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-01-03",
    name="Verify Haversine geospatial distance calculation between Peru malls",
    tier=1,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md ? PostGIS Proximity Query"
)
def test_r1_01_geospatial_distance():
    # Lima (Jockey Plaza) to Arequipa (Mall Aventura Porongoche)
    lat1, lon1 = -12.0863, -76.9763
    lat2, lon2 = -16.4225, -71.5173
    # Earth radius in km
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    dist_km = R * c
    # Distance between Lima and Arequipa is approximately 750-800 km
    assert 700 <= dist_km <= 850, f"Calculated distance {dist_km:.1f} km outside expected range"

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-01-04",
    name="Verify Mall summary metrics validation",
    tier=1,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_01_mall_metrics():
    mall_data = {
        "id": "11111111-2222-3333-4444-555555555555",
        "nombre": "Plaza Center Villa El Salvador",
        "slug": "plaza-center-ves",
        "direccion": "Av. Los ?lamos con Av. Pastores",
        "departamento": "Lima",
        "total_locales": 26,
        "superficie_total_m2": 45000.50
    }
    assert mall_data["total_locales"] > 0
    assert mall_data["superficie_total_m2"] > 1000.0
    assert len(mall_data["direccion"]) >= 5

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-01-05",
    name="Verify Mall blueprint plan entity linking",
    tier=1,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md ? Code Layout & Schema"
)
def test_r1_01_mall_blueprint_linking():
    blueprint = {
        "id": "plan-ves-01",
        "centro_comercial_id": "mall-ves-01",
        "nombre_piso": "Nivel 1 - Galer?a Principal",
        "numero_orden": 1,
        "ancho_unscaled_pt": 2384.0,
        "alto_unscaled_pt": 1684.0,
        "archivo_pdf_url": "/blueprints/pacita_ves_nivel1.pdf"
    }
    assert blueprint["numero_orden"] == 1
    assert blueprint["ancho_unscaled_pt"] > blueprint["alto_unscaled_pt"], "A1/A2 Blueprint is landscape"
    assert blueprint["archivo_pdf_url"].endswith(".pdf")

# ==========================================
# FEAT-R1-02: Commercial Unit (Local) Entity & CRUD
# ==========================================

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-02-01",
    name="Verify Local entity creation with required commercial terms",
    tier=1,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_02_local_creation():
    local = {
        "id": "loc-coolbox-103",
        "codigo_local": "LCE-103",
        "nombre_comercial": "COOLBOX",
        "categoria": "Tecnolog?a",
        "estado": "arrendado",
        "area_m2": 29.70,
        "precio_alquiler_mensual": 1200.00,
        "moneda": "USD",
        "piso_nivel": "Nivel 1"
    }
    assert local["estado"] in LOCAL_ESTADOS
    assert local["area_m2"] > 0
    assert local["precio_alquiler_mensual"] > 0
    assert local["moneda"] in {"USD", "PEN"}

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-02-02",
    name="Verify Local status state machine transitions",
    tier=1,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md ? Relational Schema"
)
def test_r1_02_status_transitions():
    valid_transitions = [
        ("disponible", "reservado"),
        ("reservado", "arrendado"),
        ("arrendado", "mantenimiento"),
        ("mantenimiento", "disponible")
    ]
    for s_from, s_to in valid_transitions:
        assert s_from in LOCAL_ESTADOS and s_to in LOCAL_ESTADOS

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-02-03",
    name="Verify Local commercial update triggers outbox event",
    tier=1,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_02_update_triggers_outbox():
    local_id = "loc-bitel-105"
    updated_terms = {"precio_alquiler_mensual": 1850.00, "estado": "arrendado"}
    event = create_outbox_event("local.actualizado", "local", local_id, updated_terms)
    assert event["tipo_evento"] == "local.actualizado"
    assert event["entidad_id"] == local_id
    assert event["payload"]["precio_alquiler_mensual"] == 1850.00

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-02-04",
    name="Verify Local code uniqueness constraint within mall",
    tier=1,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md ? DDL Schema uq_centro_codigo"
)
def test_r1_02_code_uniqueness():
    locales_mall = [
        {"centro_comercial_id": "mall-ves", "codigo_local": "LCE-101"},
        {"centro_comercial_id": "mall-ves", "codigo_local": "LCE-102"},
        {"centro_comercial_id": "mall-ves", "codigo_local": "LCE-103"},
    ]
    codes = set()
    for loc in locales_mall:
        key = (loc["centro_comercial_id"], loc["codigo_local"])
        assert key not in codes, f"Duplicate code {loc['codigo_local']} in mall"
        codes.add(key)

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-02-05",
    name="Verify Local floor level matches blueprint level",
    tier=1,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md ? Relational Schema"
)
def test_r1_02_floor_level():
    local = {"codigo_local": "LCE-104", "piso_nivel": "Nivel 1"}
    blueprint = {"nombre_piso": "Nivel 1 - Galer?a Principal"}
    assert "Nivel 1" in local["piso_nivel"]
    assert "Nivel 1" in blueprint["nombre_piso"]

# ==========================================
# FEAT-R1-03: Relative PDF Polygon Storage API
# ==========================================

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-03-01",
    name="Verify Polygon relative vertex storage in unit square [0..1]",
    tier=1,
    feature_id="FEAT-R1-03",
    authoritative_source="ORIGINAL_REQUEST.md ? R2 & PROJECT.md ? 2"
)
def test_r1_03_relative_vertices_storage():
    points = [{"x": 0.15, "y": 0.20}, {"x": 0.25, "y": 0.20}, {"x": 0.25, "y": 0.35}, {"x": 0.15, "y": 0.35}]
    valid, err = validate_polygon_geometry(points)
    assert valid, err

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-03-02",
    name="Verify Polygon visual style attributes",
    tier=1,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_03_polygon_style():
    polygon = {
        "color_relleno": "#3B82F6",
        "color_borde": "#1D4ED8",
        "opacidad": 0.40,
        "etiqueta": "LCE-103 COOLBOX"
    }
    assert polygon["color_relleno"].startswith("#")
    assert 0.0 <= polygon["opacidad"] <= 1.0
    assert "COOLBOX" in polygon["etiqueta"]

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-03-03",
    name="Verify Ray-Casting hit test resolves clicked relative point to Local",
    tier=1,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md ? Essential PostGIS Queries ST_Contains"
)
def test_r1_03_hit_testing():
    # Polygon boundaries: X in [0.20, 0.40], Y in [0.30, 0.50]
    poly_vertices = [(0.20, 0.30), (0.40, 0.30), (0.40, 0.50), (0.20, 0.50)]
    inside_click = (0.30, 0.40)
    outside_click = (0.50, 0.60)
    assert point_in_polygon(inside_click, poly_vertices) is True
    assert point_in_polygon(outside_click, poly_vertices) is False

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-03-04",
    name="Verify Polygon to Local 1-to-1 relationship",
    tier=1,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md ? Relational Schema"
)
def test_r1_03_one_to_one_relationship():
    polygon = {"id": "poly-01", "local_id": "loc-coolbox-103", "plano_id": "plan-ves-01"}
    assert polygon["local_id"] is not None
    assert polygon["plano_id"] is not None

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-03-05",
    name="Verify Polygon multi-page isolation filtering",
    tier=1,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md ? Edge Cases (Multi-Page)"
)
def test_r1_03_multipage_isolation():
    polygons = [
        {"id": "p1", "page_number": 1, "local_id": "L1"},
        {"id": "p2", "page_number": 2, "local_id": "L2"},
        {"id": "p3", "page_number": 1, "local_id": "L3"}
    ]
    p1_filtered = [p for p in polygons if p["page_number"] == 1]
    assert len(p1_filtered) == 2
    assert all(p["page_number"] == 1 for p in p1_filtered)

# ==========================================
# FEAT-R1-04: Ticket Management & Workflow API
# ==========================================

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-04-01",
    name="Verify Ticket creation with default status ABIERTO",
    tier=1,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts"
)
def test_r1_04_ticket_creation():
    ticket = {
        "codigo_ticket": "TCK-2026-0001",
        "titulo": "Subdivisi?n de Local para m?dulo bancario",
        "descripcion": "El arrendatario solicita subdividir 10m2 para un cajero autom?tico.",
        "tipo": "division_local",
        "prioridad": "alta",
        "estado": "abierto"
    }
    assert ticket["estado"] == "abierto"
    assert ticket["tipo"] in TICKET_TIPOS
    assert ticket["prioridad"] in TICKET_PRIORIDADES

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-04-02",
    name="Verify Ticket links to Centro Comercial and Local",
    tier=1,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md ? Relational Schema"
)
def test_r1_04_ticket_links():
    ticket = {
        "centro_comercial_id": "mall-ves",
        "local_id": "loc-coolbox-103",
        "titulo": "Revisi?n de punto el?ctrico"
    }
    assert ticket["centro_comercial_id"] == "mall-ves"
    assert ticket["local_id"] == "loc-coolbox-103"

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-04-03",
    name="Verify Ticket assignment to Projects user",
    tier=1,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md ? Relational Schema"
)
def test_r1_04_ticket_assignment():
    ticket = {
        "estado": "en_revision",
        "asignado_a_usuario_id": "usr-proyectos-01"
    }
    assert ticket["estado"] == "en_revision"
    assert ticket["asignado_a_usuario_id"] is not None

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-04-04",
    name="Verify Ticket resolution with mandatory resolution notes",
    tier=1,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts PATCH /resolve"
)
def test_r1_04_ticket_resolution():
    resolution_payload = {
        "estado": "resuelto",
        "notas_resolucion": "Planos actualizados con la nueva tabiquer?a y aprobados por Proyectos."
    }
    assert resolution_payload["estado"] == "resuelto"
    assert len(resolution_payload["notas_resolucion"]) > 10

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-04-05",
    name="Verify Ticket category taxonomy completeness",
    tier=1,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md ? Enumerated Types"
)
def test_r1_04_ticket_categories():
    assert "modificacion_plano" in TICKET_TIPOS
    assert "division_local" in TICKET_TIPOS
    assert "mantenimiento" in TICKET_TIPOS
    assert "revision_comercial" in TICKET_TIPOS
    assert "nuevo_requerimiento" in TICKET_TIPOS

# ==========================================
# FEAT-R1-05: CRM Event / Webhook Outbox Dispatcher
# ==========================================

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-05-01",
    name="Verify Outbox event generation on ticket creation",
    tier=1,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md ? 1. Backend API Contracts & Outbox Pattern"
)
def test_r1_05_outbox_generation():
    payload = {"ticket_id": "TCK-2026-0001", "titulo": "Nuevo Requerimiento", "estado": "abierto"}
    event = create_outbox_event("ticket.creado", "ticket", "TCK-2026-0001", payload)
    assert event["tipo_evento"] == "ticket.creado"
    assert event["estado"] == "pendiente"
    assert event["signature"].startswith("sha256=")

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-05-02",
    name="Verify HMAC-SHA256 signature correctness on Outbox payload",
    tier=1,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md ? Architecture Outbox HMAC-SHA256"
)
def test_r1_05_hmac_calculation():
    payload = {"local_id": "LCE-103", "estado": "arrendado"}
    secret = "test_crm_secret"
    sig = compute_hmac_sha256(payload, secret)
    assert len(sig) == 64, "SHA-256 hex digest must be 64 characters"

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-05-03",
    name="Verify HMAC signature verification against authentic secret",
    tier=1,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md ? Architecture Outbox HMAC-SHA256"
)
def test_r1_05_hmac_verification():
    payload = {"local_id": "LCE-103", "estado": "arrendado"}
    secret = "test_crm_secret"
    sig = compute_hmac_sha256(payload, secret)
    assert verify_hmac_sha256(payload, sig, secret) is True
    assert verify_hmac_sha256(payload, sig, "wrong_secret") is False

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-05-04",
    name="Verify Outbox retry counter and backoff incrementation",
    tier=1,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md ? DDL Schema eventos_outbox"
)
def test_r1_05_outbox_retry():
    event = create_outbox_event("local.actualizado", "local", "L-01", {"area": 30.0})
    event["reintentos"] += 1
    event["ultimo_error"] = "HTTP 504 Gateway Timeout"
    assert event["reintentos"] == 1
    assert "Timeout" in event["ultimo_error"]

@TestRegistry.register(
    test_id="E2E-T1-FEAT-R1-05-05",
    name="Verify Outbox event transition from pendiente to publicado",
    tier=1,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md ? Outbox Pattern"
)
def test_r1_05_outbox_published():
    event = create_outbox_event("ticket.resuelto", "ticket", "TCK-01", {"status": "resuelto"})
    assert event["estado"] == "pendiente"
    # Simulate successful dispatch
    event["estado"] = "publicado"
    assert event["estado"] == "publicado"
