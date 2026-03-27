import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser } from '../services/authService';
import { getChatSession } from '../services/chatSession';

/**
 * Hook de autenticação.
 * Observa mudanças no estado de auth e expõe o usuário atual.
 */
export default function useAuth() {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getChatSession();
      setPhoneVerified(!!session?.phoneVerified);
    };

    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        checkSession();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    phoneVerified,
    isAuthenticated: !!user,
    uid: user?.uid || null,
    displayName: user?.displayName || null,
    email: user?.email || null,
    photoURL: user?.photoURL || null,
  };
}
