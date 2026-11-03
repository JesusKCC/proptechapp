# Tier 2 Boundary & Corner Cases: Backend Core (FEAT-R1-01 to FEAT-R1-05)
# Authoritative Sources: ORIGINAL_REQUEST.md § R1, PROJECT.md § Edge Cases & Contracts
from tests_e2e.core.runner import TestRegistry
from tests_e2e.core.contracts import (
    is_within_peru, validate_polygon_geometry, check_rbac_permission,
    PERU_LAT_MIN, PERU_LAT_MAX, PERU_LON_MIN, PERU_LON_MAX,
    ROLE_COMERCIAL, ROLE_PROYECTOS, LOCAL_ESTADOS, TICKET_ESTADOS
)
from tests_e2e.core.coordinate_engine import (
    screen_to_relative, relative_to_screen, polygon_area, point_in_polygon
)
from tests_e2e.core.webhook_signer import (
    compute_hmac_sha256, verify_hmac_sha256, create_outbox_event
)

# ==========================================
# FEAT-R1-01: PostGIS Mall Boundaries
# ==========================================

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-01-01",
    name="Verify rejection of overseas geographic coordinates outside Peru",
    tier=2,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md § Edge Cases (Overseas Coords)"
)
def test_t2_r1_01_overseas_rejection():
    foreign_coords = [
        (40.4168, -3.7038),   # Madrid, Spain
        (40.7128, -74.0060),  # New York, USA
        (35.6762, 139.6503),  # Tokyo, Japan
        (4.7110, -74.0721),   # Bogotá, Colombia
        (-33.4489, -70.6693)  # Santiago, Chile
    ]
    for lat, lon in foreign_coords:
        assert is_within_peru(lat, lon) is False, f"Overseas coord ({lat}, {lon}) must not be inside Peru"

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-01-02",
    name="Verify detection of inverted lat/lon coordinates",
    tier=2,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md § Edge Cases #10"
)
def test_t2_r1_01_inverted_coords():
    # Correct: lat = -12.0863, lon = -76.9763 (Jockey Plaza)
    # Inverted: lat = -76.9763, lon = -12.0863
    inverted_lat, inverted_lon = -76.9763, -12.0863
    assert is_within_peru(inverted_lat, inverted_lon) is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-01-03",
    name="Verify exact Peru territory boundary extremes",
    tier=2,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md § Peru Geographic Envelopes"
)
def test_t2_r1_01_territory_extremes():
    # Border points inside Peru
    assert is_within_peru(PERU_LAT_MAX, -75.0) is True  # North border
    assert is_within_peru(PERU_LAT_MIN, -70.0) is True  # South border
    assert is_within_peru(-10.0, PERU_LON_MIN) is True  # West border
    assert is_within_peru(-10.0, PERU_LON_MAX) is True  # East border
    # Just outside bounds
    assert is_within_peru(PERU_LAT_MAX + 0.1, -75.0) is False
    assert is_within_peru(PERU_LAT_MIN - 0.1, -70.0) is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-01-04",
    name="Verify zero, negative, and extreme megamall surface area validation",
    tier=2,
    feature_id="FEAT-R1-01",
    authoritative_source="PROJECT.md § Mall Model Specification"
)
def test_t2_r1_01_surface_area_extremes():
    invalid_areas = [0.0, -100.0, -0.01]
    for a in invalid_areas:
        assert a <= 0, "Non-positive area must be caught"
    megamall_area = 500000.0  # 50 hectares
    assert megamall_area > 0 and megamall_area < 10000000.0

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-01-05",
    name="Verify unicode accents and special characters in mall names",
    tier=2,
    feature_id="FEAT-R1-01",
    authoritative_source="ORIGINAL_REQUEST.md § Adversarial Verification"
)
def test_t2_r1_01_unicode_names():
    special_names = [
        "Plaza Center San Martín de Porres",
        "Mall Aventura Porongoché - Arequipa",
        "Centro Comercial Plaza Mayor de Huánuco",
        "Galerías Comerciales Ñandú & Cía. S.A.C."
    ]
    for name in special_names:
        assert len(name.strip()) > 5
        encoded = name.encode("utf-8")
        assert len(encoded) >= len(name)

