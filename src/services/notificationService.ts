import Toast from 'react-native-toast-message';

export const setupNotifications = async () => {
  // Notificações locais no Expo Go (via Toast In-App)
  // não necessitam pedido explícito de permissão ao SO nativo.
};

export const showMessageNotification = (title: string, body: string, data?: any) => {
  // Dispara um toast visual no topo do aplicativo, visível simulando um push local
  Toast.show({
    type: 'info',
    text1: title,
    text2: body,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 60,
  });
};
