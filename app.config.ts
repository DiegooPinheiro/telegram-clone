import type { ExpoConfig } from 'expo/config';

const PUBLIC_KEYS = [
  'EXPO_PUBLIC_CHAT_API_URL',
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const injected = Object.fromEntries(PUBLIC_KEYS.map((key) => [key, process.env[key]]));

  return {
    ...config,
    extra: {
      ...config.extra,
      ...injected,
    },
  };
};