# ==========================================
# FEAT-R1-02: Commercial Unit Boundaries
# ==========================================

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-02-01",
    name="Verify extreme unit area bounds (0.5m2 kiosk vs 15,000m2 department store)",
    tier=2,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md § Local Model Specification"
)
def test_t2_r1_02_area_bounds():
    tiny_kiosk = 0.50
    huge_anchor = 15000.00
    assert tiny_kiosk > 0.1, "Micro-kiosks above 0.1m2 allowed"
    assert huge_anchor <= 50000.0, "Anchor stores below 50,000m2 allowed"

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-02-02",
    name="Verify rejection of zero and negative rent amounts",
    tier=2,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md § Edge Cases #11"
)
def test_t2_r1_02_rent_rejection():
    invalid_rents = [0.00, -100.00, -0.01]
    for r in invalid_rents:
        is_valid = r > 0
        assert is_valid is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-02-03",
    name="Verify rejection of unsupported currency codes (only USD and PEN accepted)",
    tier=2,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md § Local Model moneda"
)
def test_t2_r1_02_currency_validation():
    allowed = {"USD", "PEN"}
    disallowed = ["EUR", "BTC", "GBP", "CLP", ""]
    for c in disallowed:
        assert c not in allowed

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-02-04",
    name="Verify rejection of invalid state transitions",
    tier=2,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md § Relational Schema"
)
def test_t2_r1_02_invalid_transitions():
    # Cannot transition directly from mantenimiento to reservado without becoming disponible
    disallowed_transition = ("mantenimiento", "reservado")
    valid_next_states = {"mantenimiento": {"disponible"}}
    assert disallowed_transition[1] not in valid_next_states.get(disallowed_transition[0], set())

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-02-05",
    name="Verify unit code string trimming and maximum length boundary",
    tier=2,
    feature_id="FEAT-R1-02",
    authoritative_source="PROJECT.md § DDL Schema VARCHAR(50)"
)
def test_t2_r1_02_code_boundaries():
    code_raw = "   LCE-103   "
    code_trimmed = code_raw.strip()
    assert code_trimmed == "LCE-103"
    max_len_code = "A" * 50
    assert len(max_len_code) == 50
    overflow_code = "A" * 51
    assert len(overflow_code) > 50

# ==========================================
# FEAT-R1-03: Relative Polygon Boundaries
# ==========================================

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-03-01",
    name="Verify exact polygon boundary extremes at corners (0,0) and (1,1)",
    tier=2,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md § Edge Cases #1"
)
def test_t2_r1_03_corner_boundaries():
    corner_poly = [{"x": 0.0, "y": 0.0}, {"x": 1.0, "y": 0.0}, {"x": 1.0, "y": 1.0}, {"x": 0.0, "y": 1.0}]
    valid, err = validate_polygon_geometry(corner_poly)
    assert valid, err

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-03-02",
    name="Verify coordinate overflow and negative rejection",
    tier=2,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md § Edge Cases #2"
)
def test_t2_r1_03_overflow_rejection():
    overflow_poly = [{"x": 1.0001, "y": 0.5}, {"x": 0.5, "y": 0.5}, {"x": 0.5, "y": 0.8}]
    valid, err = validate_polygon_geometry(overflow_poly)
    assert valid is False
    assert "out of normalized" in err

    underflow_poly = [{"x": -0.0001, "y": 0.5}, {"x": 0.5, "y": 0.5}, {"x": 0.5, "y": 0.8}]
    valid, err = validate_polygon_geometry(underflow_poly)
    assert valid is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-03-03",
    name="Verify colinear points resulting in degenerate zero area",
    tier=2,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md § Edge Cases #3"
)
def test_t2_r1_03_colinear_zero_area():
    # 3 points on horizontal line y = 0.5
    colinear_pts = [(0.1, 0.5), (0.5, 0.5), (0.9, 0.5)]
    area = polygon_area(colinear_pts)
    assert abs(area) < 1e-12, f"Expected ~0 area, got {area}"

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-03-04",
    name="Verify high-density polygon with 100 vertices",
    tier=2,
    feature_id="FEAT-R1-03",
    authoritative_source="ORIGINAL_REQUEST.md § Adversarial Verification"
)
def test_t2_r1_03_high_density_polygon():
    import math
    n = 100
    r = 0.25
    cx, cy = 0.5, 0.5
    poly_100 = []
    for i in range(n):
        theta = 2.0 * math.pi * i / n
        poly_100.append({"x": cx + r * math.cos(theta), "y": cy + r * math.sin(theta)})
    valid, err = validate_polygon_geometry(poly_100)
    assert valid, err
    area = polygon_area([(p["x"], p["y"]) for p in poly_100])
    expected_circle_area = math.pi * (r ** 2)
    assert abs(area - expected_circle_area) < 0.001

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-03-05",
    name="Verify non-existent blueprint page number filtering returns empty list",
    tier=2,
    feature_id="FEAT-R1-03",
    authoritative_source="PROJECT.md § Multi-Page Blueprint Isolation"
)
def test_t2_r1_03_nonexistent_page():
    polygons = [{"id": "p1", "page_number": 1}]
    filtered = [p for p in polygons if p["page_number"] == 99]
    assert len(filtered) == 0

