/**
 * In-memory message cache for ChatScreen.
 * Stores the last loaded messages per conversationId so they appear
 * instantly while fresh messages are being fetched from the API.
 * The cache is automatically invalidated after 5 minutes.
 */

type CacheEntry = {
  messages: any[];
  cachedAt: number;
};

const cache = new Map<string, CacheEntry>();
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export const getCachedMessages = (conversationId: string): any[] | null => {
  const entry = cache.get(conversationId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > MAX_AGE_MS) {
    cache.delete(conversationId);
    return null;
  }
  return entry.messages;
};

export const setCachedMessages = (conversationId: string, messages: any[]) => {
  cache.set(conversationId, { messages, cachedAt: Date.now() });
};

export const invalidateCachedMessages = (conversationId: string) => {
  cache.delete(conversationId);
};
