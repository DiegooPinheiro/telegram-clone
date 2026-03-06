import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  message: string;
  timestamp: number;
  isMine: boolean;
  senderName?: string;
}

export default function MessageBubble({
  message,
  timestamp,
  isMine,
  senderName,
}: MessageBubbleProps) {
  const time = new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View 
      style={[
        styles.container, 
        isMine ? styles.mine : styles.theirs,
        { backgroundColor: isMine ? '#5fa8df' : '#1c1f26' }
      ]}
    >
      {!isMine && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <Text style={styles.messageText}>{message}</Text>
      <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
    marginVertical: 2,
    marginHorizontal: 12,
  },
  mine: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    color: '#86baff',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
