import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@chat_api/token';
const USER_ID_KEY = '@chat_api/user_id';

export type ChatSession = {
  token: string;
  userId: string;
};

export const getChatSession = async (): Promise<ChatSession | null> => {
  const [token, userId] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_ID_KEY),
  ]);

  if (!token || !userId) return null;
  return { token, userId };
};

export const setChatSession = async (session: ChatSession) => {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, session.token),
    AsyncStorage.setItem(USER_ID_KEY, session.userId),
  ]);
};

export const clearChatSession = async () => {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_ID_KEY),
  ]);
};
