import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, Role } from '../lib/types';
import { getCurrentUser, login as authLogin, logout as authLogout } from '../lib/auth';
import { getRoleHomeRoute } from '../lib/permissions';

interface AuthContextType {
  user: Session | null;
  login: (username: string, password: string) => { success: boolean; error?: string; homeRoute?: string };
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Session | null>(() => getCurrentUser());

  useEffect(() => {
    // Keep session state synced with sessionStorage
    const handleCheck = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', handleCheck);
    return () => window.removeEventListener('storage', handleCheck);
  }, []);

  const login = (username: string, password: string) => {
    const session = authLogin(username, password);
    if (!session) {
      return { success: false, error: 'Invalid username or password.' };
    }
    setUser(session);
    return { success: true, homeRoute: getRoleHomeRoute(session.role) };
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const hasRole = (role: Role) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
