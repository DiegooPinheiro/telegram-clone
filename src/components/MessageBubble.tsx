import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import useTheme from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MessageBubbleProps {
  id?: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: number;
  isMine: boolean;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  selectionMode?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onImagePress?: (payload: { uri: string; timestamp: number; senderName?: string }) => void;
  onFilePress?: (payload: { uri: string; fileName: string; mediaType?: string }) => void;
  onAudioPress?: (payload: { uri: string; fileName: string; mediaType?: string }) => void;
  fileOpening?: boolean;
  isAudioPlaying?: boolean;
  audioProgress?: number;
  audioPositionLabel?: string;
  audioDurationLabel?: string;
}

export default function MessageBubble({
  id,
  message,
  mediaUrl,
  mediaType,
  timestamp,
  isMine,
  senderName,
  status = 'delivered',
  selectionMode = false,
  selected = false,
  onPress,
  onLongPress,
  onImagePress,
  onFilePress,
  onAudioPress,
  fileOpening = false,
  isAudioPlaying = false,
  audioProgress = 0,
  audioPositionLabel = '0:00',
  audioDurationLabel = '0:00',
}: MessageBubbleProps) {
  const { colors, isDark } = useTheme();
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    Animated.spring(selectAnim, {
      toValue: selected ? 1 : 0,
      damping: 16,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [selectAnim, selected]);

  useEffect(() => {
    if (!mediaUrl || mediaType !== 'image') {
      setImageSize(null);
      return;
    }

    let active = true;

    Image.getSize(
      mediaUrl,
      (width, height) => {
        if (!active || !width || !height) return;
        setImageSize({ width, height });
      },
      () => {
        if (!active) return;
        setImageSize(null);
      }
    );

    return () => {
      active = false;
    };
  }, [mediaType, mediaUrl]);
  
  const time = new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const isImage = !!mediaUrl && mediaType === 'image';
  const isAudio = !!mediaUrl && isAudioMedia(mediaType, fileNameFromMessage(message, mediaUrl));
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
  const selectionScale = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const selectionOpacity = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const imageFrame = useMemo(() => {
    const maxWidth = 250;
    const maxHeight = 340;
    const minWidth = 160;

    if (!imageSize?.width || !imageSize?.height) {
      return { width: 240, height: 240 };
    }

    const ratio = imageSize.width / imageSize.height;
    let width = imageSize.width;
    let height = imageSize.height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / ratio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    if (width < minWidth) {
      width = minWidth;
      height = width / ratio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }, [imageSize]);
  const fileName = useMemo(() => fileNameFromMessage(message, mediaUrl), [mediaUrl, message]);
  const fileExtension = useMemo(() => {
    const parts = fileName.split('.');
    if (parts.length < 2) return 'DOC';
    return parts.pop()!.slice(0, 4).toUpperCase();
  }, [fileName]);
  const fileSubtitle = useMemo(() => {
    if (fileExtension === 'PDF') return 'Documento PDF';
    if (['DOC', 'DOCX'].includes(fileExtension)) return 'Documento';
    if (['XLS', 'XLSX', 'CSV'].includes(fileExtension)) return 'Planilha';
    if (['ZIP', 'RAR', '7Z'].includes(fileExtension)) return 'Arquivo compactado';
    if (['TXT', 'MD'].includes(fileExtension)) return 'Arquivo de texto';
    return 'Toque para abrir';
  }, [fileExtension]);

  return (
    <TouchableOpacity
      key={id}
      activeOpacity={selectionMode ? 0.8 : 0.95}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={220}
      style={[
        styles.row,
        isMine ? styles.rowMine : styles.rowTheirs,
        selectionMode ? styles.rowSelectionMode : null,
      ]}
    >
      {selectionMode && !isMine ? (
        <View style={styles.selectionRailLeft}>
          <Animated.View
            style={[
              styles.selectionCircle,
              selected ? styles.selectionCircleActive : null,
              {
                opacity: selectionOpacity,
                transform: [{ scale: selectionScale }],
              },
            ]}
          >
            {selected ? <MaterialCommunityIcons name="check" size={16} color="#fff" /> : null}
          </Animated.View>
        </View>
      ) : null}

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
            selected
              ? {
                  backgroundColor: isMine
                    ? (isDark ? '#6f8ec8' : '#dce7ff')
                    : (isDark ? '#2a3950' : '#edf3ff'),
                }
              : null,
          ]}
        >
        {!isMine && senderName && (
          <Text style={[styles.senderName, { color: colors.primary }]}>{senderName}</Text>
        )}

        {mediaUrl ? (
          isImage ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                if (!mediaUrl) return;
                onImagePress?.({ uri: mediaUrl, timestamp, senderName });
              }}
              style={[styles.imageWrap, imageFrame]}
            >
              <Image source={{ uri: mediaUrl }} style={[styles.image, imageFrame]} resizeMode="contain" />
            </TouchableOpacity>
          ) : isAudio ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                if (selectionMode) {
                  onPress?.();
                  return;
                }
                if (!mediaUrl) return;
                onAudioPress?.({ uri: mediaUrl, fileName, mediaType });
              }}
              style={[styles.audioRow, { backgroundColor: isMine ? '#69a9de' : '#5f96d2' }]}
              disabled={fileOpening}
            >
              <View style={styles.audioThumb}>
                <MaterialCommunityIcons
                  name={isAudioPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#ffffff"
                />
              </View>

              <View style={styles.audioBody}>
                <Text style={styles.audioTitle} numberOfLines={1}>
                  {trimAudioTitle(fileName)}
                </Text>
                <View style={styles.audioProgressTrack}>
                  <View style={[styles.audioProgressFill, { width: `${Math.max(0, Math.min(100, audioProgress * 100))}%` }]} />
                </View>
                <Text style={styles.audioTime}>
                  {audioPositionLabel} / {audioDurationLabel}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color="rgba(255,255,255,0.92)"
                style={styles.audioMenuIcon}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => {
                if (selectionMode) {
                  onPress?.();
                  return;
                }

                if (!mediaUrl) return;
                onFilePress?.({
                  uri: mediaUrl,
                  fileName,
                  mediaType,
                });
              }}
              style={[styles.fileRow, { backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}
              disabled={fileOpening}
            >
              <View style={styles.fileIconCircle}>
                {fileOpening ? (
                  <ActivityIndicator size="small" color={isMine ? '#6f8ec8' : colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name={fileExtension === 'PDF' ? 'file-pdf-box' : 'file-document-outline'}
                    size={28}
                    color={isMine ? '#6f8ec8' : colors.primary}
                  />
                )}
              </View>

              <View style={styles.fileBody}>
                <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {fileName}
                </Text>
                <Text style={[styles.fileSubtitle, { color: metaColor }]} numberOfLines={1}>
                  {fileOpening ? 'Abrindo arquivo...' : fileSubtitle}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={metaColor}
                style={styles.fileMenuIcon}
              />
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
            {
              borderBottomColor: selected
                ? (isMine
                  ? (isDark ? '#6f8ec8' : '#dce7ff')
                  : (isDark ? '#2a3950' : '#edf3ff'))
                : (isMine ? colors.bubbleMine : colors.bubbleTheirs),
            }
          ]} />
        </View>
      </View>
      {selectionMode && isMine ? (
        <View style={styles.selectionRailRight}>
          <Animated.View
            style={[
              styles.selectionCircle,
              selected ? styles.selectionCircleActive : null,
              {
                opacity: selectionOpacity,
                transform: [{ scale: selectionScale }],
              },
            ]}
          >
            {selected ? <MaterialCommunityIcons name="check" size={16} color="#fff" /> : null}
          </Animated.View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const fileNameFromMessage = (message: string, mediaUrl?: string) => {
  if (message?.trim()) {
    return message.trim();
  }

  if (!mediaUrl) {
    return 'Arquivo';
  }

  const lastChunk = mediaUrl.split('/').pop()?.split('?')[0] || 'Arquivo';
  try {
    return decodeURIComponent(lastChunk);
  } catch {
    return lastChunk;
  }
};

const isAudioMedia = (mediaType?: string, fileName?: string) => {
  if (mediaType === 'audio' || mediaType?.startsWith?.('audio/')) {
    return true;
  }

  const ext = fileName?.split('.').pop()?.toLowerCase();
  return ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus'].includes(ext || '');
};

const trimAudioTitle = (value: string) => {
  return value.replace(/\.[a-z0-9]{2,5}$/i, '');
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  rowSelectionMode: {
    paddingHorizontal: 6,
  },
  wrapper: {
    maxWidth: '84%',
    marginVertical: 2,
    paddingHorizontal: 4,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: 240,
    height: 240,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
    minWidth: 220,
    maxWidth: 290,
  },
  fileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileBody: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  fileSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  fileMenuIcon: {
    marginLeft: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 230,
    maxWidth: 300,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 8,
    marginBottom: 4,
  },
  audioThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  audioBody: {
    flex: 1,
    minWidth: 0,
  },
  audioTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  audioProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.38)',
    marginTop: 8,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  audioTime: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '500',
  },
  audioMenuIcon: {
    marginLeft: 8,
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
  selectionRailLeft: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionRailRight: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectionCircleActive: {
    borderColor: '#43A047',
    backgroundColor: '#43A047',
  },
});
