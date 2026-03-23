import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import LoadingSpinner from './src/components/LoadingSpinner';
import useAuth from './src/hooks/useAuth';
import { setupNotifications, showMessageNotification } from './src/services/notificationService';
import Toast from 'react-native-toast-message';
import MessageToast from './src/components/MessageToast';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { connectChatSocket, disconnectChatSocket, onReceiveMessage } from './src/services/chatSocket';
import { getChatSession } from './src/services/chatSession';
import { chatRegisterPushToken } from './src/services/chatApi';
import { registerForPushNotificationsAsync, setupPushNotificationListeners } from './src/services/pushNotificationService';
import { startPresenceTracking } from './src/services/presenceService';
import { dark, light } from './src/theme/colors';

function MainApp() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useSettings();
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    setupNotifications();
    
    // Set up Expo push notification tap listeners
    const removePushListener = setupPushNotificationListeners(navigationRef);
    return () => {
      removePushListener();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let stopPresence: (() => void) | null = null;

    if (!isAuthenticated) {
      disconnectChatSocket();
      setChatReady(false);
      return;
    }

    stopPresence = startPresenceTracking();

    unsubscribe = onReceiveMessage((message: any) => {
      const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
      if (currentRoute?.name === 'Chat') {
        const params = currentRoute.params as any;
        if (params?.conversationId && params.conversationId === message?.conversationId) {
          return;
        }
      }

      const sender = message?.sender || (message?.senderId && typeof message.senderId === 'object' ? message.senderId : null);
      const senderName = sender?.nome || sender?.username || 'Nova mensagem';
      const avatar = sender?.foto || null;
      const username = sender?.username || undefined;
      const senderId = (sender?._id ? String(sender._id) : null) || (typeof message?.senderId === 'string' ? message.senderId : null) || '';
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
            setTimeout(() => initChatSocket(retries - 1), 600);
            return;
          }
          setChatReady(true);
          return;
        }
        setChatReady(true);
        connectChatSocket(session.userId);

        // Register for push notifications once authenticated
        registerForPushNotificationsAsync()
          .then((token) => {
            if (token) {
              chatRegisterPushToken(token).catch(err => console.warn('Push Token Registration failed:', err));
            }
          })
          .catch(err => console.warn('Push Token Generation failed:', err));
      } catch (error) {
        console.error('[ChatAPI] Erro ao inicializar sessão:', error);
        setChatReady(true);
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

  const navTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: dark.background,
      card: dark.background,
      text: dark.textPrimary,
      border: dark.separator,
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: light.background,
      card: light.background,
      text: light.textPrimary,
      border: light.separator,
    }
  };

  const toastConfig = {
    messageToast: (props: any) => <MessageToast {...props} />,
  };

  return (
    <View style={{ flex: 1, backgroundColor: navTheme.colors.background }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
}
