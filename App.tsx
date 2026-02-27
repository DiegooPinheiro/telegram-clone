import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingSpinner from './src/components/LoadingSpinner';
import useAuth from './src/hooks/useAuth';
import { initCometChat } from './src/services/cometChatService';
import { colors } from './src/theme/colors';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cometChatReady, setCometChatReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initCometChat();
      setCometChatReady(true);
    };
    init();
  }, []);

  if (authLoading || !cometChatReady) {
    return <LoadingSpinner message="Carregando..." />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
