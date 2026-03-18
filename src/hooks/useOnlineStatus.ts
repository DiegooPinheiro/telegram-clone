import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Hook de status online/offline baseado no Firestore.
 * Lê os campos `online` e `lastSeen` do documento `users/{uid}`.
 */
export default function useOnlineStatus(uid: string, enabled = true) {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !uid) {
      setOnline(false);
      setLastSeen(null);
      return;
    }

    const ref = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOnline(false);
          setLastSeen(null);
          return;
        }

        const data = snap.data() as any;
        setOnline(!!data.online);
        if (data.lastSeen) {
          const date = new Date(String(data.lastSeen));
          setLastSeen(Number.isNaN(date.getTime()) ? null : date);
        } else {
          setLastSeen(null);
        }
      },
      (error) => {
        console.error('[useOnlineStatus] Erro ao observar status:', error);
        setOnline(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid, enabled]);

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
