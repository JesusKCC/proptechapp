'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Session,
  SESSION_EXPIRED_EVENT,
  clearSession,
  loadSession,
  login as loginRequest,
} from '../lib/auth';
import { LoginScreen } from '../components/auth/LoginScreen';

interface AuthContextType {
  session: Session;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Renders the app only for a signed-in user; everyone else sees the login screen.
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setChecked(true);

    const onExpired = () => setSession(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Drop the session as soon as the token expires, even if the tab stays open
  useEffect(() => {
    if (!session) return;
    const timeoutId = setTimeout(() => {
      clearSession();
      setSession(null);
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timeoutId);
  }, [session]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    setSession(await loginRequest(username, password));
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (!checked) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AuthContext.Provider value={{ session, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthGate');
  }
  return context;
}
