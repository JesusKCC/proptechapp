'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  isComercial: boolean;
  isProyectos: boolean;
  roleHeaders: Record<string, string>;
  canSwitchRole: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'proptech_user_role';

export const RoleProvider: React.FC<{
  children: React.ReactNode;
  initialRole?: UserRole;
  // Set for non-admin users: the role comes from their account and cannot change
  lockedRole?: UserRole;
}> = ({
  children,
  initialRole = 'proyectos',
  lockedRole,
}) => {
  const [role, setRoleState] = useState<UserRole>(lockedRole ?? initialRole);

  useEffect(() => {
    if (lockedRole) return;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
      if (stored === 'comercial' || stored === 'proyectos') {
        setRoleState(stored);
      }
    }
  }, [lockedRole]);

  const setRole = (newRole: UserRole) => {
    if (lockedRole) return;
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    }
  };

  const toggleRole = () => {
    setRole(role === 'comercial' ? 'proyectos' : 'comercial');
  };

  const isComercial = role === 'comercial';
  const isProyectos = role === 'proyectos';
  const roleHeaders = { 'X-User-Role': role };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        isComercial,
        isProyectos,
        roleHeaders,
        canSwitchRole: !lockedRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
