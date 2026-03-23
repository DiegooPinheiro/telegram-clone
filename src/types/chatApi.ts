export type ChatApiUser = {
  _id: string;
  username: string;
  nome: string;
  foto?: string;
};

export type ChatApiConversation = {
  _id: string;
  participants: ChatApiUser[];
  unreadCount?: number;
  lastMessage?: {
    text?: string;
    senderId?: string | ChatApiUser;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ChatApiMessage = {
  _id: string;
  conversationId: string;
  senderId: string | ChatApiUser;
  clientMessageId?: string | null;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  read?: boolean;
  edited?: boolean;
  createdAt: string;
  updatedAt: string;
};
