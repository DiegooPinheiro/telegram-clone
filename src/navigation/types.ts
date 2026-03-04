export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // Flows
  MainFlow: { screen?: string; params?: any };
  MainTabs: undefined;

  // Screens
  ChatList: undefined;
  Chat: { uid: string; name: string };
  Profile: { uid?: string };
  Settings: undefined;
  Contacts: undefined;
  NewChat: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  DataStorage: undefined;
  Help: undefined;
};
