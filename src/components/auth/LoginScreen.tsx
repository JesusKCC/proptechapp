'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Shield, AlertCircle } from '../common/Icons';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false);

  // The free backend sleeps when idle; tell the user why the first login is slow
  useEffect(() => {
    if (!loading) {
      setSlowServer(false);
      return;
    }
    const timeoutId = setTimeout(() => setSlowServer(true), 4000);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Ingrese su usuario y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">PropTech Perú</h1>
          <p className="text-sm text-slate-300 mt-1">Gestión de Activos Comerciales</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-6 space-y-4"
          noValidate
        >
          <div className="flex items-center gap-2 text-slate-800">
            <Shield size={18} className="text-blue-600" />
            <h2 className="text-base font-bold">Iniciar sesión</h2>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-xs font-semibold text-slate-600">
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-600">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold py-2.5 transition-colors"
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>

          {slowServer && (
            <p className="text-[11px] text-slate-500 text-center leading-snug">
              Conectando con el servidor. Si estuvo inactivo, puede tardar hasta un minuto en
              responder.
            </p>
          )}
        </form>
      </div>
    </main>
  );
};
