import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@chat_api/user_id';

export type ChatSession = {
  userId: string;
};

export const getChatSession = async (): Promise<ChatSession | null> => {
  const userId = await AsyncStorage.getItem(USER_ID_KEY);

  if (!userId) return null;
  return { userId };
};

export const setChatSession = async (session: ChatSession) => {
  await AsyncStorage.setItem(USER_ID_KEY, session.userId);
};

export const clearChatSession = async () => {
  await AsyncStorage.removeItem(USER_ID_KEY);
};
