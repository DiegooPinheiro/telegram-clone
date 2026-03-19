import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Status online/offline pelo Firestore, procurando por `users` via `email`.
 * Útil quando a tela só tem o `username` da Chat API (email) e não o `uid` do Firebase.
 */
export default function useOnlineStatusByEmail(email: string, enabled = true) {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    const normalized = (email || '').trim().toLowerCase();
    if (!enabled || !normalized) {
      setOnline(false);
      setLastSeen(null);
      return;
    }

    const q = query(collection(db, 'users'), where('email', '==', normalized));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docSnap = snap.docs?.[0];
        if (!docSnap?.exists()) {
          setOnline(false);
          setLastSeen(null);
          return;
        }

        const data = docSnap.data() as any;
        setOnline(!!data.online);
        if (data.lastSeen) {
          const date = new Date(String(data.lastSeen));
          setLastSeen(Number.isNaN(date.getTime()) ? null : date);
        } else {
          setLastSeen(null);
        }
      },
      (error) => {
        console.error('[useOnlineStatusByEmail] Erro ao observar status:', error);
        setOnline(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [email, enabled]);

  const formatLastSeen = (): string => {
    if (online) return 'online';
    if (!lastSeen) return 'visto recentemente';

    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'visto agora';
    if (minutes < 60) return `visto há ${minutes} min`;
    if (hours < 24) return `visto há ${hours}h`;

    return `visto em ${lastSeen.toLocaleDateString('pt-BR')}`;
  };

  return {
    online,
    lastSeen,
    statusText: formatLastSeen(),
  };
}

