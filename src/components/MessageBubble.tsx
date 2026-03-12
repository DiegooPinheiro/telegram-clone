import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: string;
  timestamp: number;
  isMine: boolean;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function MessageBubble({
  message,
  timestamp,
  isMine,
  senderName,
  status = 'delivered',
}: MessageBubbleProps) {
  const { colors } = useTheme();
  
  const time = new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
      <View
        style={[
          styles.container,
          isMine ? styles.mine : styles.theirs,
          { backgroundColor: isMine ? colors.bubbleMine : colors.bubbleTheirs },
        ]}
      >
        {!isMine && senderName && (
          <Text style={[styles.senderName, { color: colors.primary }]}>{senderName}</Text>
        )}
        
        <View style={styles.messageContent}>
          <Text style={[styles.messageText, { color: colors.textPrimary }]}>
            {message}
            {/* 
               This is the secret: a nested View inside a Text element 
               acts as an inline-block that follows the text flow.
            */}
            <View style={styles.timeInlineContainer}>
              <Text
                style={[
                  styles.timestamp,
                  { color: isMine ? 'rgba(255, 255, 255, 0.55)' : colors.textSecondary },
                ]}
              >
                {time}
              </Text>
              {isMine && status !== 'sending' && (
                <MaterialCommunityIcons
                  name={status === 'read' ? 'check-all' : 'check'}
                  size={14}
                  color={isMine ? 'rgba(255, 255, 255, 0.55)' : colors.primary}
                  style={styles.statusIcon}
                />
              )}
            </View>
          </Text>
        </View>

        {/* Tail (Beak) using a more integrated approach */}
        <View style={[
          styles.tail,
          isMine ? styles.tailMine : styles.tailTheirs,
          { borderBottomColor: isMine ? colors.bubbleMine : colors.bubbleTheirs }
        ]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '85%',
    marginVertical: 1,
    paddingHorizontal: 10,
  },
  wrapperMine: {
    alignSelf: 'flex-end',
  },
  wrapperTheirs: {
    alignSelf: 'flex-start',
  },
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 5,
    borderRadius: 18,
    position: 'relative',
    minWidth: 90,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mine: {
    borderBottomRightRadius: 2,
  },
  theirs: {
    borderBottomLeftRadius: 2,
  },
  messageContent: {
    // No specific layout needed, let the Text handle it
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timeInlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // These values are key for the "inline-block" effect
    paddingLeft: 10,
    height: 18,
    marginBottom: -4, // Adjust to align with text baseline
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 11,
  },
  statusIcon: {
    marginLeft: 3,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tailMine: {
    right: -6,
    transform: [{ rotate: '130deg' }],
  },
  tailTheirs: {
    left: -6,
    transform: [{ rotate: '230deg' }],
  },
});
