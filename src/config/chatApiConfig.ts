const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ChatAPI] Variável de ambiente ausente: ${key}`);
  }
  return value;
};

export const CHAT_API_CONFIG = {
  BASE_URL: getEnv('EXPO_PUBLIC_CHAT_API_URL'),
};
