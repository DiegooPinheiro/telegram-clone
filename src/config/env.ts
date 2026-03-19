import Constants from 'expo-constants';

const readExtra = (key: string) => {
  const extra = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifest?.extra;
  const value = extra?.[key];
  return typeof value === 'string' ? value : value != null ? String(value) : undefined;
};

export const getEnv = (key: string) => {
  const value = readExtra(key) ?? process.env[key];
  if (!value) {
    throw new Error(`[Env] Variável de ambiente ausente: ${key}`);
  }
  return value;
};

