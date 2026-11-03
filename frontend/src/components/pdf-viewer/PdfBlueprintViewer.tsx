'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DEFAULT_PLANO_PATH, pdfSource } from '../../lib/api';
import { PoligonoBlueprint, LocalComercial, UserRole, BlueprintInfo } from '../../types';
import { RelativePoint } from '../../lib/coordinateMath';
import { ZoomControls } from './ZoomControls';
import { PolygonOverlay } from './PolygonOverlay';
import { UnitAssociationModal } from './UnitAssociationModal';
import { EditPolygonModal } from './EditPolygonModal';

// Setup pdf.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfBlueprintViewerProps {
  pdfUrl?: string;
  blueprintInfo?: Partial<BlueprintInfo>;
  initialPolygons?: PoligonoBlueprint[];
  availableLocales?: LocalComercial[];
  userRole?: UserRole;
  onSelectLocal?: (localId: string) => void;
  onSavePolygon?: (polygonData: {
    coordenadas_relativas: RelativePoint[];
    local_id?: string;
    codigo_local: string;
    nombre_comercial?: string;
    categoria?: string;
    area_m2?: number;
    color_relleno?: string;
  }) => Promise<void> | void;
  selectedLocalId?: string | null;
}

// Sample authentic polygons from Plaza Center Villa El Salvador
const DEFAULT_AUTHENTIC_POLYGONS: PoligonoBlueprint[] = [
  {
    id: 'poly-ves-103',
    local_id: 'local-103',
    plano_id: 'plano-ves-1',
    etiqueta: 'LCE-103',
    color_relleno: '#3B82F6',
    color_borde: '#1D4ED8',
    opacidad: 0.4,
    coordenadas_relativas: [
      { x: 0.7383, y: 0.4970 },
      { x: 0.7383, y: 0.5258 },
      { x: 0.7659, y: 0.5258 },
      { x: 0.7659, y: 0.4970 },
    ],
    local: {
      id: 'local-103',
      codigo_local: 'LCE-103',
      nombre_comercial: 'COOLBOX',
      categoria: 'Tecnología',
      estado: 'disponible',
      area_m2: 29.70,
      precio_alquiler_mensual: 1500,
      moneda: 'USD',
      piso_nivel: 'Nivel 1',
    },
  },
  {
    id: 'poly-ves-105',
    local_id: 'local-105',
    plano_id: 'plano-ves-1',
    etiqueta: 'LCE-105',
    color_relleno: '#3B82F6',
    color_borde: '#1D4ED8',
    opacidad: 0.4,
    coordenadas_relativas: [
      { x: 0.6622, y: 0.4970 },
      { x: 0.6622, y: 0.5517 },
      { x: 0.7143, y: 0.5517 },
      { x: 0.7143, y: 0.4970 },
    ],
    local: {
      id: 'local-105',
      codigo_local: 'LCE-105',
      nombre_comercial: 'BITEL',
      categoria: 'Telecomunicaciones',
      estado: 'arrendado',
      area_m2: 98.10,
      precio_alquiler_mensual: 3200,
      moneda: 'USD',
      piso_nivel: 'Nivel 1',
    },
  },
  {
    id: 'poly-ves-104',
    local_id: 'local-104',
    plano_id: 'plano-ves-1',
    etiqueta: 'LCE-104',
    color_relleno: '#10B981',
    color_borde: '#047857',
    opacidad: 0.4,
    coordenadas_relativas: [
      { x: 0.7167, y: 0.4967 },
      { x: 0.7167, y: 0.5523 },
      { x: 0.7361, y: 0.5523 },
      { x: 0.7361, y: 0.4967 },
    ],
    local: {
      id: 'local-104',
      codigo_local: 'LCE-104',
      nombre_comercial: 'TINKA',
      categoria: 'Entretenimiento',
      estado: 'disponible',
      area_m2: 39.00,
      precio_alquiler_mensual: 1800,
      moneda: 'USD',
      piso_nivel: 'Nivel 1',
    },
  },
  {
    id: 'poly-ves-101',
    local_id: 'local-101',
    plano_id: 'plano-ves-1',
    etiqueta: 'LCE-101/102',
    color_relleno: '#10B981',
    color_borde: '#047857',
    opacidad: 0.45,
    coordenadas_relativas: [
      { x: 0.7775, y: 0.4970 },
      { x: 0.7775, y: 0.5110 },
      { x: 0.7757, y: 0.5110 },
      { x: 0.7757, y: 0.5526 },
      { x: 0.8667, y: 0.5526 },
      { x: 0.8667, y: 0.4970 },
    ],
    local: {
      id: 'local-101',
      codigo_local: 'LCE-101/LCE-102',
      nombre_comercial: 'STARBUCKS COFFEE',
      categoria: 'Gastronomía',
      estado: 'arrendado',
      area_m2: 158.03,
      precio_alquiler_mensual: 5500,
      moneda: 'USD',
      piso_nivel: 'Nivel 1',
    },
  },
];

