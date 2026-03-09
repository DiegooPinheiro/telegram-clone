export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // Flows
  MainFlow: { screen?: string; params?: any };
  MainTabs: undefined;

  // Screens
  ChatList: undefined;
  Chat: { uid: string; name: string; isGroup?: boolean };
  Profile: { uid?: string };
  Settings: undefined;
  Contacts: undefined;
  NewChat: undefined;
  NewGroup: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  DataStorage: undefined;
  Help: undefined;
};
