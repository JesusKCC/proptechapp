'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from './RoleSwitcher';
import { Globe, Layers, TicketIcon, Building2, UserCheck } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';

export const AppNavbar: React.FC = () => {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const navLinks = [
    { href: '/', label: 'Mapa & Portafolio', icon: Globe },
    { href: '/planos', label: 'Visor de Planos', icon: Layers },
    { href: '/tickets', label: 'Bandeja de Tickets', icon: TicketIcon },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  PropTech Perú
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  GIS & Planos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Gestión de Activos Comerciales
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-200 pl-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: RoleSwitcher + session */}
        <div className="flex items-center gap-3">
          <RoleSwitcher />
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-600">
              <UserCheck size={14} className="text-slate-400" />
              {session.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav bar */}
      <div className="md:hidden flex border-t border-slate-200 bg-slate-50/80 px-4 py-2 gap-2 overflow-x-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200'
                  : 'text-slate-600'
              }`}
            >
              <Icon size={14} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
