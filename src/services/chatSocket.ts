import { io, Socket } from 'socket.io-client';
import { CHAT_API_CONFIG } from '../config/chatApiConfig';
import type { ChatApiMessage } from '../types/chatApi';

type ReceiveMessageHandler = (message: ChatApiMessage | any) => void;
type TypingEvent =
  | 'typing'
  | 'stop_typing'
  | 'user_typing'
  | 'user_stop_typing'
  | 'typing_status'
  | 'typingStatus';

type TypingHandler = (event: TypingEvent, payload: any) => void;

let socket: Socket | null = null;
let currentUserId: string | null = null;
const receiveHandlers = new Set<ReceiveMessageHandler>();
const typingHandlers = new Set<TypingHandler>();
const typingWrappers = new Map<
  TypingHandler,
  {
    typing: (payload: any) => void;
    stop_typing: (payload: any) => void;
    user_typing: (payload: any) => void;
    user_stop_typing: (payload: any) => void;
    typing_status: (payload: any) => void;
    typingStatus: (payload: any) => void;
  }
>();

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const ensureTypingListeners = (handler: TypingHandler) => {
  if (!typingWrappers.has(handler)) {
    typingWrappers.set(handler, {
      typing: (payload) => handler('typing', payload),
      stop_typing: (payload) => handler('stop_typing', payload),
      user_typing: (payload) => handler('user_typing', payload),
      user_stop_typing: (payload) => handler('user_stop_typing', payload),
      typing_status: (payload) => handler('typing_status', payload),
      typingStatus: (payload) => handler('typingStatus', payload),
    });
  }

  const wrappers = typingWrappers.get(handler)!;
  socket?.on('typing', wrappers.typing);
  socket?.on('stop_typing', wrappers.stop_typing);
  socket?.on('user_typing', wrappers.user_typing);
  socket?.on('user_stop_typing', wrappers.user_stop_typing);
  socket?.on('typing_status', wrappers.typing_status);
  socket?.on('typingStatus', wrappers.typingStatus);
};

const removeTypingListeners = (handler: TypingHandler) => {
  const wrappers = typingWrappers.get(handler);
  if (!wrappers) return;

  socket?.off('typing', wrappers.typing);
  socket?.off('stop_typing', wrappers.stop_typing);
  socket?.off('user_typing', wrappers.user_typing);
  socket?.off('user_stop_typing', wrappers.user_stop_typing);
  socket?.off('typing_status', wrappers.typing_status);
  socket?.off('typingStatus', wrappers.typingStatus);
};

export const connectChatSocket = (userId: string) => {
  if (socket && currentUserId === userId) {
    return socket;
  }

  disconnectChatSocket();

  currentUserId = userId;
  socket = io(normalizeBaseUrl(CHAT_API_CONFIG.BASE_URL), {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    socket?.emit('connect_user', userId);
  });

  for (const handler of receiveHandlers) {
    socket.on('receive_message', handler);
  }

  for (const handler of typingHandlers) {
    ensureTypingListeners(handler);
  }

  return socket;
};

export const disconnectChatSocket = () => {
  if (!socket) {
    currentUserId = null;
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  currentUserId = null;
};

export const onReceiveMessage = (handler: ReceiveMessageHandler) => {
  receiveHandlers.add(handler);
  socket?.on('receive_message', handler);

  return () => {
    receiveHandlers.delete(handler);
    socket?.off('receive_message', handler);
  };
};

export const onTypingEvent = (handler: TypingHandler) => {
  typingHandlers.add(handler);
  ensureTypingListeners(handler);

  return () => {
    typingHandlers.delete(handler);
    removeTypingListeners(handler);
  };
};

export const sendMessageSocket = (payload: {
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
}) => {
  if (!socket) {
    throw new Error('Socket não conectado.');
  }

  socket.emit('send_message', payload);
};

export const sendTypingSocket = (payload: { conversationId: string; senderId: string; receiverId: string }) => {
  if (!socket) return;
  socket.emit('typing', { ...payload, typing: true });
  socket.emit('typing_status', { ...payload, typing: true });
  socket.emit('typingStatus', { ...payload, typing: true });
};

export const sendStopTypingSocket = (payload: { conversationId: string; senderId: string; receiverId: string }) => {
  if (!socket) return;
  socket.emit('stop_typing', { ...payload, typing: false });
  socket.emit('typing_status', { ...payload, typing: false });
  socket.emit('typingStatus', { ...payload, typing: false });
};

export const isSocketConnected = () => {
  return !!socket?.connected;
};
