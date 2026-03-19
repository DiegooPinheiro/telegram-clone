import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import useTheme from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: number;
  isMine: boolean;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function MessageBubble({
  message,
  mediaUrl,
  mediaType,
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

  const openMedia = async () => {
    if (!mediaUrl) return;
    try {
      await Linking.openURL(mediaUrl);
    } catch {
      // ignore
    }
  };

  const isImage = !!mediaUrl && mediaType === 'image';
  const showText = !!message?.trim();

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

        {mediaUrl ? (
          isImage ? (
            <TouchableOpacity activeOpacity={0.9} onPress={openMedia} style={styles.imageWrap}>
              <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={openMedia} style={styles.fileRow}>
              <MaterialCommunityIcons name="file-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                {showText ? message : 'Arquivo'}
              </Text>
            </TouchableOpacity>
          )
        ) : null}

        {showText && (!mediaUrl || isImage) ? (
          <Text style={[styles.messageText, { color: colors.textPrimary }]}>{message}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timestamp,
              { color: isMine ? 'rgba(255, 255, 255, 0.55)' : colors.textSecondary },
            ]}
          >
            {time}
          </Text>
          {isMine && status !== 'sending' ? (
            <MaterialCommunityIcons
              name={status === 'read' ? 'check-all' : 'check'}
              size={14}
              color={isMine ? 'rgba(255, 255, 255, 0.55)' : colors.primary}
              style={styles.statusIcon}
            />
          ) : null}
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
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 11,
  },
  statusIcon: {
    marginLeft: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
    alignSelf: 'flex-start',
    maxWidth: 240,
  },
  image: {
    width: 240,
    height: 240,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 4,
    maxWidth: 260,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
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
