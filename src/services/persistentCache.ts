import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
  CONVERSATIONS: '@chat_conversations',
  CONTACTS: '@chat_contacts',
};

/**
 * Saves JSON-serializable data to disk async.
 */
export const saveCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.warn(`[PersistentCache] Erro ao salvar cache para chave ${key}:`, error);
  }
};

/**
 * Loads JSON-serializable data from disk async.
 */
export const loadCache = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.warn(`[PersistentCache] Erro ao carregar cache para chave ${key}:`, error);
    return null;
  }
};

/**
 * Clears specific cached item.
 */
export const clearCacheItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[PersistentCache] Erro ao limpar cache para chave ${key}:`, error);
  }
};

/**
 * Clears ALL app caches (useful on logout).
 */
export const clearAllAppCaches = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter((k) => Object.values(CACHE_KEYS).includes(k));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
  } catch (error) {
    console.warn('[PersistentCache] Erro ao limpar todos os caches:', error);
  }
};
