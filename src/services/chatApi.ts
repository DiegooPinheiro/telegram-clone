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
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');
const toAbsoluteUrl = (baseUrl: string, url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${normalizeBaseUrl(baseUrl)}${url}`;
  return `${normalizeBaseUrl(baseUrl)}/${url}`;
};

const getFirebaseIdToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  }

  return user.getIdToken();
};

const requestJson = async <T>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {}
): Promise<T> => {
  const baseUrl = normalizeBaseUrl(CHAT_API_CONFIG.BASE_URL);
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log(`[ChatAPI] Fetching: ${url}`);

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const needsAuth = options.auth !== false;
  if (needsAuth) {
    const firebaseToken = await getFirebaseIdToken();
    headers.set('Authorization', `Bearer ${firebaseToken}`);
  }

  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.log(`[ChatAPI] Error Response (${response.status}):`, data);
    const message =
      data && typeof data === 'object' && data.message ? data.message : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data as T;
};

export type ChatAuthResponse = {
  _id: string;
  username: string;
  nome: string;
  foto?: string;
};

export const chatSyncFirebaseUser = async (
  payload: FirebaseExchangePayload
): Promise<ChatAuthResponse> => {
  return requestJson<ChatAuthResponse>(
    '/api/auth/firebase',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: true }
  );
};

export const chatListUsers = async (q?: string): Promise<ChatApiUser[]> => {
  const qp = q ? `?q=${encodeURIComponent(q)}` : '';
  return requestJson<ChatApiUser[]>(`/api/users${qp}`, { method: 'GET' });
};

export const chatGetConversations = async (userId: string): Promise<ChatApiConversation[]> => {
  return requestJson<ChatApiConversation[]>(`/api/conversations/${userId}`, { method: 'GET' });
};

export const chatCreateConversation = async (participantId: string): Promise<ChatApiConversation> => {
  return requestJson<ChatApiConversation>(
    '/api/conversations',
    {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }
  );
};

export const chatDeleteConversation = async (conversationId: string): Promise<{ message?: string } | any> => {
  return requestJson<{ message?: string }>(`/api/conversations/${conversationId}`, { method: 'DELETE' });
};

export const chatGetMessages = async (conversationId: string): Promise<ChatApiMessage[]> => {
  return requestJson<ChatApiMessage[]>(`/api/messages/${conversationId}`, { method: 'GET' });
};

export const chatSendMessageRest = async (payload: {
  conversationId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
}): Promise<ChatApiMessage> => {
  return requestJson<ChatApiMessage>(
    '/api/messages',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
};

export const chatUploadMedia = async (file: {
  uri: string;
  name: string;
  type: string;
}): Promise<{ mediaUrl: string; mediaType: string; fileName?: string; size?: number }> => {
  const form = new FormData();
  // @ts-expect-error React Native FormData file
  form.append('media', file);

  const uploaded = await requestJson<{ mediaUrl: string; mediaType: string; fileName?: string; size?: number }>(
    '/api/media/upload',
    {
      method: 'POST',
      body: form,
    }
  );

  return {
    ...uploaded,
    mediaUrl: toAbsoluteUrl(CHAT_API_CONFIG.BASE_URL, uploaded.mediaUrl),
  };
};
