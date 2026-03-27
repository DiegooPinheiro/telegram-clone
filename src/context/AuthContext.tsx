import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser } from '../services/authService';
import { getChatSession } from '../services/chatSession';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  phoneVerified: boolean;
  isAuthenticated: boolean;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const checkSession = async () => {
    const session = await getChatSession();
    setPhoneVerified(!!session?.phoneVerified);
  };

  const refreshSession = async () => {
    await checkSession();
  };

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        checkSession();
      } else {
        setPhoneVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Adicionalmente, vamos verificar a sessão a cada 2 segundos se o usuário estiver logado mas não verificado
  // para garantir que a mudança seja captada se acontecer em outro lugar.
  useEffect(() => {
    let interval: any;
    if (user && !phoneVerified) {
      interval = setInterval(checkSession, 2000);
    }
    return () => clearInterval(interval);
  }, [user, phoneVerified]);

  const value = {
    user,
    loading,
    phoneVerified,
    isAuthenticated: !!user,
    uid: user?.uid || null,
    displayName: user?.displayName || null,
    email: user?.email || null,
    photoURL: user?.photoURL || null,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
