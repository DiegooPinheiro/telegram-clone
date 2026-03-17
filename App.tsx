import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import LoadingSpinner from './src/components/LoadingSpinner';
import useAuth from './src/hooks/useAuth';
import { initCometChat, loginCometChat } from './src/services/cometChatService';
import { auth } from './src/config/firebaseConfig';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { setupNotifications, showMessageNotification } from './src/services/notificationService';
import Toast from 'react-native-toast-message';

import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cometChatReady, setCometChatReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initCometChat();
        
        if (isAuthenticated && auth.currentUser) {
          try {
            await loginCometChat(auth.currentUser.uid, auth.currentUser.displayName || 'Usuário');
            setCometChatReady(true);
          } catch (loginError) {
            console.error('[CometChat] Erro no login automático:', loginError);
            setCometChatReady(true);
          }
        } else {
          setCometChatReady(true);
        }
      } catch (error) {
        console.error('[CometChat] Erro crítico na inicialização:', error);
        setCometChatReady(true);
      }
    };
    init();
  }, [isAuthenticated]);

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    if (!cometChatReady || !isAuthenticated) return;

    const listenerID = 'GLOBAL_NOTIFICATION_LISTENER';
    
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
          const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
          const senderId = textMessage.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP 
                         ? textMessage.getReceiverId() 
                         : textMessage.getSender().getUid();
          
          let shouldNotify = true;
          if (currentRoute?.name === 'Chat') {
             const routeParams = currentRoute.params as any;
             if (routeParams?.uid === senderId) {
                shouldNotify = false;
             }
          }

          if (shouldNotify) {
            const senderName = textMessage.getSender().getName();
            let title = senderName;
            
            if (textMessage.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
                title = `${senderName} no ${(textMessage.getReceiver() as CometChat.Group).getName()}`;
            }

            showMessageNotification(title, textMessage.getText());
          }
        },
        onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
            const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
            const senderId = mediaMessage.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP 
                         ? mediaMessage.getReceiverId() 
                         : mediaMessage.getSender().getUid();
          
            let shouldNotify = true;
            if (currentRoute?.name === 'Chat') {
               const routeParams = currentRoute.params as any;
               if (routeParams?.uid === senderId) {
                  shouldNotify = false;
               }
            }

            if (shouldNotify) {
              const senderName = mediaMessage.getSender().getName();
              let title = senderName;
              
              if (mediaMessage.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
                  title = `${senderName} no ${(mediaMessage.getReceiver() as CometChat.Group).getName()}`;
              }

              showMessageNotification(title, '📷 Arquivo de mídia recebido');
            }
        }
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [cometChatReady, isAuthenticated]);

  if (authLoading || !cometChatReady) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <SettingsProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
      <Toast />
    </SettingsProvider>
  );
}
