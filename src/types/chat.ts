export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  type: 'user' | 'group';
}
