'use client';

import React, { useState, useRef } from 'react';
import { Layers, X } from '../common/Icons';
import { uploadBlueprintPdf } from '../../lib/api';

interface AddBlueprintModalProps {
  isOpen: boolean;
  mallName: string;
  mallSlug: string;
  onClose: () => void;
  onBlueprintAdded: (entry: { id: string; nombre_piso: string; archivo_pdf_url: string }) => void;
}

export const AddBlueprintModal: React.FC<AddBlueprintModalProps> = ({
  isOpen,
  mallName,
  mallSlug,
  onClose,
  onBlueprintAdded,
}) => {
  const [nombrePiso, setNombrePiso] = useState('Nivel 2');
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Solo se permiten archivos en formato PDF');
      return;
    }
    setPlanFile(file);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFile) {
      setErrorMsg('Por favor seleccione un archivo PDF del plano arquitectónico');
      return;
    }
    if (!nombrePiso.trim()) {
      setErrorMsg('Por favor ingrese el nombre del piso o nivel');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const cleanFloorSlug = nombrePiso.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const pdfUrl =
        (await uploadBlueprintPdf(planFile, `${mallSlug}_${cleanFloorSlug}`)) ||
        URL.createObjectURL(planFile);

      const newEntry = {
        id: `plano-${mallSlug}-${cleanFloorSlug}-${Date.now()}`,
        nombre_piso: nombrePiso.trim(),
        archivo_pdf_url: pdfUrl,
      };
      onBlueprintAdded(newEntry);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Agregar Plano Arquitectónico</h2>
              <p className="text-[11px] text-blue-100 truncate max-w-[240px]">{mallName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Piso / Nivel *
            </label>
            <input
              type="text"
              required
              value={nombrePiso}
              onChange={(e) => setNombrePiso(e.target.value)}
              placeholder="Ej: Nivel 2, Nivel 3, Terraza, Patio de Comidas..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Archivo Plano (PDF) *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                if (e.cancelable) e.preventDefault();
              }}
              onDrop={(e) => {
                if (e.cancelable) e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                    setErrorMsg('Solo se permiten archivos PDF');
                    return;
                  }
                  setPlanFile(file);
                  setErrorMsg('');
                }
              }}
              className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30"
            >
              {planFile ? (
                <div className="flex flex-col items-center gap-1">
                  <Layers size={24} className="text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-700">{planFile.name}</p>
                  <p className="text-[10px] text-emerald-600 font-mono">
                    {(planFile.size / 1024).toFixed(1)} KB • Listo para cargar
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Layers size={24} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">
                    Haz clic o arrastra el plano PDF aquí
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Se renderizará de inmediato con el visor vectorial homotético
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {errorMsg && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1">{errorMsg}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !planFile}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cargando Plano...
                </>
              ) : (
                'Subir y Activar Plano'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};