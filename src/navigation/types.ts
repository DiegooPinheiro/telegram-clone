export type RootStackParamList = {
  // Auth
  Register: { phone: string };
  PhoneVerification: { isChangingNumber?: boolean; mode?: 'login' | 'register'; phone?: string } | undefined;

  // Flows
  MainFlow: { screen?: string; params?: any };
  MainTabs:
    | {
        showChatActions?: boolean;
        onDeleteSelected?: () => void;
      }
    | undefined;

  // Screens
  ChatList: undefined;
  Chat: {
    conversationId?: string;
    userId?: string;
    name: string;
    avatar?: string | null;
    username?: string;
    isGroup?: boolean;
  };
  Profile: { uid?: string };
  ContactProfile: {
    uid?: string;
    username?: string;
    name?: string;
    avatar?: string | null;
  };
  Settings: undefined;
  Contacts: undefined;
  NewChat: undefined;
  NewGroup: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  DataStorage: undefined;
  Help: undefined;
  ChangePhone: undefined;
  ChangeUsername: undefined;
  ChangeBirthday: undefined;
  ChatSettings: undefined;
  TwoStepIntro: undefined;
  TwoStepPassword: undefined;
  TwoStepEmail: { password: string };
  TwoStepVerify: { password: string; email: string; code: string };
  TwoStepSuccess: undefined;
  GroupProfile: {
    conversationId: string;
    name: string;
    avatar?: string | null;
    membersCount?: number;
  };
};
