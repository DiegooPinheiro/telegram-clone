import { CHAT_API_CONFIG } from '../config/chatApiConfig';
import { getChatSession } from './chatSession';
import type { ChatApiConversation, ChatApiMessage, ChatApiUser } from '../types/chatApi';

type Json = Record<string, any>;

type RequestOptions = {
  auth?: boolean;
};

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

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
    const session = await getChatSession();
    if (!session?.token) {
      throw new Error('Sessão do chat ausente. Faça login novamente.');
    }
    headers.set('Authorization', `Bearer ${session.token}`);
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
    const message = (data && typeof data === 'object' && data.message) ? data.message : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return data as T;
};

export type ChatAuthResponse = {
  _id: string;
  username: string;
  nome: string;
  foto?: string;
  token: string;
};

export const chatRegister = async (payload: {
  username: string;
  nome: string;
  password: string;
  foto?: string;
}): Promise<ChatAuthResponse> => {
  return requestJson<ChatAuthResponse>(
    '/api/users',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: false }
  );
};

export const chatLogin = async (payload: {
  username: string;
  password: string;
}): Promise<ChatAuthResponse> => {
  return requestJson<ChatAuthResponse>(
    '/api/users/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { auth: false }
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
}): Promise<{ mediaUrl: string; mediaType: string }> => {
  const form = new FormData();
  // @ts-expect-error React Native FormData file
  form.append('media', file);

  return requestJson<{ mediaUrl: string; mediaType: string }>(
    '/api/media/upload',
    {
      method: 'POST',
      body: form,
    }
  );
};

