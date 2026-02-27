import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

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
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
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
    backgroundColor: colors.bubbleMine,
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bubbleTheirs,
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
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textTimestamp,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimestamp: {
    color: '#6dab4f',
  },
});
