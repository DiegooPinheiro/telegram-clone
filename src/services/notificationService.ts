import Toast from 'react-native-toast-message';

export const setupNotifications = async () => {
  // Notificações locais no Expo Go (via Toast In-App)
  // não necessitam pedido explícito de permissão ao SO nativo.
};

export const showMessageNotification = (
  title: string,
  body: string,
  options?: {
    avatar?: string | null;
    senderName?: string;
    onPress?: () => void;
  }
) => {
  Toast.show({
    type: 'messageToast',
    text1: title,
    text2: body,
    position: 'top',
    visibilityTime: 5000,
    topOffset: 50,
    props: {
      avatar: options?.avatar ?? null,
      senderName: options?.senderName ?? title,
      onPress: options?.onPress,
    },
  });
};
