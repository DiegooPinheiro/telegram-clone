import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  // Headers
  h1: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  h2: { fontSize: 22, fontWeight: '600', color: '#000' },
  h3: { fontSize: 18, fontWeight: '600', color: '#000' },

  // Body
  body: { fontSize: 16, color: '#000', lineHeight: 22 },
  bodySmall: { fontSize: 14, color: '#000', lineHeight: 20 },

  // Chat
  message: { fontSize: 15, color: '#000', lineHeight: 20 },
  timestamp: { fontSize: 11, color: '#8E8E93' },
  senderName: { fontSize: 13, fontWeight: '600', color: '#0088cc' },

  // UI
  caption: { fontSize: 12, color: '#707579' },
  button: { fontSize: 16, fontWeight: '600', color: '#fff' },
  tabLabel: { fontSize: 10, fontWeight: '500' },

  // List items
  listTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
  listSubtitle: { fontSize: 14, color: '#707579' },
};
