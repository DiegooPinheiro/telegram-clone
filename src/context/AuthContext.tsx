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
    console.log('[AuthContext] Verificando sessão local. phoneVerified:', !!session?.phoneVerified);
    setPhoneVerified(!!session?.phoneVerified);
  };

  const refreshSession = async () => {
    console.log('[AuthContext] Refresh manual da sessão solicitado');
    await checkSession();
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Tenta a sessão local primeiro
        const session = await getChatSession();
        if (session && session.phoneVerified) {
          setPhoneVerified(true);
        } else {
          // Se não estiver na sessão local, verifica o Firestore diretamente
          // para evitar o race condition do carregamento inicial/login.
          try {
            const { doc, getDoc, getFirestore } = await import('firebase/firestore');
            const db = getFirestore();
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists() && (snap.data() as any).phoneVerified) {
              setPhoneVerified(true);
            } else {
              setPhoneVerified(false);
            }
          } catch (e) {
            setPhoneVerified(false);
          }
        }
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
