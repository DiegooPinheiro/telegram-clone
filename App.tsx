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
    </SettingsProvider>
  );
}
