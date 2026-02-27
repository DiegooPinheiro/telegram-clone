export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;

  // Main
  ChatList: undefined;
  Chat: { uid: string; name: string };
  Profile: { uid: string };
  Settings: undefined;
  Contacts: undefined;
  NewChat: undefined;
};
