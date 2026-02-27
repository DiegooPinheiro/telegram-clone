import { useState, useEffect } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  addUserPresenceListener,
  removeUserPresenceListener,
} from '../services/cometChatService';

/**
 * Hook de status online/offline de um usuário específico.
 * Escuta mudanças de presença em tempo real via CometChat.
 */
export default function useOnlineStatus(uid: string) {
  const [online, setOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  const listenerID = `presence_${uid}`;

  // Buscar status inicial
  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const user = await CometChat.getUser(uid);
        setOnline(user.getStatus() === 'online');
        if (user.getLastActiveAt()) {
          setLastSeen(new Date(user.getLastActiveAt() * 1000));
        }
      } catch (error) {
        console.error('[useOnlineStatus] Erro ao buscar status:', error);
      }
    };

    fetchInitialStatus();
  }, [uid]);

  // Listener de mudanças de presença
  useEffect(() => {
    addUserPresenceListener(
      listenerID,
      (onlineUser) => {
        if (onlineUser.getUid() === uid) {
          setOnline(true);
        }
      },
      (offlineUser) => {
        if (offlineUser.getUid() === uid) {
          setOnline(false);
          setLastSeen(new Date());
        }
      }
    );

    return () => {
      removeUserPresenceListener(listenerID);
    };
  }, [uid, listenerID]);

  // Formatar "visto por último"
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
