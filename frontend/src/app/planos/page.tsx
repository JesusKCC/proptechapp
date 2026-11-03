'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { LocalComercial, CentroComercial } from '../../types';
import { useRole } from '../../context/RoleContext';
import { AppNavbar } from '../../components/navbar/AppNavbar';
import { FichaLocalModal } from '../../components/locales/FichaLocalModal';
import { AddBlueprintModal } from '../../components/pdf-viewer/AddBlueprintModal';
import {
  fetchCentrosComerciales,
  fetchCommercialUnits,
  fetchLocalById,
  FALLBACK_MALLS,
  FALLBACK_LOCALES,
  DEFAULT_PLANO_PATH,
} from '../../lib/api';
import {
  Building2,
  MapPin,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase,
  Ruler,
} from '../../components/common/Icons';

// Dynamic import with SSR false for react-pdf blueprint viewer
const PdfBlueprintViewer = dynamic(
  () =>
    import('../../components/pdf-viewer/PdfBlueprintViewer').then(
      (mod) => mod.PdfBlueprintViewer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[550px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-800">
          Inicializando Visor Arquitectónico Vectorial...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Cargando motor homotético y capas relativas SVG [0..1]²
        </p>
      </div>
    ),
  }
);

interface BlueprintFloor {
  id: string;
  nombre_piso: string;
  archivo_pdf_url: string;
}

