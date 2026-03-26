import { CHAT_API_CONFIG } from '../config/chatApiConfig';
import { auth } from '../config/firebaseConfig';
import type { ChatApiConversation, ChatApiMessage, ChatApiUser } from '../types/chatApi';

type RequestOptions = {
  auth?: boolean;
};

type FirebaseExchangePayload = {
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const toAbsoluteUrl = (baseUrl: string, url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${normalizeBaseUrl(baseUrl)}${url}`;
  return `${normalizeBaseUrl(baseUrl)}/${url}`;
};

let _cachedToken: string | null = null;
let _tokenExpiresAt: number = 0;
let _cachedTokenUid: string | null = null;

const getFirebaseIdToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  const now = Date.now();
  if (_cachedToken && _cachedTokenUid === user.uid && now < _tokenExpiresAt) return _cachedToken;
  const token = await user.getIdToken(false);
  _cachedToken = token;
  _cachedTokenUid = user.uid;
  _tokenExpiresAt = now + 55 * 60 * 1000;
  return token;
};

export const invalidateCachedToken = () => {
  _cachedToken = null;
  _tokenExpiresAt = 0;
  _cachedTokenUid = null;
};

const requestJson = async <T>(path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> => {
  const baseUrl = normalizeBaseUrl(CHAT_API_CONFIG.BASE_URL);
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (options.auth !== false) {
    const firebaseToken = await getFirebaseIdToken();
    headers.set('Authorization', `Bearer ${firebaseToken}`);
  }
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(url, { ...init, headers });
  let data: any = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return data as T;
};

export const chatSyncFirebaseUser = async (payload: FirebaseExchangePayload) => requestJson<any>('/api/auth/firebase', { method: 'POST', body: JSON.stringify(payload) });
export const chatListUsers = async (q?: string) => requestJson<ChatApiUser[]>(`/api/users${q ? '?q='+encodeURIComponent(q) : ''}`, { method: 'GET' });
export const chatSyncContacts = async (phones: string[]) => requestJson<ChatApiUser[]>('/api/users/sync-contacts', { method: 'POST', body: JSON.stringify({ phones }) });
export const chatGetConversations = async (userId: string) => requestJson<ChatApiConversation[]>(`/api/conversations/${userId}`, { method: 'GET' });
export const chatGetConversationById = async (conversationId: string) => requestJson<ChatApiConversation>(`/api/conversations/detail/${conversationId}`, { method: 'GET' });
export const chatCreateConversation = async (participantId: string) => requestJson<ChatApiConversation>('/api/conversations', { method: 'POST', body: JSON.stringify({ participantId }) });
export const chatCreateGroup = async (payload: any) => requestJson<ChatApiConversation>('/api/conversations/groups', { method: 'POST', body: JSON.stringify(payload) });
export const chatDeleteConversation = async (conversationId: string) => requestJson<any>(`/api/conversations/${conversationId}`, { method: 'DELETE' });
export const chatGetMessages = async (conversationId: string) => requestJson<ChatApiMessage[]>(`/api/messages/${conversationId}`, { method: 'GET' });
export const chatRegisterPushToken = async (token: string) => requestJson<any>('api/users/push-token', { method: 'POST', body: JSON.stringify({ token }) });
export const chatSendMessageRest = async (payload: any) => requestJson<ChatApiMessage>('/api/messages', { method: 'POST', body: JSON.stringify(payload) });
export const chatDeleteManyMessages = async (payload: any) => requestJson<any>('/api/messages/delete-many', { method: 'POST', body: JSON.stringify(payload) });
export const chatUpdateMessage = async (id: string, payload: any) => requestJson<any>(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const chatUploadMedia = async (file: any) => {
  const form = new FormData();
  form.append('media', file);
  const uploaded = await requestJson<any>('/api/media/upload', { method: 'POST', body: form });
  return { ...uploaded, mediaUrl: toAbsoluteUrl(CHAT_API_CONFIG.BASE_URL, uploaded.mediaUrl) };
};
