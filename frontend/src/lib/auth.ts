import { UserRole } from '../types';

export type SessionRole = UserRole | 'admin';

export interface Session {
  token: string;
  username: string;
  role: SessionRole;
  expiresAt: number; // epoch ms
}

const SESSION_STORAGE_KEY = 'proptech_session';
export const SESSION_EXPIRED_EVENT = 'proptech:session-expired';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode): the session lives only in memory
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}

export function notifySessionExpired() {
  clearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

// The free Render instance may need up to ~1 minute to wake up, so login waits longer.
export async function login(username: string, password: string): Promise<Session> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intente nuevamente en unos segundos.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    throw new Error('Usuario o contraseña incorrectos.');
  }
  if (!res.ok) {
    throw new Error('El servidor no pudo procesar el inicio de sesión.');
  }

  const data = await res.json();
  const session: Session = {
    token: data.access_token,
    username: data.username,
    role: data.role,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveSession(session);
  return session;
}
