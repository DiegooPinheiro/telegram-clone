import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import LoadingSpinner from './src/components/LoadingSpinner';
import useAuth from './src/hooks/useAuth';
import { setupNotifications, showMessageNotification } from './src/services/notificationService';
import Toast from 'react-native-toast-message';
import MessageToast from './src/components/MessageToast';
import { SettingsProvider } from './src/context/SettingsContext';
import { connectChatSocket, disconnectChatSocket, onReceiveMessage } from './src/services/chatSocket';
import { getChatSession } from './src/services/chatSession';
import { startPresenceTracking } from './src/services/presenceService';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let stopPresence: (() => void) | null = null;

    if (!isAuthenticated) {
      disconnectChatSocket();
      setChatReady(false);
      return;
    }

    // Atualiza online/offline baseado em background/foreground
    stopPresence = startPresenceTracking();

    // Registra o listener mesmo antes do socket conectar.
    unsubscribe = onReceiveMessage((message: any) => {
      const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
      if (currentRoute?.name === 'Chat') {
        const params = currentRoute.params as any;
        if (params?.conversationId && params.conversationId === message?.conversationId) {
          return; // Usuário já está vendo essa conversa
        }
      }

      const sender =
        message?.sender ||
        (message?.senderId && typeof message.senderId === 'object' ? message.senderId : null);

      const senderName = sender?.nome || sender?.username || 'Nova mensagem';
      const avatar = sender?.foto || null;
      const username = sender?.username || undefined;
      const senderId =
        (sender?._id ? String(sender._id) : null) ||
        (typeof message?.senderId === 'string' ? message.senderId : null) ||
        '';

      const body = message?.text ? String(message.text) : '📎 Arquivo de mídia';

      showMessageNotification(senderName, body, {
        senderName,
        avatar,
        onPress: () => {
          if (message?.conversationId && navigationRef.isReady()) {
            (navigationRef as any).current?.navigate('Chat', {
              conversationId: message.conversationId,
              userId: senderId,
              name: senderName,
              avatar,
              username,
            });
          }
        },
      });
    });

    const initChatSocket = async (retries = 5) => {
      try {
        const session = await getChatSession();

        if (!session?.userId) {
          if (retries > 0) {
            // Sessão ainda não salva (race condition com login) — tenta novamente
            setTimeout(() => initChatSocket(retries - 1), 600);
            return;
          }
          // Esgotou tentativas — libera app sem chat
          console.warn('[ChatAPI] Sessão não encontrada após várias tentativas.');
          setChatReady(true);
          return;
        }

        // Sessão confirmada — libera o app imediatamente
        setChatReady(true);

        // Socket conecta em background (não bloqueia a UI)
        try {
          connectChatSocket(session.userId);
        } catch (socketError) {
          console.warn('[ChatAPI] Socket não conectou, mas app continua:', socketError);
        }
      } catch (error) {
        console.error('[ChatAPI] Erro ao inicializar sessão:', error);
        setChatReady(true); // libera o app mesmo com erro
      }
    };

    initChatSocket();

    return () => {
      unsubscribe?.();
      stopPresence?.();
    };
  }, [isAuthenticated]);

  if (authLoading || (isAuthenticated && !chatReady)) {
    return <LoadingSpinner message="Carregando..." />;
  }

  const toastConfig = {
    messageToast: (props: any) => <MessageToast {...props} />,
  };

  return (
    <SettingsProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
      <Toast config={toastConfig} />
    </SettingsProvider>
  );
}

