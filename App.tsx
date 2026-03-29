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
import { AuthProvider } from './src/context/AuthContext';
import { connectChatSocket, disconnectChatSocket, onReceiveMessage } from './src/services/chatSocket';
import { getChatSession } from './src/services/chatSession';
import { chatRegisterPushToken } from './src/services/chatApi';
import { registerForPushNotificationsAsync, setupPushNotificationListeners } from './src/services/pushNotificationService';
import { startPresenceTracking } from './src/services/presenceService';
import { dark, light } from './src/theme/colors';
import { ensureChatSessionForCurrentUser } from './src/services/authService';

function MainApp() {
  const { isAuthenticated, phoneVerified, requiresTwoStepLogin, loading: authLoading, uid, userProfile } = useAuth();
  const { theme } = useSettings();
  const [chatReady, setChatReady] = useState(false);
  const [authRouteLock, setAuthRouteLock] = useState<'phone' | 'twoStep'>('phone');

  useEffect(() => {
    if (!isAuthenticated || phoneVerified) {
      setAuthRouteLock('phone');
      return;
    }

    if (requiresTwoStepLogin) {
      setAuthRouteLock('twoStep');
    }
  }, [isAuthenticated, phoneVerified, requiresTwoStepLogin]);

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

    let currentUserId: string | null = null;

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

      if (currentUserId && senderId === currentUserId) return;

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
        let session = await getChatSession();

        if (uid && session?.userId === uid) {
          console.warn('[App] Chat session is using Firebase UID instead of chat user id. Repairing session...');
          await ensureChatSessionForCurrentUser();
          session = await getChatSession();
        }

        currentUserId = session?.userId || null;
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
  }, [isAuthenticated, uid, phoneVerified]);

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
  const rootNavKey = phoneVerified
    ? `app-${uid || 'guest'}`
    : `auth-${authRouteLock}-${uid || 'guest'}`;

  return (
    <View style={{ flex: 1, backgroundColor: navTheme.colors.background }}>
      <SafeAreaProvider>
        <NavigationContainer key={rootNavKey} ref={navigationRef} theme={navTheme}>
          {phoneVerified ? (
            <AppNavigator key={rootNavKey} />
          ) : (
            <AuthNavigator
              key={rootNavKey}
              initialRoute={authRouteLock === 'twoStep' ? 'TwoStepVerifyPassword' : 'PhoneVerification'}
              twoStepParams={
                authRouteLock === 'twoStep'
                  ? {
                      mode: 'login',
                      targetUid: uid || undefined,
                      phoneNumber: userProfile?.phone,
                    }
                  : undefined
              }
            />
          )}
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SettingsProvider>
  );
}
