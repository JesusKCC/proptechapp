'use client';

import React from 'react';
import { RoleProvider } from '../../context/RoleContext';
import { AuthGate, useAuth } from '../../context/AuthContext';

// Admins can switch between both areas; other users stay in their own role.
const SessionRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const lockedRole = session.role === 'admin' ? undefined : session.role;
  return (
    <RoleProvider key={session.username} initialRole={lockedRole ?? 'proyectos'} lockedRole={lockedRole}>
      {children}
    </RoleProvider>
  );
};

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthGate>
      <SessionRoleProvider>{children}</SessionRoleProvider>
    </AuthGate>
  );
};
