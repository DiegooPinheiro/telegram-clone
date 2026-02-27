export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}
