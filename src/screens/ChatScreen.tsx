import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Audio, type AVPlaybackStatusSuccess } from 'expo-av';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import MessageBubble from '../components/MessageBubble';
import MessageInput, { type MessageInputHandle } from '../components/MessageInput';
import EmojiPickerPanel, { DEFAULT_EMOJI_PANEL_HEIGHT } from '../components/EmojiPickerPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import useOnlineStatusByEmail from '../hooks/useOnlineStatusByEmail';
import {
  chatCreateConversation,
  chatDeleteConversation,
  chatDeleteManyMessages,
  chatGetMessages,
  chatUploadMedia,
} from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import {
  markMessagesReadSocket,
  onMessagesDeleted,
  onMessagesRead,
  onReceiveMessage,
  onTypingEvent,
  sendMessageSocket,
  sendStopTypingSocket,
  sendTypingSocket,
} from '../services/chatSocket';
import type { ChatApiMessage, ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type LocalMessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
type LocalChatMessage = ChatApiMessage & {
  localStatus?: LocalMessageStatus;
  localOnly?: boolean;
};
type ViewerImage = {
  uri: string;
  timestamp: number;
  senderName?: string;
};
type ActiveAudio = {
  uri: string;
  fileName: string;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
};

export default function ChatScreen({ navigation, route }: Props) {
  const EMOJI_SEARCH_LIFT = 176;
  const { colors } = useTheme();
  const { conversationId: initialConversationId, userId: receiverId, name, avatar, username } = route.params;

  const flatListRef = useRef<FlatList>(null);
  const messageInputRef = useRef<MessageInputHandle | null>(null);
  const openingFileRef = useRef(false);
  const audioSoundRef = useRef<Audio.Sound | null>(null);
  const audioActionLockRef = useRef(false);
  const deletingMessagesRef = useRef(false);
  const sendingMessageRef = useRef(false);
  const sendingMediaRef = useRef(false);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lastKeyboardHeight, setLastKeyboardHeight] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearchFocused, setEmojiSearchFocused] = useState(false);
  const [keyboardOpening, setKeyboardOpening] = useState(false);
  const keyboardOpeningTimeoutRef = useRef<any>(null);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteForBoth, setDeleteForBoth] = useState(false);
  const [viewerImage, setViewerImage] = useState<ViewerImage | null>(null);
  const [openingFileUri, setOpeningFileUri] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<ActiveAudio | null>(null);
  const [deletingMessages, setDeletingMessages] = useState(false);

  const { statusText, online } = useOnlineStatusByEmail(username || '', !!username);
  const selectionMode = selectedMessageIds.length > 0;

  useEffect(() => {
    setConversationId(initialConversationId ?? null);
  }, [initialConversationId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        selectionMode ? (
          <TouchableOpacity activeOpacity={0.75} onPress={() => setSelectedMessageIds([])}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : undefined
      ),
      headerTitle: () => (
        selectionMode ? (
          <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>
            {selectedMessageIds.length}
          </Text>
        ) : (
          <View style={styles.headerTitleWrap}>
            <Avatar name={name} size={38} uri={avatar ?? null} online={online} />
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.headerStatus, { color: colors.textSecondary }]} numberOfLines={1}>
                {otherTyping ? 'digitando...' : (statusText || 'via Chat API')}
              </Text>
            </View>
          </View>
        )
      ),
      headerRight: () => (
        selectionMode ? (
          <View style={styles.selectionActions}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Editar', 'Em breve.')}>
              <Ionicons name="create-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Copiar', 'Em breve.')}>
              <Ionicons name="copy-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Encaminhar', 'Em breve.')}>
              <Ionicons name="arrow-redo-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} onPress={() => setDeleteModalVisible(true)}>
              <Ionicons name="trash-outline" size={23} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Chamada', 'Em breve.')}>
              <Ionicons name="call-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} onPress={() => setHeaderMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )
      ),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    });
  }, [navigation, name, colors.background, colors.textPrimary, colors.textSecondary, avatar, online, otherTyping, statusText, selectionMode, selectedMessageIds.length]);

  useEffect(() => {
    if (!selectionMode) {
      setDeleteModalVisible(false);
      setDeleteForBoth(false);
    }
  }, [selectionMode]);

  useEffect(() => {
    return () => {
      audioSoundRef.current?.unloadAsync().catch(() => undefined);
      audioSoundRef.current = null;
    };
  }, []);

  const handleDeleteConversation = useCallback(() => {
    if (!conversationId) {
      setHeaderMenuVisible(false);
      return;
    }

    Alert.alert(
      'Excluir conversa',
      'Tem certeza que deseja excluir esta conversa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatDeleteConversation(conversationId);
              setHeaderMenuVisible(false);
              navigation.goBack();
            } catch (error: any) {
              console.error('Erro ao excluir conversa:', error);
              Alert.alert(
                'Erro',
                error?.message ||
                  'Não foi possível excluir. Verifique se o backend possui rota DELETE /api/conversations/:id.'
              );
            }
          },
        },
      ]
    );
  }, [conversationId, navigation]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      const h = event.endCoordinates?.height ?? 0;
      setKeyboardHeight(h);
      if (h > 0) setLastKeyboardHeight(h);
      setKeyboardOpening(false);
      if (keyboardOpeningTimeoutRef.current) {
        clearTimeout(keyboardOpeningTimeoutRef.current);
        keyboardOpeningTimeoutRef.current = null;
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const session = await getChatSession();
        if (!session?.userId) {
          if (active) {
            setMyUserId(null);
            setMessages([]);
          }
          return;
        }

        if (active) {
          setMyUserId(session.userId);
        }

        if (!conversationId) {
          if (active) {
            setMessages([]);
          }
          return;
        }

        const fetched = await chatGetMessages(conversationId);
        if (active) {
          setMessages(
            fetched.map((message) => ({
              ...message,
              localStatus: message.read ? 'read' : 'delivered',
            }))
          );
        }
      } catch (error: any) {
        console.error('Erro ao carregar mensagens:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível carregar mensagens.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = onReceiveMessage((message: any) => {
      if (!message || message.conversationId !== conversationId) {
        return;
      }

      const normalized: LocalChatMessage = {
        ...message,
        // socket pode enviar senderId como string (sem populate)
        senderId: message.senderId,
        clientMessageId: message.clientMessageId || null,
        createdAt: message.createdAt || new Date().toISOString(),
        updatedAt: message.updatedAt || message.createdAt || new Date().toISOString(),
        localStatus: message.read ? 'read' : 'delivered',
      };

      const normalizedSenderId = extractUserId(normalized.senderId);
      const incomingFromOtherUser =
        !!normalizedSenderId &&
        !!myUserId &&
        normalizedSenderId !== myUserId;

      setMessages((prev) => {
        const byIdIndex = prev.findIndex((m) => m._id === normalized._id);
        if (byIdIndex >= 0) {
          const next = [...prev];
          next[byIdIndex] = {
            ...next[byIdIndex],
            ...normalized,
            localStatus: normalized.read ? 'read' : next[byIdIndex].localStatus || 'delivered',
            localOnly: false,
          };
          return next;
        }

        const optimisticIndex = prev.findIndex((m) =>
          m.localOnly &&
          (
            (!!normalized.clientMessageId && normalized.clientMessageId === m.clientMessageId) ||
            (
              extractUserId(m.senderId) === extractUserId(normalized.senderId) &&
              m.text === normalized.text &&
              m.mediaUrl === normalized.mediaUrl &&
              m.mediaType === normalized.mediaType
            )
          )
        );

        if (optimisticIndex >= 0) {
          const next = [...prev];
          next[optimisticIndex] = {
            ...normalized,
            localStatus: normalized.read ? 'read' : 'delivered',
            localOnly: false,
          };
          return next;
        }

        return [...prev, normalized];
      });

      if (incomingFromOtherUser && conversationId) {
        markMessagesReadSocket(conversationId);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId, myUserId]);

  useEffect(() => {
    const unsubscribe = onMessagesRead((payload: any) => {
      if (!payload || payload.conversationId !== conversationId || !Array.isArray(payload.messageIds)) {
        return;
      }

      const readSet = new Set(payload.messageIds.map((id: string) => String(id)));
      setMessages((prev) =>
        prev.map((message) =>
          readSet.has(String(message._id))
            ? {
                ...message,
                read: true,
                localStatus: 'read',
              }
            : message
        )
      );
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = onMessagesDeleted((payload: any) => {
      if (!payload || payload.conversationId !== conversationId || !Array.isArray(payload.messageIds)) {
        return;
      }

      const deletedSet = new Set(payload.messageIds.map((id: string) => String(id)));
      setMessages((prev) => prev.filter((message) => !deletedSet.has(String(message._id))));
      setSelectedMessageIds((prev) => prev.filter((id) => !deletedSet.has(String(id))));
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = onTypingEvent((event, payload: any) => {
      const convId = payload?.conversationId || payload?.conversation?._id;
      if (!convId || convId !== conversationId) return;

      const sender = payload?.senderId || payload?.userId || payload?.sender?._id || payload?.sender;
      if (sender && String(sender) !== String(receiverId)) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (event === 'stop_typing' || event === 'user_stop_typing' || payload?.typing === false) {
        setOtherTyping(false);
        return;
      }

      setOtherTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setOtherTyping(false);
      }, 4500);
    });

    return () => {
      unsubscribe?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [conversationId, receiverId]);

  const ensureConversationId = useCallback(async () => {
    if (conversationId) {
      return conversationId;
    }

    const conversation = await chatCreateConversation(receiverId);
    setConversationId(conversation._id);
    navigation.setParams({ conversationId: conversation._id });
    return conversation._id;
  }, [conversationId, navigation, receiverId]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!myUserId) {
        Alert.alert('Erro', 'Sessão do chat ausente. Faça login novamente.');
        return;
      }

      if (sendingMessageRef.current) {
        return;
      }

      sendingMessageRef.current = true;

      let resolvedConversationId: string;
      try {
        resolvedConversationId = await ensureConversationId();
      } catch (error: any) {
        console.error('Erro ao iniciar conversa:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível iniciar a conversa.');
        sendingMessageRef.current = false;
        return;
      }

      const optimisticMessage: LocalChatMessage = {
        _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        clientMessageId: `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversationId: resolvedConversationId,
        senderId: myUserId,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        localStatus: 'sent',
        localOnly: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        sendMessageSocket({
          conversationId: resolvedConversationId,
          senderId: myUserId,
          receiverId,
          clientMessageId: optimisticMessage.clientMessageId || undefined,
          text,
        });
      } catch (error: any) {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
        console.error('Erro ao enviar:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível enviar a mensagem.');
      } finally {
        setTimeout(() => {
          sendingMessageRef.current = false;
        }, 220);
      }
    },
    [ensureConversationId, myUserId, receiverId]
  );

  const handleUploadAndSend = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      if (!myUserId) {
        Alert.alert('Erro', 'Sessão do chat ausente. Faça login novamente.');
        return;
      }

      if (sendingMediaRef.current) {
        return;
      }

      sendingMediaRef.current = true;

      setUploading(true);
      const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const resolvedConversationId = await ensureConversationId();
        const uploaded = await chatUploadMedia(file);
        const displayName = uploaded.fileName || file.name;
        const text = uploaded.mediaType === 'image' ? undefined : displayName;

        setMessages((prev) => [
          ...prev,
          {
            _id: optimisticId,
            clientMessageId,
            conversationId: resolvedConversationId,
            senderId: myUserId,
            text,
            mediaUrl: uploaded.mediaUrl,
            mediaType: uploaded.mediaType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            localStatus: 'sent',
            localOnly: true,
          },
        ]);

        sendMessageSocket({
          conversationId: resolvedConversationId,
          senderId: myUserId,
          receiverId,
          clientMessageId,
          text,
          mediaUrl: uploaded.mediaUrl,
          mediaType: uploaded.mediaType,
        });
      } catch (error: any) {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        console.error('Erro ao enviar mídia:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível enviar o arquivo.');
      } finally {
        setUploading(false);
        setTimeout(() => {
          sendingMediaRef.current = false;
        }, 260);
      }
    },
    [ensureConversationId, myUserId, receiverId]
  );

  const handleOpenFile = useCallback(
    async ({ uri, fileName, mediaType }: { uri: string; fileName: string; mediaType?: string }) => {
      if (openingFileRef.current) {
        return;
      }

      openingFileRef.current = true;
      setOpeningFileUri(uri);

      try {
        const normalizedName = sanitizeFileName(fileName || extractFileNameFromUrl(uri));
        const inferredMimeType = resolveMimeType(normalizedName, mediaType);

        if (Platform.OS !== 'android') {
          await Linking.openURL(uri);
          return;
        }

        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
          throw new Error('Armazenamento temporário indisponível.');
        }

        const localUri = `${cacheDir}${Date.now()}-${normalizedName}`;
        const downloaded = await FileSystem.downloadAsync(uri, localUri);
        const contentUri = await FileSystem.getContentUriAsync(downloaded.uri);

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: inferredMimeType,
          flags: 1,
        });
      } catch (error: any) {
        console.error('Erro ao abrir arquivo:', error);
        const message = String(error?.message || '');
        if (!message.includes('IntentLauncher activity is already started')) {
          Alert.alert(
            'Nao foi possivel abrir o arquivo',
            error?.message || 'Verifique se existe um aplicativo compatível instalado no aparelho.'
          );
        }
      } finally {
        setTimeout(() => {
          openingFileRef.current = false;
          setOpeningFileUri((current) => (current === uri ? null : current));
        }, 900);
      }
    },
    []
  );

  const handleAudioPress = useCallback(
    async ({ uri, fileName }: { uri: string; fileName: string; mediaType?: string }) => {
      if (audioActionLockRef.current) {
        return;
      }

      audioActionLockRef.current = true;

      try {
        if (activeAudio?.uri === uri && audioSoundRef.current) {
          const status = await audioSoundRef.current.getStatusAsync();
          if (!status.isLoaded) return;

          if (status.isPlaying) {
            await audioSoundRef.current.pauseAsync();
            setActiveAudio((prev) => (prev ? { ...prev, isPlaying: false } : prev));
          } else {
            await audioSoundRef.current.playAsync();
            setActiveAudio((prev) => (prev ? { ...prev, isPlaying: true } : prev));
          }
          return;
        }

        if (audioSoundRef.current) {
          await audioSoundRef.current.unloadAsync();
          audioSoundRef.current = null;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (playbackStatus) => {
            if (!playbackStatus.isLoaded) {
              return;
            }

            const loadedStatus = playbackStatus as AVPlaybackStatusSuccess;
            setActiveAudio((prev) => {
              if (!prev || prev.uri !== uri) {
                return prev;
              }

              return {
                ...prev,
                isPlaying: loadedStatus.isPlaying,
                positionMillis: loadedStatus.positionMillis || 0,
                durationMillis: loadedStatus.durationMillis || prev.durationMillis || 0,
              };
            });

            if (loadedStatus.didJustFinish) {
              setActiveAudio((prev) =>
                prev && prev.uri === uri
                  ? { ...prev, isPlaying: false, positionMillis: 0 }
                  : prev
              );
            }
          }
        );

        audioSoundRef.current = sound;
        const loadedStatus = status as AVPlaybackStatusSuccess;
        setActiveAudio({
          uri,
          fileName,
          isPlaying: loadedStatus.isPlaying ?? true,
          positionMillis: loadedStatus.positionMillis || 0,
          durationMillis: loadedStatus.durationMillis || 0,
        });
      } catch (error: any) {
        console.error('Erro ao reproduzir áudio:', error);
        Alert.alert('Erro', error?.message || 'Nao foi possivel reproduzir o áudio.');
      } finally {
        setTimeout(() => {
          audioActionLockRef.current = false;
        }, 260);
      }
    },
    [activeAudio?.uri]
  );

  const handleCloseAudioPlayer = useCallback(async () => {
    try {
      if (audioSoundRef.current) {
        await audioSoundRef.current.unloadAsync();
      }
    } catch {
      // ignore
    } finally {
      audioSoundRef.current = null;
      setActiveAudio(null);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    setAttachOpen(false);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Permita acesso à galeria para enviar arquivos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const name = asset.fileName || `media-${Date.now()}`;
    const type = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
    await handleUploadAndSend({ uri: asset.uri, name, type });
  }, [handleUploadAndSend]);

  const takePhoto = useCallback(async () => {
    setAttachOpen(false);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão', 'Permita acesso à câmera para enviar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const name = asset.fileName || `foto-${Date.now()}.jpg`;
    const type = asset.mimeType || 'image/jpeg';
    await handleUploadAndSend({ uri: asset.uri, name, type });
  }, [handleUploadAndSend]);

  const pickDocument = useCallback(async () => {
    setAttachOpen(false);

    const result: any = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result?.canceled) return;

    const asset = result?.assets?.[0] ?? (result?.type === 'success' ? result : null);
    if (!asset?.uri) return;

    const name = asset.name || `arquivo-${Date.now()}`;
    const type = asset.mimeType || 'application/octet-stream';
    await handleUploadAndSend({ uri: asset.uri, name, type });
  }, [handleUploadAndSend]);

  const renderMessage = useCallback(
    ({ item }: { item: LocalChatMessage }) => {
      const senderId = extractUserId(item.senderId);
      const isMine = !!myUserId && !!senderId && senderId === myUserId;

      const senderName = !isMine ? extractUserName(item.senderId) || name : undefined;
      const text = item.text ? String(item.text) : '';
      const timestamp = Math.floor(new Date(item.createdAt).getTime() / 1000);
      const status: LocalMessageStatus | undefined = isMine
        ? (item.read ? 'read' : item.localStatus || 'delivered')
        : undefined;

      const selected = selectedMessageIds.includes(item._id);

      return (
        <MessageBubble
          id={item._id}
          message={text}
          mediaUrl={item.mediaUrl}
          mediaType={item.mediaType}
          timestamp={timestamp}
          isMine={isMine}
          senderName={senderName}
          status={status}
          fileOpening={!!item.mediaUrl && openingFileUri === item.mediaUrl}
          selectionMode={selectionMode}
          selected={selected}
          onFilePress={handleOpenFile}
          onAudioPress={handleAudioPress}
          isAudioPlaying={!!item.mediaUrl && activeAudio?.uri === item.mediaUrl && activeAudio.isPlaying}
          audioProgress={
            !!item.mediaUrl && activeAudio?.uri === item.mediaUrl && activeAudio.durationMillis > 0
              ? activeAudio.positionMillis / activeAudio.durationMillis
              : 0
          }
          audioPositionLabel={
            !!item.mediaUrl && activeAudio?.uri === item.mediaUrl
              ? formatAudioTime(activeAudio.positionMillis)
              : '0:00'
          }
          audioDurationLabel={
            !!item.mediaUrl && activeAudio?.uri === item.mediaUrl && activeAudio.durationMillis > 0
              ? formatAudioTime(activeAudio.durationMillis)
              : '0:00'
          }
          onImagePress={({ uri, timestamp: imageTimestamp, senderName: imageSenderName }) => {
            if (selectionMode) {
              setSelectedMessageIds((prev) =>
                prev.includes(item._id)
                  ? prev.filter((id) => id !== item._id)
                  : [...prev, item._id]
              );
              return;
            }

            setViewerImage({
              uri,
              timestamp: imageTimestamp,
              senderName: imageSenderName,
            });
          }}
          onLongPress={() => {
            setSelectedMessageIds((prev) =>
              prev.includes(item._id) ? prev : [item._id]
            );
          }}
          onPress={() => {
            if (!selectionMode) return;
            setSelectedMessageIds((prev) =>
              prev.includes(item._id)
                ? prev.filter((id) => id !== item._id)
                : [...prev, item._id]
            );
          }}
        />
      );
    },
    [activeAudio, handleAudioPress, handleOpenFile, myUserId, name, openingFileUri, selectedMessageIds, selectionMode]
  );

  const handleConfirmDeleteMessages = useCallback(async () => {
    if (deletingMessagesRef.current || selectedMessageIds.length === 0) {
      return;
    }

    deletingMessagesRef.current = true;
    setDeletingMessages(true);

    try {
      await chatDeleteManyMessages({
        messageIds: selectedMessageIds,
        deleteForEveryone: deleteForBoth,
      });

      const selectedSet = new Set(selectedMessageIds);
      setMessages((prev) => prev.filter((message) => !selectedSet.has(message._id)));
      setDeleteModalVisible(false);
      setDeleteForBoth(false);
      setSelectedMessageIds([]);
    } catch (error: any) {
      console.error('Erro ao apagar mensagens:', error);
      Alert.alert('Erro', error?.message || 'Nao foi possivel apagar as mensagens.');
    } finally {
      deletingMessagesRef.current = false;
      setDeletingMessages(false);
    }
  }, [deleteForBoth, selectedMessageIds]);

  if (loading) {
    return <LoadingSpinner message="Carregando mensagens..." />;
  }

  const searchLift = emojiOpen && emojiSearchFocused && keyboardHeight > 0 ? EMOJI_SEARCH_LIFT : 0;
  const reservedBottomHeight = keyboardHeight > 0
    ? keyboardHeight + searchLift
    : emojiOpen
      ? (lastKeyboardHeight || DEFAULT_EMOJI_PANEL_HEIGHT)
      : keyboardOpening
        ? (lastKeyboardHeight || DEFAULT_EMOJI_PANEL_HEIGHT)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundChat }]} edges={['bottom']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={headerHeight}>
          <View style={[styles.chatWallpaper, { backgroundColor: colors.backgroundChat }]} />
          {activeAudio ? (
            <View style={styles.inlineAudioPlayer}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleAudioPress(activeAudio)}>
                <Ionicons
                  name={activeAudio.isPlaying ? 'pause' : 'play'}
                  size={20}
                  color="#8ea8ff"
                />
              </TouchableOpacity>
              <Text style={styles.inlineAudioText} numberOfLines={1}>
                {trimAudioFileName(activeAudio.fileName)}
              </Text>
              <TouchableOpacity activeOpacity={0.8} onPress={handleCloseAudioPlayer}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.72)" />
              </TouchableOpacity>
            </View>
          ) : null}

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            style={styles.list}
            contentContainerStyle={[styles.messagesList, { paddingBottom: spacing.md + insets.bottom }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.datePill}>
                  <Text style={[styles.datePillText, { color: colors.textOnPrimary }]}>Sem mensagens ainda</Text>
                </View>
              </View>
            }
          />

          <MessageInput
            ref={messageInputRef}
            onSend={handleSend}
            onAttachPress={() => setAttachOpen(true)}
            onTyping={() => {
              if (!myUserId || !conversationId) return;
              sendTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            onStopTyping={() => {
              if (!myUserId || !conversationId) return;
              sendStopTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            disabled={uploading}
            emojiOpen={emojiOpen}
            onEmojiOpenChange={(open) => {
              setEmojiOpen(open);

              // Ao trocar de emoji -> teclado, o teclado demora alguns ms para aparecer.
              // Mantém o "espaço" reservado nesse intervalo para evitar a piscada (descer/subir rápido).
              if (!open && keyboardHeight === 0) {
                setKeyboardOpening(true);
                if (keyboardOpeningTimeoutRef.current) {
                  clearTimeout(keyboardOpeningTimeoutRef.current);
                }
                keyboardOpeningTimeoutRef.current = setTimeout(() => {
                  setKeyboardOpening(false);
                  keyboardOpeningTimeoutRef.current = null;
                }, 320);
              } else if (open) {
                setKeyboardOpening(false);
                if (keyboardOpeningTimeoutRef.current) {
                  clearTimeout(keyboardOpeningTimeoutRef.current);
                  keyboardOpeningTimeoutRef.current = null;
                }
              }
            }}
          />

          <View style={{ height: reservedBottomHeight }}>
            {emojiOpen ? (
              <EmojiPickerPanel
                visible
                fill
                height={reservedBottomHeight}
                keyboardHeight={keyboardHeight}
                onSearchFocusChange={setEmojiSearchFocused}
                onClose={() => setEmojiOpen(false)}
                onSelectEmoji={(emoji) => messageInputRef.current?.appendText?.(emoji)}
              />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>
          <View style={[styles.chatWallpaper, { backgroundColor: colors.backgroundChat }]} />
          {activeAudio ? (
            <View style={styles.inlineAudioPlayer}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleAudioPress(activeAudio)}>
                <Ionicons
                  name={activeAudio.isPlaying ? 'pause' : 'play'}
                  size={20}
                  color="#8ea8ff"
                />
              </TouchableOpacity>
              <Text style={styles.inlineAudioText} numberOfLines={1}>
                {trimAudioFileName(activeAudio.fileName)}
              </Text>
              <TouchableOpacity activeOpacity={0.8} onPress={handleCloseAudioPlayer}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.72)" />
              </TouchableOpacity>
            </View>
          ) : null}

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            style={styles.list}
            contentContainerStyle={[styles.messagesList, { paddingBottom: spacing.md + insets.bottom }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.datePill}>
                  <Text style={[styles.datePillText, { color: colors.textOnPrimary }]}>Sem mensagens ainda</Text>
                </View>
              </View>
            }
          />

          <MessageInput
            ref={messageInputRef}
            onSend={handleSend}
            onAttachPress={() => setAttachOpen(true)}
            onTyping={() => {
              if (!myUserId || !conversationId) return;
              sendTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            onStopTyping={() => {
              if (!myUserId || !conversationId) return;
              sendStopTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            disabled={uploading}
            emojiOpen={emojiOpen}
            onEmojiOpenChange={(open) => {
              setEmojiOpen(open);

              if (!open && keyboardHeight === 0) {
                setKeyboardOpening(true);
                if (keyboardOpeningTimeoutRef.current) {
                  clearTimeout(keyboardOpeningTimeoutRef.current);
                }
                keyboardOpeningTimeoutRef.current = setTimeout(() => {
                  setKeyboardOpening(false);
                  keyboardOpeningTimeoutRef.current = null;
                }, 320);
              } else if (open) {
                setKeyboardOpening(false);
                if (keyboardOpeningTimeoutRef.current) {
                  clearTimeout(keyboardOpeningTimeoutRef.current);
                  keyboardOpeningTimeoutRef.current = null;
                }
              }
            }}
          />

          <View style={{ height: reservedBottomHeight }}>
            {emojiOpen ? (
              <EmojiPickerPanel
                visible
                fill
                height={reservedBottomHeight}
                keyboardHeight={keyboardHeight}
                onSearchFocusChange={setEmojiSearchFocused}
                onClose={() => setEmojiOpen(false)}
                onSelectEmoji={(emoji) => messageInputRef.current?.appendText?.(emoji)}
              />
            ) : null}
          </View>
        </View>
      )}

      <Modal
        transparent={false}
        animationType="fade"
        visible={!!viewerImage}
        onRequestClose={() => setViewerImage(null)}
      >
        <SafeAreaView style={styles.viewerScreen} edges={['top', 'bottom']}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => setViewerImage(null)}>
              <Ionicons name="arrow-back" size={27} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.viewerHeaderText}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewerImage?.senderName || name}
              </Text>
              <Text style={styles.viewerSubtitle}>
                {viewerImage
                  ? `hoje às ${new Date(viewerImage.timestamp * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}`
                  : ''}
              </Text>
            </View>

            <View style={styles.viewerActions}>
              <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Pincel', 'Em breve.')}>
                <Ionicons name="brush-outline" size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Compartilhar', 'Em breve.')}>
                <Ionicons name="arrow-redo-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Mais opções', 'Em breve.')}>
                <Ionicons name="ellipsis-vertical" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.viewerCounterWrap}>
            <View style={styles.viewerCounterPill}>
              <Text style={styles.viewerCounterText}>1 de 1</Text>
            </View>
          </View>

          <View style={styles.viewerImageWrap}>
            {viewerImage ? (
              <Image
                source={{ uri: viewerImage.uri }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal transparent animationType="slide" visible={attachOpen} onRequestClose={() => setAttachOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setAttachOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Enviar</Text>
            {uploading ? <ActivityIndicator /> : null}
          </View>

          <TouchableOpacity style={styles.sheetItem} onPress={pickFromGallery} disabled={uploading}>
            <Ionicons name="images-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>Galeria</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetItem} onPress={takePhoto} disabled={uploading}>
            <Ionicons name="camera-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>Câmera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetItem} onPress={pickDocument} disabled={uploading}>
            <Ionicons name="document-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.sheetItemText, { color: colors.textPrimary }]}>Arquivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetItem, styles.sheetCancel]}
            onPress={() => setAttachOpen(false)}
            disabled={uploading}
          >
            <Text style={[styles.sheetCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal transparent visible={headerMenuVisible} animationType="fade" onRequestClose={() => setHeaderMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setHeaderMenuVisible(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.separator }]}
              activeOpacity={0.75}
              onPress={() => {
                setHeaderMenuVisible(false);
                handleDeleteConversation();
              }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Excluir conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setHeaderMenuVisible(false)}
            >
              <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>Apagar mensagem</Text>
            <Text style={[styles.deleteDescription, { color: colors.textPrimary }]}>
              Tem certeza de que deseja apagar essa mensagem?
            </Text>

            <View style={styles.deleteOptionRow}>
              <Switch value={deleteForBoth} onValueChange={setDeleteForBoth} disabled={deletingMessages} />
              <Text style={[styles.deleteOptionText, { color: colors.textPrimary }]}>
                Apagar para {name} tambem
              </Text>
            </View>

            <View style={styles.deleteActions}>
              <TouchableOpacity activeOpacity={0.75} onPress={() => setDeleteModalVisible(false)} disabled={deletingMessages}>
                <Text style={[styles.deleteCancel, { color: '#8aa4ff' }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.75} onPress={handleConfirmDeleteMessages} disabled={deletingMessages}>
                <Text style={[styles.deleteConfirm, deletingMessages ? styles.deleteConfirmDisabled : null]}>
                  {deletingMessages ? 'Apagando...' : 'Apagar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const extractUserId = (value: string | ChatApiUser | any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return null;
};

const extractUserName = (value: string | ChatApiUser | any): string | null => {
  if (!value) return null;
  if (typeof value === 'object') {
    return value.nome || value.username || null;
  }
  return null;
};

const extractFileNameFromUrl = (uri: string) => {
  const rawName = uri.split('/').pop()?.split('?')[0] || 'arquivo';
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
};

const sanitizeFileName = (value: string) => {
  const safe = value.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_').trim();
  return safe || 'arquivo';
};

const resolveMimeType = (fileName: string, mediaType?: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (mediaType && mediaType.includes('/')) {
    return mediaType;
  }

  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/vnd.rar';
    default:
      return 'application/octet-stream';
  }
};

const formatAudioTime = (millis: number) => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const trimAudioFileName = (value: string) => {
  return value.replace(/\.[a-z0-9]{2,5}$/i, '');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  list: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  chatWallpaper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090b12',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
  },
  headerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    width: 58,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    width: 156,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '500',
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    color: '#9ea1aa',
    fontSize: 13,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 6,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  datePill: {
    backgroundColor: 'rgba(80, 83, 92, 0.65)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  datePillText: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  inlineAudioPlayer: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(27,27,31,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineAudioText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sheetItemText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetCancel: {
    justifyContent: 'center',
    marginTop: 6,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuBackdrop: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 260,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuText: {
    fontSize: 17,
    fontWeight: '500',
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  deleteCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  deleteDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 18,
  },
  deleteOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  deleteOptionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 26,
  },
  deleteCancel: {
    fontSize: 17,
    fontWeight: '600',
  },
  deleteConfirm: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ff6666',
  },
  deleteConfirmDisabled: {
    opacity: 0.6,
  },
  viewerScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  viewerHeader: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  viewerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  viewerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 2,
  },
  viewerActions: {
    minWidth: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerCounterWrap: {
    alignItems: 'center',
    paddingTop: 10,
  },
  viewerCounterPill: {
    backgroundColor: 'rgba(52,52,52,0.82)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  viewerCounterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  viewerImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});
