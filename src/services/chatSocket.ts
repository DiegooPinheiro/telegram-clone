import { io, Socket } from 'socket.io-client';
import { CHAT_API_CONFIG } from '../config/chatApiConfig';
import type { ChatApiMessage } from '../types/chatApi';

type ReceiveMessageHandler = (message: ChatApiMessage | any) => void;

let socket: Socket | null = null;
let currentUserId: string | null = null;
const receiveHandlers = new Set<ReceiveMessageHandler>();

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

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

export const isSocketConnected = () => {
  return !!socket?.connected;
};
