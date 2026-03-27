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
let _cachedTokenUid: string | null = null;

const getFirebaseIdToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  
  // Se não for forceRefresh e tivermos o token do mesmo usuário, podemos usar o cache local
  // Porém, o ideal é confiar no getIdToken(false) que já tem cache interno do Firebase.
  const token = await user.getIdToken(forceRefresh);
  _cachedToken = token;
  _cachedTokenUid = user.uid;
  return token;
};

export const invalidateCachedToken = () => {
  _cachedToken = null;
  _cachedTokenUid = null;
};

const requestJson = async <T>(path: string, init: RequestInit, options: RequestOptions & { _isRetry?: boolean } = {}): Promise<T> => {
  const baseUrl = normalizeBaseUrl(CHAT_API_CONFIG.BASE_URL);
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (options.auth !== false) {
    const firebaseToken = await getFirebaseIdToken(!!options._isRetry);
    console.log(`[ChatApi] Request to ${path} (retry: ${!!options._isRetry})`);
    headers.set('Authorization', `Bearer ${firebaseToken}`);
  }

  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  let data: any = null;
  try { 
    const text = await response.text();
    data = text ? JSON.parse(text) : null; 
  } catch { 
    data = null; 
  }

  if (!response.ok) {
    console.log(`[ChatApi] Error response from ${path}: ${response.status}`);
    // Se for não autorizado e ainda não tentamos o retry, tenta forçar um novo token
    if (response.status === 401 && !options._isRetry && auth.currentUser) {
      console.warn('[ChatApi] Token rejeitado (401). Forçando renovação e tentando novamente...');
      invalidateCachedToken();
      return requestJson<T>(path, init, { ...options, _isRetry: true });
    }

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

export const chatDeleteMe = async () => requestJson<any>('/api/users/me', { method: 'DELETE' });