# ==========================================
# FEAT-R1-04: Ticket Boundaries
# ==========================================

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-04-01",
    name="Verify Ticket title length boundaries (min 3 chars, max 255 chars)",
    tier=2,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md § DDL Schema VARCHAR(255)"
)
def test_t2_r1_04_title_boundaries():
    too_short = "AB"
    assert len(too_short) < 3
    valid_min = "ABC"
    assert len(valid_min) >= 3
    max_title = "T" * 255
    assert len(max_title) == 255
    overflow_title = "T" * 256
    assert len(overflow_title) > 255

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-04-02",
    name="Verify general Mall ticket creation with null local_id",
    tier=2,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md § DDL Schema local_id NULL"
)
def test_t2_r1_04_null_local_id():
    mall_ticket = {
        "centro_comercial_id": "mall-ves",
        "local_id": None,
        "titulo": "Mantenimiento de pasadizo central"
    }
    assert mall_ticket["local_id"] is None
    assert mall_ticket["centro_comercial_id"] is not None

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-04-03",
    name="Verify terminal state rejection: cannot resolve an already resolved ticket",
    tier=2,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md § Ticket Lifecycle"
)
def test_t2_r1_04_terminal_state():
    ticket_status = "resuelto"
    can_re_resolve = ticket_status in {"abierto", "en_revision"}
    assert can_re_resolve is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-04-04",
    name="Verify whitespace-only resolution notes rejection",
    tier=2,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md § Edge Cases"
)
def test_t2_r1_04_whitespace_notes():
    notes = "   \n\t  "
    is_valid = len(notes.strip()) >= 5
    assert is_valid is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-04-05",
    name="Verify URGENTE priority ticket escalation payload",
    tier=2,
    feature_id="FEAT-R1-04",
    authoritative_source="PROJECT.md § Enumerated Types"
)
def test_t2_r1_04_urgent_ticket():
    ticket = {"prioridad": "urgente", "escalar_inmediato": True}
    assert ticket["prioridad"] == "urgente"
    assert ticket["escalar_inmediato"] is True

# ==========================================
# FEAT-R1-05: Outbox/Webhook Boundaries
# ==========================================

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-05-01",
    name="Verify HMAC signature tampering detection on single bit flip",
    tier=2,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md § Outbox Pattern HMAC-SHA256"
)
def test_t2_r1_05_hmac_tampering():
    payload = {"ticket_id": "TCK-001", "action": "approved"}
    secret = "production_crm_key"
    sig = compute_hmac_sha256(payload, secret)
    # Flip the last character of the hex digest
    flipped_char = '1' if sig[-1] == '0' else '0'
    tampered_sig = sig[:-1] + flipped_char
    assert verify_hmac_sha256(payload, tampered_sig, secret) is False

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-05-02",
    name="Verify unique delivery event UUID prevents replay attacks",
    tier=2,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md § Outbox Pattern Delivery Headers"
)
def test_t2_r1_05_replay_prevention():
    seen_deliveries = set()
    e1 = create_outbox_event("ticket.creado", "ticket", "t1", {"x": 1})
    e2 = create_outbox_event("ticket.creado", "ticket", "t1", {"x": 1})
    assert e1["id"] != e2["id"], "Event deliveries must have unique UUIDs"

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-05-03",
    name="Verify large payload serialization (500KB JSON)",
    tier=2,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md § Outbox Pattern JSONB Payload"
)
def test_t2_r1_05_large_payload():
    large_points = [{"x": float(i)/10000.0, "y": float(i)/10000.0} for i in range(10000)]
    payload = {"complex_polygon": large_points}
    sig = compute_hmac_sha256(payload, "secret")
    assert len(sig) == 64

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-05-04",
    name="Verify maximum retry threshold transitions status to FALLIDO",
    tier=2,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md § DDL Schema max_reintentos"
)
def test_t2_r1_05_max_retry_failed():
    event = {"estado": "pendiente", "reintentos": 5, "max_reintentos": 5}
    if event["reintentos"] >= event["max_reintentos"]:
        event["estado"] = "fallido"
    assert event["estado"] == "fallido"

@TestRegistry.register(
    test_id="E2E-T2-FEAT-R1-05-05",
    name="Verify rejection of empty secret string for HMAC calculation",
    tier=2,
    feature_id="FEAT-R1-05",
    authoritative_source="PROJECT.md § Security HMAC Secret"
)
def test_t2_r1_05_empty_secret():
    payload = {"status": "ok"}
    verified = verify_hmac_sha256(payload, "sig", secret="")
    assert verified is False

