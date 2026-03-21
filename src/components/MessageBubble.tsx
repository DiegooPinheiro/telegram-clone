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
  const { colors, isDark } = useTheme();
  
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
  const metaColor = isMine
    ? (isDark ? '#9db7d3' : 'rgba(93, 108, 77, 0.88)')
    : (isDark ? '#7f91a4' : colors.textTimestamp);
  const statusColor = status === 'read'
    ? (isDark ? '#8ec3f5' : '#4fa3f7')
    : isMine
      ? (isDark ? '#9db7d3' : 'rgba(93, 108, 77, 0.88)')
      : colors.primary;
  const statusIconName =
    status === 'sending'
      ? 'clock-outline'
      : status === 'sent'
        ? 'check'
        : 'check-all';

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
      <View
        style={[
          styles.container,
          isMine ? styles.mine : styles.theirs,
          {
            backgroundColor: isMine ? colors.bubbleMine : colors.bubbleTheirs,
            shadowOpacity: isDark ? 0.22 : 0.1,
            shadowRadius: isDark ? 4 : 2,
          },
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
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : null,
              isMine ? styles.messageTextWithMetaMine : null,
              !isMine ? styles.messageTextWithMetaTheirs : null,
              { color: colors.textPrimary },
            ]}
          >
            {message}
          </Text>
        ) : null}

        <View style={[styles.metaRow, isMine ? styles.metaRowMine : styles.metaRowTheirs]}>
          <Text
            style={[
              styles.timestamp,
              { color: metaColor },
            ]}
          >
            {time}
          </Text>
          {isMine ? (
            <MaterialCommunityIcons
              name={statusIconName}
              size={14}
              color={statusColor}
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
    maxWidth: '84%',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  wrapperMine: {
    alignSelf: 'flex-end',
  },
  wrapperTheirs: {
    alignSelf: 'flex-start',
  },
  container: {
    paddingHorizontal: 13,
    paddingTop: 9,
    paddingBottom: 6,
    borderRadius: 19,
    position: 'relative',
    minWidth: 90,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mine: {
    borderBottomRightRadius: 5,
    paddingTop: 9,
    paddingBottom: 7,
  },
  theirs: {
    borderBottomLeftRadius: 5,
  },
  messageContent: {
    // No specific layout needed, let the Text handle it
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 0,
  },
  messageTextMine: {
    marginTop: 0,
  },
  messageTextWithMetaMine: {
    paddingRight: 44,
    paddingBottom: 6,
  },
  messageTextWithMetaTheirs: {
    paddingRight: 38,
    paddingBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    lineHeight: 11,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 3,
  },
  metaRow: {
    position: 'absolute',
    right: 12,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  metaRowMine: {
    right: 12,
  },
  metaRowTheirs: {
    right: 12,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  imageWrap: {
    borderRadius: 16,
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
    right: -5,
    bottom: 2,
    transform: [{ rotate: '126deg' }],
  },
  tailTheirs: {
    left: -5,
    bottom: 2,
    transform: [{ rotate: '234deg' }],
  },
});
