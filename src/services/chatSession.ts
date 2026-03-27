import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@chat_api/user_id';

export type ChatSession = {
  userId: string;
  phoneVerified?: boolean;
};

export const getChatSession = async (): Promise<ChatSession | null> => {
  const [userId, phoneVerified] = await Promise.all([
    AsyncStorage.getItem(USER_ID_KEY),
    AsyncStorage.getItem('@chat_api/phone_verified'),
  ]);

  if (!userId) return null;
  return { 
    userId, 
    phoneVerified: phoneVerified === 'true' 
  };
};

export const setChatSession = async (session: ChatSession) => {
  await Promise.all([
    AsyncStorage.setItem(USER_ID_KEY, session.userId),
    AsyncStorage.setItem('@chat_api/phone_verified', String(session.phoneVerified || false)),
  ]);
};

export const clearChatSession = async () => {
  await Promise.all([
    AsyncStorage.removeItem(USER_ID_KEY),
    AsyncStorage.removeItem('@chat_api/phone_verified'),
  ]);
};
