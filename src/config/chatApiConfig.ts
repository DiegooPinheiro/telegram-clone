import { getEnv } from './env';

export const CHAT_API_CONFIG = {
  BASE_URL: getEnv('EXPO_PUBLIC_CHAT_API_URL'),
};
