// ConfiguraÃ§Ãµes do CometChat
// Preencha com as credenciais do seu app CometChat

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[CometChat] Variavel de ambiente ausente: ${key}`);
  }
  return value;
};

export const COMETCHAT_CONSTANTS = {
  APP_ID: getEnv('EXPO_PUBLIC_COMETCHAT_APP_ID'),
  REGION: getEnv('EXPO_PUBLIC_COMETCHAT_REGION'),
  AUTH_KEY: getEnv('EXPO_PUBLIC_COMETCHAT_AUTH_KEY'),
};
