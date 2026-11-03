'use client';

import React from 'react';
import { useRole } from '../../context/RoleContext';
import { Briefcase, Ruler, Shield } from '../common/Icons';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole, isComercial, isProyectos, canSwitchRole } = useRole();

  if (!canSwitchRole) {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
          isProyectos
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
        title="Rol asignado a su usuario"
      >
        {isProyectos ? <Ruler size={14} /> : <Briefcase size={14} />}
        <span>{isProyectos ? 'Proyectos' : 'Comercial'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 mr-1">
        <Shield size={14} className={isProyectos ? 'text-emerald-500' : 'text-blue-500'} />
        <span className="font-medium">Modo RBAC:</span>
      </div>

      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => setRole('comercial')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isComercial
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Área Comercial: Lectura de planos, gestión de locales, creación de requerimientos"
        >
          <Briefcase size={14} className={isComercial ? 'text-blue-600' : 'text-slate-400'} />
          <span>Comercial</span>
          {isComercial && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setRole('proyectos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isProyectos
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Área Proyectos: Dibujo y edición de polígonos, resolución técnica de tickets"
        >
          <Ruler size={14} className={isProyectos ? 'text-white' : 'text-slate-400'} />
          <span>Proyectos</span>
          {isProyectos && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 ml-0.5 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};
