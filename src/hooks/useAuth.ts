import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser } from '../services/authService';

/**
 * Hook de autenticação.
 * Observa mudanças no estado de auth e expõe o usuário atual.
 */
export default function useAuth() {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    uid: user?.uid || null,
    displayName: user?.displayName || null,
    email: user?.email || null,
    photoURL: user?.photoURL || null,
  };
}