export const PdfBlueprintViewer: React.FC<PdfBlueprintViewerProps> = ({
  pdfUrl = DEFAULT_PLANO_PATH,
  blueprintInfo,
  initialPolygons,
  availableLocales = [],
  userRole = 'comercial',
  onSelectLocal,
  onSavePolygon,
  selectedLocalId,
}) => {
  // Zoom & Viewer state
  const [zoom, setZoom] = useState<number>(0.4);
  const [minZoom, setMinZoom] = useState<number>(0.25);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnimatingButton, setIsAnimatingButton] = useState<boolean>(false);
  const transformRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 0.4 });
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const isSpacePressedRef = useRef<boolean>(false);
  const hasAutoFittedRef = useRef<boolean>(false);

  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [isDrawingInProgress, setIsDrawingInProgress] = useState<boolean>(false);
  const [polygons, setPolygons] = useState<PoligonoBlueprint[]>(
    initialPolygons && initialPolygons.length > 0 ? initialPolygons : DEFAULT_AUTHENTIC_POLYGONS
  );
  const [polygonToEdit, setPolygonToEdit] = useState<PoligonoBlueprint | null>(null);

  // Storage key for persistent polygons per mall/blueprint
  const storageKey = `proptech_polygons_${blueprintInfo?.id || 'default'}_${blueprintInfo?.centro_comercial_id || 'mall'}`;

  // Load persistent polygons from localStorage on mount or change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPolygons(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read polygons from localStorage:', e);
    }
    if (initialPolygons && initialPolygons.length > 0) {
      setPolygons(initialPolygons);
    } else {
      setPolygons(DEFAULT_AUTHENTIC_POLYGONS);
    }
  }, [storageKey, initialPolygons]);

  // Helper to persist polygon list to state and localStorage
  const persistPolygons = (newList: PoligonoBlueprint[]) => {
    setPolygons(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newList));
      } catch (e) {
        console.warn('Could not save polygons to localStorage:', e);
      }
    }
  };

  // PDF page metadata & dimensions
  const [pageWidth, setPageWidth] = useState<number>(2384);
  const [pageHeight, setPageHeight] = useState<number>(1684);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(true);

  // Unit association modal state
  const [draftPolygonToAssociate, setDraftPolygonToAssociate] = useState<RelativePoint[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-fit function: frames the blueprint cleanly within the available viewport
  // Sets minZoom to this exact 100% fit scale so the user cannot zoom out further than full view
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || pageWidth <= 0 || pageHeight <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const padding = 32;
    const availW = Math.max(rect.width - padding * 2, 200);
    const availH = Math.max(rect.height - padding * 2, 200);

    const scaleW = availW / pageWidth;
    const scaleH = availH / pageHeight;
    const fitScale = Math.min(scaleW, scaleH);

    const cleanZoom = Math.max(0.15, Math.min(3.0, +fitScale.toFixed(3)));
    setMinZoom(cleanZoom);

    const initialX = Math.round((rect.width - pageWidth * cleanZoom) / 2);
    const initialY = Math.round((rect.height - pageHeight * cleanZoom) / 2);

    transformRef.current = { x: initialX, y: initialY, zoom: cleanZoom };
    setIsAnimatingButton(true);
    setZoom(cleanZoom);
    setPan({ x: initialX, y: initialY });
    setTimeout(() => setIsAnimatingButton(false), 150);
  }, [pageWidth, pageHeight]);

  // Memoized so react-pdf does not reload the document on every render
  const pdfFile = useMemo(() => pdfSource(pdfUrl), [pdfUrl]);

  // Reset auto-fit flag when pdfUrl changes
  useEffect(() => {
    hasAutoFittedRef.current = false;
    setIsPdfLoading(true);
    setPdfLoadError(null);
  }, [pdfUrl]);

  // Handle PDF document load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsPdfLoading(false);
    setPdfLoadError(null);
  };

  // Handle PDF page load success (captures natural dimensions and auto-fits ONCE)
  const onPageLoadSuccess = (page: any) => {
    const originalWidth = page.originalWidth || 2384;
    const originalHeight = page.originalHeight || 1684;
    setPageWidth(originalWidth);
    setPageHeight(originalHeight);
    setIsPdfLoading(false);

    // Only auto-fit ONCE on initial document load so user zoom is never overridden
    if (!hasAutoFittedRef.current) {
      hasAutoFittedRef.current = true;
      setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const padding = 32;
            const availW = Math.max(rect.width - padding * 2, 200);
            const availH = Math.max(rect.height - padding * 2, 200);
            const fitScale = Math.min(availW / originalWidth, availH / originalHeight);
            const cleanZoom = Math.max(0.15, Math.min(3.0, +fitScale.toFixed(3)));
            setMinZoom(cleanZoom);
            const initialX = Math.round((rect.width - originalWidth * cleanZoom) / 2);
            const initialY = Math.round((rect.height - originalHeight * cleanZoom) / 2);
            transformRef.current = { x: initialX, y: initialY, zoom: cleanZoom };
            setZoom(cleanZoom);
            setPan({ x: initialX, y: initialY });
          }
        }
      }, 50);
    }
  };

  // Turn off drawing mode if user switches to 'comercial'
  useEffect(() => {
    if (userRole === 'comercial') {
      setDrawingMode(false);
      setIsDrawingInProgress(false);
    }
  }, [userRole]);

  // Spacebar pan listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        isSpacePressedRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Pan mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // In drawing mode, only drag if holding Space or Middle-click
    if (drawingMode && e.button === 0 && !isSpacePressedRef.current) {
      return;
    }

    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: transformRef.current.x,
        panY: transformRef.current.y,
      };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.panX + deltaX;
      const newY = dragStartRef.current.panY + deltaY;
      transformRef.current.x = newX;
      transformRef.current.y = newY;
      setPan({
        x: newX,
        y: newY,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Zoom toward center for toolbar buttons (+, -, presets)
  const handleZoomChangeWithCenter = (targetZoom: number) => {
    const cleanTarget = Math.max(minZoom, Math.min(3.5, targetZoom));
    if (!containerRef.current) {
      transformRef.current.zoom = cleanTarget;
      setZoom(cleanTarget);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const { x: curPanX, y: curPanY, zoom: curZoom } = transformRef.current;
    if (Math.abs(cleanTarget - curZoom) < 0.001) return;

    const ratio = cleanTarget / curZoom;
    const newPanX = Math.round(centerX - (centerX - curPanX) * ratio);
    const newPanY = Math.round(centerY - (centerY - curPanY) * ratio);

    transformRef.current = { x: newPanX, y: newPanY, zoom: cleanTarget };
    setIsAnimatingButton(true);
    setZoom(cleanTarget);
    setPan({ x: newPanX, y: newPanY });
    setTimeout(() => setIsAnimatingButton(false), 150);
  };

  // Wheel zoom toward the exact mouse cursor position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x: curPanX, y: curPanY, zoom: curZoom } = transformRef.current;
      const factor = Math.max(0.75, Math.min(1.35, Math.pow(2, -e.deltaY * 0.002)));
      const targetZoom = Math.max(minZoom, Math.min(3.5, +(curZoom * factor).toFixed(4)));
      if (Math.abs(targetZoom - curZoom) < 0.0001) return;

      const ratio = targetZoom / curZoom;
      const newPanX = mouseX - (mouseX - curPanX) * ratio;
      const newPanY = mouseY - (mouseY - curPanY) * ratio;

      transformRef.current = { x: newPanX, y: newPanY, zoom: targetZoom };
      setZoom(targetZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, [minZoom]);

  // Handle polygon drawing completion
  const handlePolygonDrawn = (newPolygon: RelativePoint[]) => {
    setDraftPolygonToAssociate(newPolygon);
    setIsModalOpen(true);
    setDrawingMode(false);
  };

  // Save associated polygon
  const handleConfirmAssociation = async (data: {
    codigo_local: string;
    nombre_comercial: string;
    categoria: string;
    estado: any;
    area_m2: number;
    color_relleno: string;
    existing_local_id?: string;
  }) => {
    if (!draftPolygonToAssociate) return;

    const newPolygonId = `poly-${Date.now()}`;
    const localId = data.existing_local_id || `loc-${Date.now()}`;

    const newPolyRecord: PoligonoBlueprint = {
      id: newPolygonId,
      local_id: localId,
      plano_id: blueprintInfo?.id || 'plano-ves-1',
      etiqueta: data.codigo_local,
      color_relleno: data.color_relleno,
      color_borde: '#1E40AF',
      opacidad: 0.45,
      coordenadas_relativas: draftPolygonToAssociate,
      local: {
        id: localId,
        codigo_local: data.codigo_local,
        nombre_comercial: data.nombre_comercial,
        categoria: data.categoria,
        estado: data.estado,
        area_m2: data.area_m2,
        precio_alquiler_mensual: 1000,
        moneda: 'USD',
        piso_nivel: blueprintInfo?.nombre_piso || 'Nivel 1',
      },
    };

    const updatedList = [...polygons, newPolyRecord];
    persistPolygons(updatedList);
    setIsModalOpen(false);
    setDraftPolygonToAssociate(null);

    if (onSavePolygon) {
      await onSavePolygon({
        coordenadas_relativas: draftPolygonToAssociate,
        local_id: localId,
        codigo_local: data.codigo_local,
        nombre_comercial: data.nombre_comercial,
        categoria: data.categoria,
        area_m2: data.area_m2,
        color_relleno: data.color_relleno,
      });
    }
  };

  // Modify and persist existing polygon
  const handleUpdatePolygon = (updated: PoligonoBlueprint) => {
    const updatedList = polygons.map((p) => (p.id === updated.id ? updated : p));
    persistPolygons(updatedList);
  };

  // Delete and persist polygon removal
  const handleDeletePolygon = (polyId: string) => {
    const updatedList = polygons.filter((p) => p.id !== polyId);
    persistPolygons(updatedList);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100/80 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Toolbar: Blueprint Metadata & Zoom Controls */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {blueprintInfo?.nombre_piso || 'Plano Arquitectónico - Nivel 1'}
            </h2>
            <p className="text-xs text-slate-500">
              {polygons.length} locales trazados | Coordenadas relativas [0..1] homotéticas
            </p>
          </div>
        </div>

        {/* Zoom Controls Bar */}
        <ZoomControls
          zoom={zoom}
          onZoomChange={(newZ) => handleZoomChangeWithCenter(newZ)}
          minZoom={minZoom}
          maxZoom={3.5}
          onReset={() => handleZoomChangeWithCenter(1.0)}
          onFitToScreen={handleFitToScreen}
          drawingMode={drawingMode}
          onToggleDrawingMode={() => setDrawingMode((prev) => !prev)}
          userRole={userRole}
          isDrawingInProgress={isDrawingInProgress}
        />
      </div>

      {/* Main Blueprint Viewport (Scroll & Pan Container) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`relative flex-1 overflow-hidden bg-slate-900/5 min-h-[500px] select-none ${
          drawingMode
            ? 'cursor-crosshair'
            : isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      >
        {/* Hardware-accelerated Pan/Displacement & Zoom wrapper */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isAnimatingButton ? 'transform 0.15s ease-out' : 'none',
          }}
          className="relative flex-shrink-0"
        >
          {/* PDF / Blueprint Canvas Container with SVG Overlay */}
          <div
            className="relative bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-200"
            style={{
              width: `${pageWidth}px`,
              height: `${pageHeight}px`,
            }}
          >
            {/* Loading Indicator */}
            {isPdfLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm text-slate-600 gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Cargando plano arquitectónico vectorial...</span>
              </div>
            )}

            {/* PDF Renderer */}
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => {
                console.warn('PDF load notice:', err.message);
                setPdfLoadError(err.message);
                setIsPdfLoading(false);
              }}
              loading={null}
              className="w-full h-full"
            >
              <Page
                pageNumber={1}
                width={pageWidth}
                onLoadSuccess={onPageLoadSuccess}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                loading={null}
              />
            </Document>

            {/* Fallback Graphic Layer if PDF fails or renders in non-canvas environment */}
            {pdfLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-600">
                <svg className="w-12 h-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-slate-800">Plano Arquitectónico Vectorial Activo</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Visualizando capa de polígonos sobre el plano de Placita Villa El Salvador.
                </p>
              </div>
            )}

            {/* Responsive SVG ViewBox Overlay (viewBox 0 0 1000 1000) */}
            <PolygonOverlay
              polygons={polygons}
              userRole={userRole}
              drawingMode={drawingMode}
              onPolygonDrawn={handlePolygonDrawn}
              onSelectLocal={onSelectLocal}
              selectedLocalId={selectedLocalId}
              onCancelDrawing={() => {
                setDrawingMode(false);
                setIsDrawingInProgress(false);
              }}
              onDrawingStateChange={setIsDrawingInProgress}
              onEditPolygon={(p) => setPolygonToEdit(p)}
            />
          </div>
        </div>

        {/* Floating Controls / Helper Badge */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] shadow-lg pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Arrastra para mover • Rueda para zoom • Botón Encuadrar para centrar</span>
        </div>
      </div>

      {/* Unit Association Modal */}
      {draftPolygonToAssociate && (
        <UnitAssociationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDraftPolygonToAssociate(null);
          }}
          onConfirm={handleConfirmAssociation}
          draftPolygon={draftPolygonToAssociate}
          availableLocales={availableLocales}
        />
      )}

      {/* Edit/Modify Polygon Modal (Modo Proyectos) */}
      {polygonToEdit && (
        <EditPolygonModal
          isOpen={!!polygonToEdit}
          polygon={polygonToEdit}
          onClose={() => setPolygonToEdit(null)}
          onSave={handleUpdatePolygon}
          onDelete={handleDeletePolygon}
          onViewFicha={onSelectLocal}
        />
      )}
    </div>
  );
};
