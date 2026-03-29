import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@chat_api/user_id';
const PHONE_VERIFIED_KEY = '@chat_api/phone_verified';
const PROFILE_UID_KEY = '@chat_api/profile_uid';

export type ChatSession = {
  userId: string;
  profileUid?: string;
  phoneVerified?: boolean;
};

export const getChatSession = async (): Promise<ChatSession | null> => {
  const [userId, phoneVerified, profileUid] = await Promise.all([
    AsyncStorage.getItem(USER_ID_KEY),
    AsyncStorage.getItem(PHONE_VERIFIED_KEY),
    AsyncStorage.getItem(PROFILE_UID_KEY),
  ]);

  if (!userId) return null;
  return {
    userId,
    profileUid: profileUid || undefined,
    phoneVerified: phoneVerified === 'true',
  };
};

export const setChatSession = async (session: ChatSession) => {
  await Promise.all([
    AsyncStorage.setItem(USER_ID_KEY, session.userId),
    AsyncStorage.setItem(PHONE_VERIFIED_KEY, String(session.phoneVerified || false)),
    session.profileUid
      ? AsyncStorage.setItem(PROFILE_UID_KEY, session.profileUid)
      : AsyncStorage.removeItem(PROFILE_UID_KEY),
  ]);
};

export const clearChatSession = async () => {
  await Promise.all([
    AsyncStorage.removeItem(USER_ID_KEY),
    AsyncStorage.removeItem(PHONE_VERIFIED_KEY),
    AsyncStorage.removeItem(PROFILE_UID_KEY),
  ]);
};
