import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Behavior when an incoming notification is received while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permissions and gets the unique Expo Push Token for this device.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return undefined;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn('[Push] Project ID nao encontrado. A geracao do token pode falhar em builds standalone.');
      }

      const pushTokenObject = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenObject.data;
    } catch (e) {
      console.error('[Push] Erro ao gerar token push:', e);
    }
  } else {
    return undefined;
  }

  return token;
}

/**
 * Listens for background/killed state notification taps and navigates to the Chat.
 */
export function setupPushNotificationListeners(navigationRef: any) {
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    try {
      const data = response.notification.request.content.data;
      if (data?.type === 'new_message' && data?.conversationId) {
        if (navigationRef.isReady()) {
          navigationRef.current?.navigate('Chat', {
            conversationId: data.conversationId,
            name: response.notification.request.content.title || 'Chat',
          });
        }
      }
    } catch (error) {
      console.error('[Push] Erro ao processar toque na notificacao:', error);
    }
  });

  return () => {
    responseListener.remove();
  };
}
