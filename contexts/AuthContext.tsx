import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger l'utilisateur au montage
    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = authService.onAuthStateChange(async (supabaseUser) => {
      if (supabaseUser) {
        const authUser = await authService.getAuthUser();
        setUser(authUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      const authUser = await authService.getAuthUser();
      setUser(authUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    if (!error) {
      await loadUser();
    }
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await authService.signUp(email, password, metadata);
    if (!error) {
      await loadUser();
    }
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
