import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '@/services/authService';

type AuthContextType = {
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());

  useEffect(() => {
    // keep in sync if some other tab changes localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        setUser(authService.getCurrentUser());
        setIsAuthenticated(authService.isAuthenticated());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (token: string, userData: any) => {
    authService.storeAuthData(token, userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refresh = () => {
    setUser(authService.getCurrentUser());
    setIsAuthenticated(authService.isAuthenticated());
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