function PlanosContent() {
  const searchParams = useSearchParams();
  const mallIdParam = searchParams.get('mall_id');
  const localIdParam = searchParams.get('local_id') || searchParams.get('local_code');

  const { role, isProyectos, isComercial } = useRole();

  const [malls, setMalls] = useState<CentroComercial[]>(FALLBACK_MALLS);
  const [selectedMall, setSelectedMall] = useState<CentroComercial>(FALLBACK_MALLS[0]);
  const [locales, setLocales] = useState<LocalComercial[]>(FALLBACK_LOCALES);
  const [selectedLocal, setSelectedLocal] = useState<LocalComercial | null>(null);
  const [isFichaOpen, setIsFichaOpen] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState('');

  // Multiple blueprints (floors/levels) per mall
  const [mallPlanos, setMallPlanos] = useState<BlueprintFloor[]>([]);
  const [selectedPlanoIndex, setSelectedPlanoIndex] = useState<number>(0);
  const [isAddBlueprintOpen, setIsAddBlueprintOpen] = useState<boolean>(false);

  // Default known PDF blueprints
  const MALLS_WITH_PLANO: Record<string, string> = {
    'plaza-center-villa-el-salvador': DEFAULT_PLANO_PATH,
    '8341cdb0-19c2-4c01-8938-cf59fdfe7aa1': DEFAULT_PLANO_PATH,
  };

  // 1. Load malls and set active mall based on query param
  useEffect(() => {
    async function loadMalls() {
      try {
        const data = await fetchCentrosComerciales();
        setMalls(data);
        if (mallIdParam) {
          const found = data.find((m) => m.id === mallIdParam || m.slug === mallIdParam);
          if (found) setSelectedMall(found);
        }
      } catch (err) {
        console.warn('Fallback loading malls in planos:', err);
      }
    }
    loadMalls();
  }, [mallIdParam]);

  // 2. Load and synchronize blueprints for selected mall
  useEffect(() => {
    const storageKey = `proptech_mall_planos_${selectedMall.id}`;
    let loadedPlanos: BlueprintFloor[] = [];

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedPlanos = parsed;
          }
        }
      } catch (err) {
        console.warn('Error reading saved blueprints:', err);
      }
    }

    if (loadedPlanos.length === 0) {
      const defaultUrl =
        selectedMall.plano_url ||
        MALLS_WITH_PLANO[selectedMall.id] ||
        MALLS_WITH_PLANO[selectedMall.slug] ||
        null;

      if (defaultUrl) {
        loadedPlanos = [
          {
            id: `plano-${selectedMall.id}-nivel1`,
            nombre_piso: 'Nivel 1 (Plano PACITA VES)',
            archivo_pdf_url: defaultUrl,
          },
        ];
      }
    }

    setMallPlanos(loadedPlanos);
    setSelectedPlanoIndex(0);
  }, [selectedMall.id, selectedMall.slug, selectedMall.plano_url]);

  // Handle adding new blueprint
  const handleBlueprintAdded = (newEntry: BlueprintFloor) => {
    setMallPlanos((prev) => {
      const updated = [...prev, newEntry];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`proptech_mall_planos_${selectedMall.id}`, JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedPlanoIndex(mallPlanos.length);
  };

  // 3. Load locales for active mall — strictly filtered
  useEffect(() => {
    setSelectedLocal(null);
    setIsFichaOpen(false);
    setLocalSearch('');

    async function loadUnits() {
      try {
        const units = await fetchCommercialUnits(selectedMall.id, selectedMall.slug);
        const activeUnits = units.length > 0 ? units : [];
        setLocales(activeUnits);

        // If localIdParam was passed in URL, auto-select it immediately
        if (localIdParam) {
          const found = activeUnits.find(
            (l) =>
              l.id === localIdParam ||
              l.codigo_local.toUpperCase() === localIdParam.toUpperCase()
          );
          if (found) {
            setSelectedLocal(found);
            setIsFichaOpen(true);
          }
        }
      } catch (err) {
        setLocales([]);
      }
    }
    loadUnits();
  }, [selectedMall.id, selectedMall.slug, localIdParam]);

  // Handle selection of a local (from polygon click or list)
  const handleSelectLocal = async (localId: string) => {
    const found = locales.find(
      (l) =>
        l.id === localId ||
        l.codigo_local === localId ||
        l.codigo_local.toUpperCase() === localId.toUpperCase()
    );

    if (found) {
      setSelectedLocal(found);
      setIsFichaOpen(true);
    } else {
      try {
        const fetched = await fetchLocalById(localId);
        if (fetched) {
          setSelectedLocal(fetched);
          setIsFichaOpen(true);
        }
      } catch (err) {
        console.warn('Could not fetch local:', err);
      }
    }
  };

  // Update local after edit in FichaLocalModal
  const handleLocalUpdated = (updated: LocalComercial) => {
    setLocales((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLocal(updated);
  };

  // Strict filtering: only commercial units belonging to the active mall
  const filteredLocales = locales.filter((l) => {
    const isOfSelectedMall =
      l.centro_comercial_id === selectedMall.id ||
      l.centro_comercial_id === selectedMall.slug ||
      (l.centro_comercial_nombre &&
        l.centro_comercial_nombre.toLowerCase() === selectedMall.nombre.toLowerCase());

    if (!isOfSelectedMall) return false;

    const term = localSearch.toLowerCase();
    return (
      !term ||
      l.codigo_local.toLowerCase().includes(term) ||
      (l.nombre_comercial && l.nombre_comercial.toLowerCase().includes(term)) ||
      l.categoria.toLowerCase().includes(term)
    );
  });

  const currentPlano = mallPlanos[selectedPlanoIndex] || null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <AppNavbar />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Mall & Blueprint Info Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedMall.nombre}
                </h1>
                {currentPlano ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {currentPlano.nombre_piso}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Sin Plano Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {selectedMall.direccion} • {selectedMall.departamento} • {selectedMall.total_locales}{' '}
                locales totales
              </p>
            </div>
          </div>

          {/* Level Switcher (if multiple blueprints exist) & Mall Selector & Add Blueprint */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {mallPlanos.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {mallPlanos.map((plano, idx) => (
                  <button
                    key={plano.id || idx}
                    type="button"
                    onClick={() => setSelectedPlanoIndex(idx)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedPlanoIndex === idx
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {plano.nombre_piso}
                  </button>
                ))}
              </div>
            )}

            {isProyectos && (
              <button
                type="button"
                onClick={() => setIsAddBlueprintOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span className="text-sm font-black leading-none">+</span>
                <span>Agregar Plano</span>
              </button>
            )}

            {/* Mall Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline whitespace-nowrap">
                Cambiar Mall:
              </span>
              <select
                value={selectedMall.id}
                onChange={(e) => {
                  const found = malls.find((m) => m.id === e.target.value);
                  if (found) setSelectedMall(found);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-auto"
              >
                {malls.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.departamento})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Work Area: Blueprint Canvas + Side Unit Directory */}
        <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}>
          {/* Blueprint Viewer Container — takes remaining space */}
          <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 shadow-sm bg-white" style={{ minWidth: 0 }}>
            {currentPlano ? (
              <PdfBlueprintViewer
                key={`${selectedMall.id}-${currentPlano.id}`}
                pdfUrl={currentPlano.archivo_pdf_url}
                userRole={role}
                onSelectLocal={handleSelectLocal}
                selectedLocalId={selectedLocal?.id}
                availableLocales={filteredLocales}
                blueprintInfo={{
                  id: currentPlano.id,
                  centro_comercial_id: selectedMall.id,
                  nombre_piso: `${selectedMall.nombre} - ${currentPlano.nombre_piso}`,
                  ancho_unscaled_pt: 2384,
                  alto_unscaled_pt: 1684,
                }}
              />
            ) : (
              /* Pending state for malls without uploaded floor plans */
              <div className="h-full flex flex-col items-center justify-center gap-5 p-10 text-center bg-slate-50">
                <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center">
                  <Layers size={36} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Plano Pendiente de Información</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    El plano arquitectónico de <strong>{selectedMall.nombre}</strong> aún no ha sido cargado al sistema.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {isProyectos
                      ? 'Haz clic en "+ Agregar Plano" en la barra superior para subir el PDF de este nivel.'
                      : 'El Área de Proyectos puede subir el PDF correspondiente para habilitarlo.'}
                  </p>
                </div>
                {isProyectos ? (
                  <button
                    type="button"
                    onClick={() => setIsAddBlueprintOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                  >
                    <span className="text-sm font-black leading-none">+</span>
                    <span>Subir Plano Ahora</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <AlertCircle size={14} />
                    <span>Plano no disponible — En espera de carga</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Directory of Commercial Units — fixed width, full height */}
          <aside className="w-full lg:w-80 flex-shrink-0 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Locales Comerciales ({filteredLocales.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredLocales.filter((l) => l.estado === 'arrendado').length} Arrendados
                </span>
              </div>

              {/* Search input for units */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar código o marca..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Scrollable Unit List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredLocales.length === 0 ? (
                  <div className="py-10 px-3 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Building2 size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {localSearch
                        ? 'Sin resultados de búsqueda'
                        : 'Sin locales registrados'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                      {localSearch
                        ? 'Intenta con otro código o nombre de marca.'
                        : `No hay locales comerciales para ${selectedMall.nombre}.`}
                    </p>
                  </div>
                ) : (
                  filteredLocales.map((unit) => {
                    const isSelected = selectedLocal?.id === unit.id;

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => handleSelectLocal(unit.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400/40'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-xs text-slate-900">
                              {unit.codigo_local}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                                unit.estado === 'disponible'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : unit.estado === 'arrendado'
                                  ? 'bg-blue-100 text-blue-800'
                                  : unit.estado === 'reservado'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {unit.estado}
                            </span>
                          </div>
                          <span className="block text-[11px] font-medium text-slate-600 truncate max-w-[140px] mt-0.5">
                            {unit.nombre_comercial || 'Sin asignar'}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="block font-mono text-[11px] font-bold text-slate-800">
                            {unit.area_m2} m²
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            ${unit.precio_alquiler_mensual}/m
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar Footer Info */}
            <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className={isProyectos ? 'text-emerald-500' : 'text-blue-500'} />
                <span>
                  {isProyectos
                    ? 'Modo Proyectos: Trazo y edición de polígonos activo'
                    : 'Modo Comercial: Clic en polígonos abre ficha'}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Floor Blueprints Gallery & Level Switcher (Visible to COMERCIAL and PROYECTOS) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>Planos Arquitectónicos y Niveles ({mallPlanos.length})</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    {selectedMall.nombre}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualización y conmutación de planos de nivel para usuarios Comercial y Proyectos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddBlueprintOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <span className="text-base font-black leading-none">+</span>
              <span>Cargar Nuevo Plano (PDF)</span>
            </button>
          </div>

          {/* Blueprint Floor Cards Grid */}
          {mallPlanos.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
              <Layers size={28} className="text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">No hay planos cargados para este centro comercial</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Haz clic en &ldquo;Cargar Nuevo Plano (PDF)&rdquo; para subir el primer plano arquitectónico.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mallPlanos.map((plano, idx) => {
                const isActive = selectedPlanoIndex === idx;
                return (
                  <button
                    key={plano.id || idx}
                    type="button"
                    onClick={() => setSelectedPlanoIndex(idx)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/25 shadow-sm'
                        : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {plano.nombre_piso}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                          {isActive ? '● Plano en pantalla' : 'Clic para visualizar'}
                        </span>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-extrabold uppercase flex-shrink-0">
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">→</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Ficha del Local Interactive Drawer Modal */}
      <FichaLocalModal
        isOpen={isFichaOpen}
        local={selectedLocal}
        onClose={() => setIsFichaOpen(false)}
        onLocalUpdated={handleLocalUpdated}
        mallName={selectedMall.nombre}
      />

      {/* Add Blueprint Modal for Proyectos */}
      <AddBlueprintModal
        isOpen={isAddBlueprintOpen}
        mallName={selectedMall.nombre}
        mallSlug={selectedMall.slug}
        onClose={() => setIsAddBlueprintOpen(false)}
        onBlueprintAdded={handleBlueprintAdded}
      />
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PlanosContent />
    </Suspense>
  );
}
