'use client';

import React, { useState, useRef } from 'react';
import { CentroComercial } from '../../types';
import { uploadBlueprintPdf } from '../../lib/api';
import { X, Building2, MapPin, Plus, Layers } from '../common/Icons';

interface CreateMallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (mall: CentroComercial) => void;
}

const PERU_DEPARTMENTS = [
  'Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca',
  'Callao','Cusco','Huancavelica','Huánuco','Ica','Junín',
  'La Libertad','Lambayeque','Lima','Loreto','Madre de Dios',
  'Moquegua','Pasco','Piura','Puno','San Martín','Tacna','Tumbes','Ucayali',
];

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const CreateMallModal: React.FC<CreateMallModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    departamento: 'Lima',
    provincia: '',
    distrito: '',
    lat: '',
    lon: '',
    total_locales: '',
    superficie_total_m2: '',
    imagen_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria';
    if (!form.lat || isNaN(Number(form.lat))) e.lat = 'Latitud inválida (ej: -12.05)';
    if (!form.lon || isNaN(Number(form.lon))) e.lon = 'Longitud inválida (ej: -77.03)';
    if (!form.total_locales || isNaN(Number(form.total_locales))) e.total_locales = 'Número inválido';
    if (!form.superficie_total_m2 || isNaN(Number(form.superficie_total_m2))) e.superficie_total_m2 = 'Número inválido';
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    if (!e.lat && (lat < -18.5 || lat > -0.03)) e.lat = 'Latitud fuera del territorio peruano';
    if (!e.lon && (lon < -81.5 || lon > -68.5)) e.lon = 'Longitud fuera del territorio peruano';
    return e;
  };

  const handlePlanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrors((p) => ({ ...p, plan: 'Solo se aceptan archivos PDF' }));
      return;
    }
    setPlanFile(file);
    setPlanName(file.name);
    setErrors((p) => ({ ...p, plan: '' }));
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.cancelable && typeof e.preventDefault === 'function') {
      try {
        e.preventDefault();
      } catch {}
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const slug = slugify(form.nombre);
      let uploadedPlanoUrl: string | undefined = undefined;

      // Upload blueprint PDF if attached
      if (planFile) {
        const url = await uploadBlueprintPdf(planFile, slug);
        if (url) {
          uploadedPlanoUrl = url;
          setUploadSuccess(true);
        }
      }

      const payload = {
        nombre: form.nombre.trim(),
        slug,
        direccion: form.direccion.trim(),
        departamento: form.departamento,
        provincia: form.provincia.trim() || form.departamento,
        distrito: form.distrito.trim(),
        lat: Number(form.lat),
        lon: Number(form.lon),
        total_locales: Number(form.total_locales),
        superficie_total_m2: Number(form.superficie_total_m2),
        imagen_url: form.imagen_url.trim() || undefined,
        plano_url: uploadedPlanoUrl,
      };

      // Try API first, fall back to local creation
      try {
        const res = await fetch('http://localhost:8000/api/v1/centros-comerciales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Role': 'proyectos' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          onCreated({ ...created, plano_url: uploadedPlanoUrl });
          handleClose();
          return;
        }
      } catch (apiErr) {
        console.warn('API create notice:', apiErr);
      }

      // Fallback: create locally with generated ID
      const localMall: CentroComercial = {
        id: slug + '-' + Date.now(),
        ...payload,
        plano_url: uploadedPlanoUrl,
      };
      onCreated(localMall);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm({ nombre:'', direccion:'', departamento:'Lima', provincia:'', distrito:'', lat:'', lon:'', total_locales:'', superficie_total_m2:'', imagen_url:'' });
    setErrors({});
    setPlanFile(null);
    setPlanName('');
    setUploadSuccess(false);
    onClose();
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-black text-base">Agregar Centro Comercial</h2>
              <p className="text-blue-100 text-xs">Complete los datos del nuevo activo</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Centro Comercial *</label>
            <input type="text" placeholder="Ej: Jockey Plaza" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputClass('nombre')} />
            {errors.nombre && <p className="text-red-500 text-[11px] mt-0.5">{errors.nombre}</p>}
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Dirección *</label>
            <input type="text" placeholder="Ej: Av. Javier Prado Este 4200" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} className={inputClass('direccion')} />
            {errors.direccion && <p className="text-red-500 text-[11px] mt-0.5">{errors.direccion}</p>}
          </div>

          {/* Departamento + Provincia + Distrito */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Departamento *</label>
              <select value={form.departamento} onChange={(e) => set('departamento', e.target.value)} className={inputClass('departamento')}>
                {PERU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Provincia</label>
              <input type="text" placeholder="Provincia" value={form.provincia} onChange={(e) => set('provincia', e.target.value)} className={inputClass('provincia')} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Distrito</label>
              <input type="text" placeholder="Distrito" value={form.distrito} onChange={(e) => set('distrito', e.target.value)} className={inputClass('distrito')} />
            </div>
          </div>

          {/* Coordenadas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Latitud * <span className="text-slate-400 font-normal">(Perú: -18.5 a -0.03)</span></label>
              <input type="number" step="any" placeholder="-12.0863" value={form.lat} onChange={(e) => set('lat', e.target.value)} className={inputClass('lat')} />
              {errors.lat && <p className="text-red-500 text-[11px] mt-0.5">{errors.lat}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Longitud * <span className="text-slate-400 font-normal">(Perú: -81.5 a -68.5)</span></label>
              <input type="number" step="any" placeholder="-76.9763" value={form.lon} onChange={(e) => set('lon', e.target.value)} className={inputClass('lon')} />
              {errors.lon && <p className="text-red-500 text-[11px] mt-0.5">{errors.lon}</p>}
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Total de Locales *</label>
              <input type="number" min="0" placeholder="150" value={form.total_locales} onChange={(e) => set('total_locales', e.target.value)} className={inputClass('total_locales')} />
              {errors.total_locales && <p className="text-red-500 text-[11px] mt-0.5">{errors.total_locales}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Superficie Total (m²) *</label>
              <input type="number" min="0" step="any" placeholder="85000" value={form.superficie_total_m2} onChange={(e) => set('superficie_total_m2', e.target.value)} className={inputClass('superficie_total_m2')} />
              {errors.superficie_total_m2 && <p className="text-red-500 text-[11px] mt-0.5">{errors.superficie_total_m2}</p>}
            </div>
          </div>

          {/* Imagen URL */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL de Imagen <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input type="url" placeholder="https://..." value={form.imagen_url} onChange={(e) => set('imagen_url', e.target.value)} className={inputClass('imagen_url')} />
          </div>

          {/* Plano PDF Upload Section */}
          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              Cargar Plano Arquitectónico (PDF) <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                if (e.cancelable) e.preventDefault();
              }}
              onDrop={(e) => {
                if (e.cancelable) e.preventDefault();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) {
                  if (!droppedFile.name.toLowerCase().endsWith('.pdf')) {
                    setErrors((p) => ({ ...p, plan: 'Solo se aceptan archivos PDF' }));
                    return;
                  }
                  setPlanFile(droppedFile);
                  setPlanName(droppedFile.name);
                  setErrors((p) => ({ ...p, plan: '' }));
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                planFile
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {planFile ? (
                <div className="flex flex-col items-center gap-1">
                  <Layers size={24} className="text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-700">{planFile.name}</p>
                  <p className="text-[10px] text-emerald-600">{(planFile.size / 1024).toFixed(1)} KB — Listo para asociar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Layers size={24} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600">Haz clic o arrastra aquí el PDF del plano</p>
                  <p className="text-[10px] text-slate-400">El plano quedará vinculado y visible en el Visor de Planos</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePlanFile}
            />
            {errors.plan && <p className="text-red-500 text-[11px] mt-1">{errors.plan}</p>}
            {uploadSuccess && (
              <p className="text-emerald-600 text-[11px] mt-1 font-semibold">
                ✓ Plano registrado exitosamente.
              </p>
            )}
          </div>

          {/* Preview slug */}
          {form.nombre && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500">ID generado: <span className="font-mono text-blue-600">{slugify(form.nombre)}</span></p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-all flex items-center gap-2 shadow-md shadow-blue-500/25 cursor-pointer"
          >
            {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</> : <><Plus size={14} /> Crear Centro Comercial</>}
          </button>
        </div>
      </div>
    </div>
  );
};
