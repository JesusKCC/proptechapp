import {
  CentroComercial,
  LocalComercial,
  PoligonoBlueprint,
  Ticket,
  TicketCreate,
  TicketResolve,
  UserRole,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Resilient fetch with timeout to guarantee the frontend never hangs if backend is slow
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 2500
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Authentic fallback data for 11 Peruvian Shopping Centers
export const FALLBACK_MALLS: CentroComercial[] = [
  {
    id: 'plaza-center-villa-el-salvador',
    nombre: 'Plaza Center Villa El Salvador',
    slug: 'plaza-center-villa-el-salvador',
    direccion: 'Av. Pachacútec con Av. El Sol, Villa El Salvador',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Villa El Salvador',
    lat: -12.215,
    lon: -76.938,
    total_locales: 26,
    superficie_total_m2: 60000.0,
    imagen_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
  },
  {
    id: 'jockey-plaza',
    nombre: 'Jockey Plaza',
    slug: 'jockey-plaza',
    direccion: 'Av. Javier Prado Este 4200, Santiago de Surco',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Santiago de Surco',
    lat: -12.0863,
    lon: -76.9763,
    total_locales: 12,
    superficie_total_m2: 170000.0,
    imagen_url: 'https://images.unsplash.com/photo-1567449303078-57ad995bd302?w=800',
  },
  {
    id: 'real-plaza-salaverry',
    nombre: 'Real Plaza Salaverry',
    slug: 'real-plaza-salaverry',
    direccion: 'Av. General Salaverry 2370, Jesús María',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Jesús María',
    lat: -12.0899,
    lon: -77.051,
    total_locales: 8,
    superficie_total_m2: 85000.0,
    imagen_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  },
  {
    id: 'mall-aventura-porongoche',
    nombre: 'Mall Aventura Porongoche',
    slug: 'mall-aventura-porongoche',
    direccion: 'Av. Porongoche 500, Paucarpata',
    departamento: 'Arequipa',
    provincia: 'Arequipa',
    distrito: 'Paucarpata',
    lat: -16.4225,
    lon: -71.5173,
    total_locales: 6,
    superficie_total_m2: 100000.0,
    imagen_url: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=800',
  },
  {
    id: 'real-plaza-trujillo',
    nombre: 'Real Plaza Trujillo',
    slug: 'real-plaza-trujillo',
    direccion: 'Av. César Vallejo Oeste 1345, Trujillo',
    departamento: 'La Libertad',
    provincia: 'Trujillo',
    distrito: 'Trujillo',
    lat: -8.1272,
    lon: -79.0353,
    total_locales: 5,
    superficie_total_m2: 85000.0,
    imagen_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
  },
  {
    id: 'real-plaza-chiclayo',
    nombre: 'Real Plaza Chiclayo',
    slug: 'real-plaza-chiclayo',
    direccion: 'Av. Francisco Bolognesi 498, Chiclayo',
    departamento: 'Lambayeque',
    provincia: 'Chiclayo',
    distrito: 'Chiclayo',
    lat: -6.7714,
    lon: -79.8409,
    total_locales: 4,
    superficie_total_m2: 60000.0,
    imagen_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  },
  {
    id: 'open-plaza-piura',
    nombre: 'Open Plaza Piura',
    slug: 'open-plaza-piura',
    direccion: 'Av. Andrés Avelino Cáceres 147, Castilla',
    departamento: 'Piura',
    provincia: 'Piura',
    distrito: 'Castilla',
    lat: -5.1865,
    lon: -80.6208,
    total_locales: 4,
    superficie_total_m2: 60000.0,
    imagen_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
  },
  {
    id: 'real-plaza-cusco',
    nombre: 'Real Plaza Cusco',
    slug: 'real-plaza-cusco',
    direccion: 'Av. Collasuyo 2964, Cusco',
    departamento: 'Cusco',
    provincia: 'Cusco',
    distrito: 'Cusco',
    lat: -13.5226,
    lon: -71.9427,
    total_locales: 4,
    superficie_total_m2: 45000.0,
    imagen_url: 'https://images.unsplash.com/photo-1567449303078-57ad995bd302?w=800',
  },
  {
    id: 'real-plaza-huancayo',
    nombre: 'Real Plaza Huancayo',
    slug: 'real-plaza-huancayo',
    direccion: 'Av. Ferrocarril 1035, Huancayo',
    departamento: 'Junín',
    provincia: 'Huancayo',
    distrito: 'Huancayo',
    lat: -12.0683,
    lon: -75.21,
    total_locales: 3,
    superficie_total_m2: 55000.0,
    imagen_url: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=800',
  },
  {
    id: 'el-quinde-ica',
    nombre: 'El Quinde Ica',
    slug: 'el-quinde-ica',
    direccion: 'Av. De los Maestros s/n, Ica',
    departamento: 'Ica',
    provincia: 'Ica',
    distrito: 'Ica',
    lat: -14.0772,
    lon: -75.7335,
    total_locales: 3,
    superficie_total_m2: 40000.0,
    imagen_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
  },
  {
    id: 'mall-plaza-tacna',
    nombre: 'Mall Plaza Tacna',
    slug: 'mall-plaza-tacna',
    direccion: 'Av. Manuel A. Odría, Tacna',
    departamento: 'Tacna',
    provincia: 'Tacna',
    distrito: 'Tacna',
    lat: -18.0146,
    lon: -70.2536,
    total_locales: 3,
    superficie_total_m2: 35000.0,
    imagen_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  },
];

// Complete Authentic Fallback Units across all 11 Peruvian Shopping Centers
export const FALLBACK_LOCALES: LocalComercial[] = [
  // 1. Plaza Center Villa El Salvador (26 locales)
  { id: 'ves-103', codigo_local: 'LCE-103', nombre_comercial: 'COOLBOX', categoria: 'Tecnología y Retail', estado: 'arrendado', area_m2: 29.70, precio_alquiler_mensual: 1250.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local comercial LCE-103 en Nivel 1. Acondicionado para Tecnología.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-104', codigo_local: 'LCE-104', nombre_comercial: 'TINKA', categoria: 'Entretenimiento y Loterías', estado: 'arrendado', area_m2: 39.00, precio_alquiler_mensual: 1500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local comercial LCE-104 en Nivel 1. Punto de atención de loterías.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-105', codigo_local: 'LCE-105', nombre_comercial: 'BITEL', categoria: 'Telecomunicaciones', estado: 'arrendado', area_m2: 98.10, precio_alquiler_mensual: 3200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Centro de experiencia y atención a clientes Bitel.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-106', codigo_local: 'LCE-106', nombre_comercial: 'INKAFARMA', categoria: 'Salud y Farmacia', estado: 'arrendado', area_m2: 85.00, precio_alquiler_mensual: 3000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Farmacia y conveniencia en galería principal.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-107', codigo_local: 'LCE-107', nombre_comercial: 'ECONOLENTES', categoria: 'Óptica y Salud', estado: 'disponible', area_m2: 44.84, precio_alquiler_mensual: 1800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local con excelente iluminación para retail o salud.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-108', codigo_local: 'LCE-108', nombre_comercial: 'WESTERN UNION', categoria: 'Servicios Financieros', estado: 'arrendado', area_m2: 44.80, precio_alquiler_mensual: 1900.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Agencia de envíos y giros de dinero.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-101', codigo_local: 'LCE-101', nombre_comercial: 'STARBUCKS COFFEE', categoria: 'Cafetería y Gastronomía', estado: 'arrendado', area_m2: 120.00, precio_alquiler_mensual: 4500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Cafetería de especialidad con terraza exterior.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-111', codigo_local: 'ME-111', nombre_comercial: 'PANDERO', categoria: 'Servicios Automotrices', estado: 'disponible', area_m2: 20.80, precio_alquiler_mensual: 950.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Módulo comercial de alta visibilidad.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-112', codigo_local: 'LCE-112', nombre_comercial: 'ARUMA', categoria: 'Belleza y Cosmética', estado: 'disponible', area_m2: 65.20, precio_alquiler_mensual: 2200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda especializada en cosméticos y cuidado personal.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-113', codigo_local: 'LCE-113', nombre_comercial: 'SIFRAH', categoria: 'Accesorios y Joyería', estado: 'disponible', area_m2: 55.40, precio_alquiler_mensual: 1950.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Boutique de accesorios y carteras.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-114', codigo_local: 'LCE-114', nombre_comercial: 'MOTIVOS SPA', categoria: 'Cuidado Personal', estado: 'mantenimiento', area_m2: 48.00, precio_alquiler_mensual: 1600.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local en acondicionamiento y mantenimiento de instalaciones.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-115', codigo_local: 'LCE-115', nombre_comercial: 'TODO MODA', categoria: 'Moda y Accesorios', estado: 'reservado', area_m2: 52.00, precio_alquiler_mensual: 1850.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local bajo contrato de arrendamiento en formalización.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-116', codigo_local: 'LCE-116', nombre_comercial: 'PARADA 111', categoria: 'Calzado y Moda', estado: 'disponible', area_m2: 72.50, precio_alquiler_mensual: 2400.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Espacio comercial para zapatería o textil.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-117', codigo_local: 'LCE-117', nombre_comercial: 'VACANCY A', categoria: 'Grandes Tiendas / Ancla', estado: 'disponible', area_m2: 268.70, precio_alquiler_mensual: 7500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Macrolocal comercial ideal para tienda ancla o gimnasio.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-118', codigo_local: 'LCE-118', nombre_comercial: 'VACANCY B', categoria: 'Restaurantes', estado: 'disponible', area_m2: 115.00, precio_alquiler_mensual: 3800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local gastronómico con ducto de extracción habilitado.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-119', codigo_local: 'LCE-119', nombre_comercial: 'TOPITOP', categoria: 'Moda y Textil', estado: 'arrendado', area_m2: 140.00, precio_alquiler_mensual: 4200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda de confecciones peruanas.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-120', codigo_local: 'LCE-120', nombre_comercial: 'BATA', categoria: 'Calzado', estado: 'arrendado', area_m2: 80.00, precio_alquiler_mensual: 2800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Calzado familiar e infantil.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-121', codigo_local: 'LCE-121', nombre_comercial: 'PLAZA VEA EXPRESS', categoria: 'Supermercados', estado: 'arrendado', area_m2: 350.00, precio_alquiler_mensual: 9000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Supermercado de formato express para conveniencia.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-122', codigo_local: 'LCE-122', nombre_comercial: 'PROMART EXPRESS', categoria: 'Hogar y Construcción', estado: 'arrendado', area_m2: 280.00, precio_alquiler_mensual: 7200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Mejoramiento del hogar y ferretería.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-123', codigo_local: 'LCE-123', nombre_comercial: 'PARDOS CHICKEN', categoria: 'Gastronomía', estado: 'arrendado', area_m2: 180.00, precio_alquiler_mensual: 5500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Restaurante de brasas y cocina peruana.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-124', codigo_local: 'LCE-124', nombre_comercial: 'TAMBO+', categoria: 'Conveniencia', estado: 'arrendado', area_m2: 60.00, precio_alquiler_mensual: 2100.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda por conveniencia 24h.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-125', codigo_local: 'LCE-125', nombre_comercial: 'BCP AGENTE', categoria: 'Banca', estado: 'arrendado', area_m2: 35.00, precio_alquiler_mensual: 1600.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Centro de transacciones financieras BCP.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-126', codigo_local: 'LCE-126', nombre_comercial: 'INTERBANK', categoria: 'Banca', estado: 'arrendado', area_m2: 45.00, precio_alquiler_mensual: 1800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Agencia bancaria y cajeros automáticos.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-024', codigo_local: 'HL-VES-024', nombre_comercial: 'KFC', categoria: 'Fast Food', estado: 'arrendado', area_m2: 110.00, precio_alquiler_mensual: 4800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Franquicia de comida rápida en patio de comidas.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-025', codigo_local: 'HL-VES-025', nombre_comercial: 'PIZZA HUT', categoria: 'Fast Food', estado: 'arrendado', area_m2: 95.00, precio_alquiler_mensual: 4100.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Pizzería y comida rápida.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },
  { id: 'ves-026', codigo_local: 'HL-VES-026', nombre_comercial: 'POPEYES', categoria: 'Fast Food', estado: 'disponible', area_m2: 88.00, precio_alquiler_mensual: 3900.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Módulo de fast food con instalaciones completas.', centro_comercial_id: 'plaza-center-villa-el-salvador', centro_comercial_nombre: 'Plaza Center Villa El Salvador', plano_id: 'plano-ves-nivel1' },

  // 2. Jockey Plaza (12 locales)
  { id: 'jck-101', codigo_local: 'JCK-101', nombre_comercial: 'SAGA FALABELLA', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 4500.0, precio_alquiler_mensual: 35000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Gran tienda ancla de moda y tecnología.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-102', codigo_local: 'JCK-102', nombre_comercial: 'RIPLEY', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 4200.0, precio_alquiler_mensual: 32000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda por departamento ancla.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-103', codigo_local: 'JCK-103', nombre_comercial: 'ZARA', categoria: 'Moda Internacional', estado: 'arrendado', area_m2: 1800.0, precio_alquiler_mensual: 18000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda insignia de moda europea.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-104', codigo_local: 'JCK-104', nombre_comercial: 'H&M', categoria: 'Moda y Textil', estado: 'arrendado', area_m2: 2200.0, precio_alquiler_mensual: 20000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Cadena internacional de moda.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-105', codigo_local: 'JCK-105', nombre_comercial: 'ISHOP APPLE PREMIUM', categoria: 'Tecnología', estado: 'arrendado', area_m2: 180.0, precio_alquiler_mensual: 6500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Distribuidor autorizado Apple Premium Reseller.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-106', codigo_local: 'JCK-106', nombre_comercial: 'STARBUCKS RESERVE', categoria: 'Cafetería y Gastronomía', estado: 'arrendado', area_m2: 120.0, precio_alquiler_mensual: 4800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Café de especialidad Starbucks Reserve Bar.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-107', codigo_local: 'JCK-107', nombre_comercial: 'NIKE STORE', categoria: 'Deportes y Calzado', estado: 'arrendado', area_m2: 320.0, precio_alquiler_mensual: 8500.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Tienda concepto Nike Live.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-108', codigo_local: 'JCK-108', nombre_comercial: 'ADIDAS ORIGINALS', categoria: 'Deportes y Calzado', estado: 'arrendado', area_m2: 280.0, precio_alquiler_mensual: 7800.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Calzado y moda urbana deportiva.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-109', codigo_local: 'JCK-109', nombre_comercial: 'Disponible', categoria: 'Comercio General', estado: 'disponible', area_m2: 85.0, precio_alquiler_mensual: 3200.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Excelente vitrina comercial en pasillo de alto flujo.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-110', codigo_local: 'JCK-110', nombre_comercial: 'Disponible', categoria: 'Moda y Accesorios', estado: 'disponible', area_m2: 64.0, precio_alquiler_mensual: 2600.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Local acondicionado para retail de moda.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-111', codigo_local: 'JCK-111', nombre_comercial: 'MAMBO CAFÉ', categoria: 'Gastronomía', estado: 'reservado', area_m2: 95.0, precio_alquiler_mensual: 3400.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Café bistró en proceso de arrendamiento.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },
  { id: 'jck-112', codigo_local: 'JCK-112', nombre_comercial: 'CINEPLANET PRIME', categoria: 'Entretenimiento', estado: 'arrendado', area_m2: 3000.0, precio_alquiler_mensual: 25000.0, moneda: 'USD', piso_nivel: 'Nivel 3', descripcion: 'Complejo de salas de cine premium.', centro_comercial_id: 'jockey-plaza', centro_comercial_nombre: 'Jockey Plaza' },

  // 3. Real Plaza Salaverry (8 locales)
  { id: 'sal-101', codigo_local: 'SAL-101', nombre_comercial: 'OECHSLE', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 3500.0, precio_alquiler_mensual: 28000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla de moda, hogar y tecnología.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-102', codigo_local: 'SAL-102', nombre_comercial: 'ZARA SALAVERRY', categoria: 'Moda Internacional', estado: 'arrendado', area_m2: 1600.0, precio_alquiler_mensual: 15000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda de moda prêt-à-porter.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-103', codigo_local: 'SAL-103', nombre_comercial: 'MANGO', categoria: 'Moda Femenina', estado: 'arrendado', area_m2: 250.0, precio_alquiler_mensual: 6500.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Moda femenina y accesorios de temporada.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-104', codigo_local: 'SAL-104', nombre_comercial: 'STARBUCKS', categoria: 'Cafetería', estado: 'arrendado', area_m2: 110.0, precio_alquiler_mensual: 4200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Café y repostería en pasillo central.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-105', codigo_local: 'SAL-105', nombre_comercial: 'BEMBOS', categoria: 'Fast Food', estado: 'arrendado', area_m2: 90.0, precio_alquiler_mensual: 3600.0, moneda: 'USD', piso_nivel: 'Nivel 3', descripcion: 'Hamburguesería en patio de comidas.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-106', codigo_local: 'SAL-106', nombre_comercial: 'Disponible', categoria: 'Servicios y Belleza', estado: 'disponible', area_m2: 55.0, precio_alquiler_mensual: 2200.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Espacio ideal para salón de belleza o barbería.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-107', codigo_local: 'SAL-107', nombre_comercial: 'Disponible', categoria: 'Comercio General', estado: 'disponible', area_m2: 78.0, precio_alquiler_mensual: 2900.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Local comercial disponible con doble frente.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },
  { id: 'sal-108', codigo_local: 'SAL-108', nombre_comercial: 'KUNA ALPACA', categoria: 'Moda y Textiles', estado: 'arrendado', area_m2: 80.0, precio_alquiler_mensual: 3200.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Prendas exclusivas de alpaca y vicuña.', centro_comercial_id: 'real-plaza-salaverry', centro_comercial_nombre: 'Real Plaza Salaverry' },

  // 4. Mall Aventura Porongoche (6 locales)
  { id: 'por-101', codigo_local: 'POR-101', nombre_comercial: 'RIPLEY AREQUIPA', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 3800.0, precio_alquiler_mensual: 26000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla departamental en Arequipa.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },
  { id: 'por-102', codigo_local: 'POR-102', nombre_comercial: 'PLAZA VEA', categoria: 'Supermercados', estado: 'arrendado', area_m2: 4500.0, precio_alquiler_mensual: 30000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado de gran formato.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },
  { id: 'por-103', codigo_local: 'POR-103', nombre_comercial: 'SODIMAC CONSTRUCTOR', categoria: 'Mejoramiento del Hogar', estado: 'arrendado', area_m2: 5200.0, precio_alquiler_mensual: 32000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Centro de bricolaje y materiales.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },
  { id: 'por-104', codigo_local: 'POR-104', nombre_comercial: 'H&M AREQUIPA', categoria: 'Moda', estado: 'arrendado', area_m2: 1900.0, precio_alquiler_mensual: 16000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Moda y calzado para toda la familia.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },
  { id: 'por-105', codigo_local: 'POR-105', nombre_comercial: 'Disponible', categoria: 'Retail', estado: 'disponible', area_m2: 65.0, precio_alquiler_mensual: 2100.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Local comercial en pasillo de entretenimiento.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },
  { id: 'por-106', codigo_local: 'POR-106', nombre_comercial: 'Disponible', categoria: 'Gastronomía', estado: 'disponible', area_m2: 90.0, precio_alquiler_mensual: 3000.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Módulo para restaurante o cafetería.', centro_comercial_id: 'mall-aventura-porongoche', centro_comercial_nombre: 'Mall Aventura Porongoche' },

  // 5. Real Plaza Trujillo (5 locales)
  { id: 'tru-101', codigo_local: 'TRU-101', nombre_comercial: 'PLAZA VEA TRUJILLO', categoria: 'Supermercados', estado: 'arrendado', area_m2: 4200.0, precio_alquiler_mensual: 28000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en Trujillo.', centro_comercial_id: 'real-plaza-trujillo', centro_comercial_nombre: 'Real Plaza Trujillo' },
  { id: 'tru-102', codigo_local: 'TRU-102', nombre_comercial: 'OECHSLE TRUJILLO', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 3200.0, precio_alquiler_mensual: 22000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla en La Libertad.', centro_comercial_id: 'real-plaza-trujillo', centro_comercial_nombre: 'Real Plaza Trujillo' },
  { id: 'tru-103', codigo_local: 'TRU-103', nombre_comercial: 'PROMART TRUJILLO', categoria: 'Mejoramiento del Hogar', estado: 'arrendado', area_m2: 4800.0, precio_alquiler_mensual: 27000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Artículos de ferretería y hogar.', centro_comercial_id: 'real-plaza-trujillo', centro_comercial_nombre: 'Real Plaza Trujillo' },
  { id: 'tru-104', codigo_local: 'TRU-104', nombre_comercial: 'Disponible', categoria: 'Calzado y Moda', estado: 'disponible', area_m2: 70.0, precio_alquiler_mensual: 2200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Espacio comercial en pasarela principal.', centro_comercial_id: 'real-plaza-trujillo', centro_comercial_nombre: 'Real Plaza Trujillo' },
  { id: 'tru-105', codigo_local: 'TRU-105', nombre_comercial: 'Disponible', categoria: 'Servicios', estado: 'disponible', area_m2: 85.0, precio_alquiler_mensual: 2600.0, moneda: 'USD', piso_nivel: 'Nivel 2', descripcion: 'Local disponible para servicios bancarios o seguros.', centro_comercial_id: 'real-plaza-trujillo', centro_comercial_nombre: 'Real Plaza Trujillo' },

  // 6. Real Plaza Chiclayo (4 locales)
  { id: 'chx-101', codigo_local: 'CHX-101', nombre_comercial: 'METRO CHICLAYO', categoria: 'Supermercados', estado: 'arrendado', area_m2: 3800.0, precio_alquiler_mensual: 24000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en Lambayeque.', centro_comercial_id: 'real-plaza-chiclayo', centro_comercial_nombre: 'Real Plaza Chiclayo' },
  { id: 'chx-102', codigo_local: 'CHX-102', nombre_comercial: 'OECHSLE CHICLAYO', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 2900.0, precio_alquiler_mensual: 19000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla de ropa y hogar.', centro_comercial_id: 'real-plaza-chiclayo', centro_comercial_nombre: 'Real Plaza Chiclayo' },
  { id: 'chx-103', codigo_local: 'CHX-103', nombre_comercial: 'TOPITOP CHICLAYO', categoria: 'Moda', estado: 'arrendado', area_m2: 180.0, precio_alquiler_mensual: 4200.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Moda nacional de alta demanda.', centro_comercial_id: 'real-plaza-chiclayo', centro_comercial_nombre: 'Real Plaza Chiclayo' },
  { id: 'chx-104', codigo_local: 'CHX-104', nombre_comercial: 'Disponible', categoria: 'Comercio', estado: 'disponible', area_m2: 60.0, precio_alquiler_mensual: 1800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local disponible para tienda o accesorios.', centro_comercial_id: 'real-plaza-chiclayo', centro_comercial_nombre: 'Real Plaza Chiclayo' },

  // 7. Open Plaza Piura (4 locales)
  { id: 'piu-101', codigo_local: 'PIU-101', nombre_comercial: 'TOTTUS PIURA', categoria: 'Supermercados', estado: 'arrendado', area_m2: 4500.0, precio_alquiler_mensual: 28000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado líder en Piura.', centro_comercial_id: 'open-plaza-piura', centro_comercial_nombre: 'Open Plaza Piura' },
  { id: 'piu-102', codigo_local: 'PIU-102', nombre_comercial: 'SODIMAC PIURA', categoria: 'Hogar y Construcción', estado: 'arrendado', area_m2: 4900.0, precio_alquiler_mensual: 29000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda de mejoramiento del hogar.', centro_comercial_id: 'open-plaza-piura', centro_comercial_nombre: 'Open Plaza Piura' },
  { id: 'piu-103', codigo_local: 'PIU-103', nombre_comercial: 'SAGA FALABELLA PIURA', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 3600.0, precio_alquiler_mensual: 24000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla en Castilla, Piura.', centro_comercial_id: 'open-plaza-piura', centro_comercial_nombre: 'Open Plaza Piura' },
  { id: 'piu-104', codigo_local: 'PIU-104', nombre_comercial: 'Disponible', categoria: 'Retail', estado: 'disponible', area_m2: 75.0, precio_alquiler_mensual: 2300.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Excelente ubicación junto al patio de comidas.', centro_comercial_id: 'open-plaza-piura', centro_comercial_nombre: 'Open Plaza Piura' },

  // 8. Real Plaza Cusco (4 locales)
  { id: 'cuz-101', codigo_local: 'CUZ-101', nombre_comercial: 'PLAZA VEA CUSCO', categoria: 'Supermercados', estado: 'arrendado', area_m2: 4000.0, precio_alquiler_mensual: 26000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en la ciudad imperial.', centro_comercial_id: 'real-plaza-cusco', centro_comercial_nombre: 'Real Plaza Cusco' },
  { id: 'cuz-102', codigo_local: 'CUZ-102', nombre_comercial: 'OECHSLE CUSCO', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 2800.0, precio_alquiler_mensual: 19000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda departamental en Cusco.', centro_comercial_id: 'real-plaza-cusco', centro_comercial_nombre: 'Real Plaza Cusco' },
  { id: 'cuz-103', codigo_local: 'CUZ-103', nombre_comercial: 'PROMART CUSCO', categoria: 'Mejoramiento del Hogar', estado: 'arrendado', area_m2: 4100.0, precio_alquiler_mensual: 25000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Materiales y mejoras para el hogar.', centro_comercial_id: 'real-plaza-cusco', centro_comercial_nombre: 'Real Plaza Cusco' },
  { id: 'cuz-104', codigo_local: 'CUZ-104', nombre_comercial: 'Disponible', categoria: 'Artesanía y Moda', estado: 'disponible', area_m2: 50.0, precio_alquiler_mensual: 1900.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local ideal para textilería o artesanía cusqueña.', centro_comercial_id: 'real-plaza-cusco', centro_comercial_nombre: 'Real Plaza Cusco' },

  // 9. Real Plaza Huancayo (3 locales)
  { id: 'hyo-101', codigo_local: 'HYO-101', nombre_comercial: 'PLAZA VEA HUANCAYO', categoria: 'Supermercados', estado: 'arrendado', area_m2: 3900.0, precio_alquiler_mensual: 25000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en el valle del Mantaro.', centro_comercial_id: 'real-plaza-huancayo', centro_comercial_nombre: 'Real Plaza Huancayo' },
  { id: 'hyo-102', codigo_local: 'HYO-102', nombre_comercial: 'OECHSLE HUANCAYO', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 2700.0, precio_alquiler_mensual: 18000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda ancla en Junín.', centro_comercial_id: 'real-plaza-huancayo', centro_comercial_nombre: 'Real Plaza Huancayo' },
  { id: 'hyo-103', codigo_local: 'HYO-103', nombre_comercial: 'Disponible', categoria: 'Retail', estado: 'disponible', area_m2: 65.0, precio_alquiler_mensual: 1800.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local comercial en pasillo central.', centro_comercial_id: 'real-plaza-huancayo', centro_comercial_nombre: 'Real Plaza Huancayo' },

  // 10. El Quinde Ica (3 locales)
  { id: 'ica-101', codigo_local: 'ICA-101', nombre_comercial: 'METRO ICA', categoria: 'Supermercados', estado: 'arrendado', area_m2: 3600.0, precio_alquiler_mensual: 22000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en Ica.', centro_comercial_id: 'el-quinde-ica', centro_comercial_nombre: 'El Quinde Ica' },
  { id: 'ica-102', codigo_local: 'ICA-102', nombre_comercial: 'FALABELLA ICA', categoria: 'Tiendas por Departamento', estado: 'arrendado', area_m2: 3200.0, precio_alquiler_mensual: 21000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Tienda departamental en Ica.', centro_comercial_id: 'el-quinde-ica', centro_comercial_nombre: 'El Quinde Ica' },
  { id: 'ica-103', codigo_local: 'ICA-103', nombre_comercial: 'Disponible', categoria: 'Comercio', estado: 'disponible', area_m2: 55.0, precio_alquiler_mensual: 1700.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local comercial en zona comercial activa.', centro_comercial_id: 'el-quinde-ica', centro_comercial_nombre: 'El Quinde Ica' },

  // 11. Mall Plaza Tacna (3 locales)
  { id: 'tac-101', codigo_local: 'TAC-101', nombre_comercial: 'TOTTUS TACNA', categoria: 'Supermercados', estado: 'arrendado', area_m2: 3800.0, precio_alquiler_mensual: 23000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Hipermercado en la frontera sur.', centro_comercial_id: 'mall-plaza-tacna', centro_comercial_nombre: 'Mall Plaza Tacna' },
  { id: 'tac-102', codigo_local: 'TAC-102', nombre_comercial: 'SODIMAC TACNA', categoria: 'Mejoramiento del Hogar', estado: 'arrendado', area_m2: 4200.0, precio_alquiler_mensual: 25000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Centro de bricolaje y construcción.', centro_comercial_id: 'mall-plaza-tacna', centro_comercial_nombre: 'Mall Plaza Tacna' },
  { id: 'tac-103', codigo_local: 'TAC-103', nombre_comercial: 'Disponible', categoria: 'Comercio Internacional', estado: 'disponible', area_m2: 70.0, precio_alquiler_mensual: 2000.0, moneda: 'USD', piso_nivel: 'Nivel 1', descripcion: 'Local disponible de alta afluencia transfronteriza.', centro_comercial_id: 'mall-plaza-tacna', centro_comercial_nombre: 'Mall Plaza Tacna' },
];

// Fallback tickets
export const FALLBACK_TICKETS: Ticket[] = [
  {
    id: 'tck-001',
    codigo_ticket: 'TCK-001',
    centro_comercial_id: 'plaza-center-villa-el-salvador',
    local_id: 'loc-coolbox',
    titulo: 'Reubicación de mampara frontal Coolbox',
    descripcion: 'El arrendatario requiere desplazar 0.5m el ingreso por diseño de escaparate.',
    tipo: 'modificacion_plano',
    prioridad: 'alta',
    estado: 'abierto',
    creado_por: 'comercial',
    creado_en: '2026-09-06T10:30:00Z',
    centro_comercial_nombre: 'Plaza Center Villa El Salvador',
    codigo_local: 'LCE-103',
  },
  {
    id: 'tck-002',
    codigo_ticket: 'TCK-002',
    centro_comercial_id: 'plaza-center-villa-el-salvador',
    local_id: 'loc-disponible-104',
    titulo: 'Factibilidad de división local LCE-104 en 2 islas',
    descripcion: 'Evaluación arquitectónica para dividir el área de 42m² en 2 módulos de 21m².',
    tipo: 'division_local',
    prioridad: 'media',
    estado: 'en_progreso',
    creado_por: 'comercial',
    asignado_a: 'proyectos',
    creado_en: '2026-09-07T08:15:00Z',
    centro_comercial_nombre: 'Plaza Center Villa El Salvador',
    codigo_local: 'LCE-104',
  },
  {
    id: 'tck-003',
    codigo_ticket: 'TCK-003',
    centro_comercial_id: 'plaza-center-villa-el-salvador',
    local_id: 'loc-bitel',
    titulo: 'Revisión técnica de ducto de aire acondicionado',
    descripcion: 'Mantenimiento preventivo y validación de empalme con la red general del mall.',
    tipo: 'mantenimiento',
    prioridad: 'baja',
    estado: 'resuelto',
    creado_por: 'proyectos',
    asignado_a: 'proyectos',
    notas_resolucion: 'Inspección técnica completada. Conexión de ducto de 6 pulgadas aprobada conforme a planos.',
    resuelto_en: '2026-09-07T14:00:00Z',
    creado_en: '2026-09-05T09:00:00Z',
    centro_comercial_nombre: 'Plaza Center Villa El Salvador',
    codigo_local: 'LCE-105',
  },
];

// 1. Fetch Malls
export async function fetchCentrosComerciales(): Promise<CentroComercial[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/centros-comerciales/`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'comercial',
      },
    }, 2500);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_MALLS;
  } catch (err) {
    console.warn('API connection fallback for Centros Comerciales:', err);
    return FALLBACK_MALLS;
  }
}

// 2. Fetch Mall by ID
export async function fetchCentroComercialById(id: string): Promise<CentroComercial | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/centros-comerciales/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'comercial',
      },
    }, 2500);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API fallback for Mall ID ${id}:`, err);
    const found = FALLBACK_MALLS.find((m) => m.id === id || m.slug === id);
    return found || FALLBACK_MALLS[0];
  }
}

// 3. Fetch Commercial Units
export async function fetchCommercialUnits(
  centroComercialId?: string,
  centroComercialSlug?: string
): Promise<LocalComercial[]> {
  try {
    const idToSearch = centroComercialId || centroComercialSlug;
    const url = idToSearch
      ? `${API_BASE_URL}/locales/?centro_comercial_id=${encodeURIComponent(idToSearch)}`
      : `${API_BASE_URL}/locales/`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'comercial',
      },
      cache: 'no-store',
    }, 2500);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      if (idToSearch) {
        return data.filter(
          (l) =>
            l.centro_comercial_id === centroComercialId ||
            (centroComercialSlug && l.centro_comercial_id === centroComercialSlug)
        );
      }
      return data;
    }
  } catch (err) {
    console.warn('API connection fallback for locales:', err);
  }
  if (centroComercialId || centroComercialSlug) {
    return FALLBACK_LOCALES.filter(
      (l) =>
        l.centro_comercial_id === centroComercialId ||
        (centroComercialSlug && l.centro_comercial_id === centroComercialSlug) ||
        (centroComercialId && l.centro_comercial_nombre?.toLowerCase() === centroComercialId.toLowerCase())
    );
  }
  return FALLBACK_LOCALES;
}

// 4. Fetch Local by ID
export async function fetchLocalById(id: string): Promise<LocalComercial | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/locales/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'comercial',
      },
      cache: 'no-store',
    }, 2500);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API fallback for Local ${id}:`, err);
    const found = FALLBACK_LOCALES.find((l) => l.id === id || l.codigo_local === id);
    return (
      found || {
        id,
        codigo_local: id.toUpperCase(),
        nombre_comercial: 'Local Comercial',
        categoria: 'Comercio General',
        estado: 'disponible',
        area_m2: 45.0,
        precio_alquiler_mensual: 1800.0,
        moneda: 'USD',
        piso_nivel: 'Nivel 1',
        descripcion: 'Local comercial en galería principal.',
      }
    );
  }
}

// 5. Update Commercial Terms of a Local
export async function updateLocal(
  id: string,
  data: Partial<LocalComercial>,
  role: UserRole = 'comercial'
): Promise<LocalComercial | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/locales/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`API fallback updating local ${id}:`, err);
    // Simulate optimistic local update
    const current = FALLBACK_LOCALES.find((l) => l.id === id) || FALLBACK_LOCALES[0];
    return { ...current, ...data };
  }
}

// 6. Fetch Blueprint Polygons
export async function fetchBlueprintPolygons(planoId: string): Promise<PoligonoBlueprint[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/poligonos?plano_id=${planoId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'comercial',
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API connection fallback for polygons:', err);
    return [];
  }
}

// 7. Save Polygon (Requires role 'proyectos')
export async function savePolygonApi(
  polygonData: Partial<PoligonoBlueprint>,
  role: UserRole = 'proyectos'
): Promise<PoligonoBlueprint | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/poligonos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(polygonData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('API fallback saving polygon:', err);
    return {
      id: 'poly-' + Date.now(),
      local_id: polygonData.local_id || 'loc-temp',
      plano_id: polygonData.plano_id || 'plano-ves-nivel1',
      coordenadas_relativas: polygonData.coordenadas_relativas || [],
      color_relleno: polygonData.color_relleno || 'rgba(59, 130, 246, 0.4)',
      color_borde: polygonData.color_borde || '#2563eb',
      etiqueta: polygonData.etiqueta,
    };
  }
}

// Update Polygon (Requires role 'proyectos')
export async function updatePolygonApi(
  polygonId: string,
  polygonData: Partial<PoligonoBlueprint>,
  role: UserRole = 'proyectos'
): Promise<PoligonoBlueprint | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/poligonos/${polygonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(polygonData),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API fallback updating polygon:', err);
    return null;
  }
}

// Delete Polygon (Requires role 'proyectos')
export async function deletePolygonApi(
  polygonId: string,
  role: UserRole = 'proyectos'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/poligonos/${polygonId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('API fallback deleting polygon:', err);
    return false;
  }
}

// Upload blueprint PDF. The FastAPI backend stores it (works with the static
// export used in production); the local Next route is only a dev fallback.
// Returns null when neither is reachable so callers can fall back to a blob URL.
export async function uploadBlueprintPdf(file: File, slug?: string): Promise<string | null> {
  const buildForm = () => {
    const formData = new FormData();
    formData.append('file', file);
    if (slug) formData.append('slug', slug);
    return formData;
  };
  const endpoints = [`${API_BASE_URL}/planos/upload`, '/api/upload-blueprint'];
  for (const url of endpoints) {
    try {
      const res = await fetchWithTimeout(url, { method: 'POST', body: buildForm() }, 20000);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.url) return data.url as string;
    } catch (err) {
      console.warn(`Blueprint upload notice (${url}):`, err);
    }
  }
  return null;
}

// 8. Fetch Tickets
export async function fetchTickets(
  centroComercialId?: string,
  estado?: string
): Promise<Ticket[]> {
  try {
    let url = `${API_BASE_URL}/tickets`;
    const params = new URLSearchParams();
    if (centroComercialId) params.append('centro_comercial_id', centroComercialId);
    if (estado) params.append('estado', estado);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_TICKETS;
  } catch (err) {
    console.warn('API connection fallback for tickets:', err);
    let filtered = [...FALLBACK_TICKETS];
    if (centroComercialId) {
      filtered = filtered.filter((t) => t.centro_comercial_id === centroComercialId);
    }
    if (estado && estado !== 'todos') {
      filtered = filtered.filter((t) => t.estado === estado);
    }
    return filtered;
  }
}

// 9. Create Ticket (Allowed for both 'comercial' and 'proyectos')
export async function createTicket(
  ticketData: TicketCreate,
  role: UserRole = 'comercial'
): Promise<Ticket | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify({
        ...ticketData,
        creado_por: role,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('API fallback creating ticket:', err);
    const newTicket: Ticket = {
      id: 'tck-' + Date.now(),
      codigo_ticket: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      centro_comercial_id: ticketData.centro_comercial_id,
      local_id: ticketData.local_id,
      titulo: ticketData.titulo,
      descripcion: ticketData.descripcion,
      tipo: ticketData.tipo,
      prioridad: ticketData.prioridad,
      estado: 'abierto',
      creado_por: role,
      creado_en: new Date().toISOString(),
    };
    FALLBACK_TICKETS.unshift(newTicket);
    return newTicket;
  }
}

// 10. Resolve Ticket (Requires role 'proyectos' - 403 Forbidden for 'comercial')
export async function resolveTicket(
  ticketId: string,
  resolutionData: TicketResolve,
  role: UserRole = 'proyectos'
): Promise<Ticket | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role,
      },
      body: JSON.stringify(resolutionData),
    });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Acceso denegado (403): Solo el Área de Proyectos puede resolver requerimientos técnicos.');
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    if (role === 'comercial') {
      throw new Error('Acceso denegado: Se requiere rol proyectos para resolver requerimientos.');
    }
    console.warn(`API fallback resolving ticket ${ticketId}:`, err);
    const idx = FALLBACK_TICKETS.findIndex((t) => t.id === ticketId);
    if (idx >= 0) {
      FALLBACK_TICKETS[idx] = {
        ...FALLBACK_TICKETS[idx],
        estado: 'resuelto',
        notas_resolucion: resolutionData.notas_resolucion,
        resuelto_en: new Date().toISOString(),
        asignado_a: 'proyectos',
      };
      return FALLBACK_TICKETS[idx];
    }
    return null;
  }
}
