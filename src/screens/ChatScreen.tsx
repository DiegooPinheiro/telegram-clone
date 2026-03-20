import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import useOnlineStatusByEmail from '../hooks/useOnlineStatusByEmail';
import { chatDeleteConversation, chatGetMessages, chatUploadMedia } from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import { onReceiveMessage, onTypingEvent, sendMessageSocket, sendStopTypingSocket, sendTypingSocket } from '../services/chatSocket';
import type { ChatApiMessage, ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { conversationId, userId: receiverId, name, avatar, username } = route.params;

  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);

  const { statusText, online } = useOnlineStatusByEmail(username || '', !!username);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
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
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => Alert.alert('Chamada', 'Em breve.')}>
            <Ionicons name="call-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.75} onPress={() => setHeaderMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    });
  }, [navigation, name, colors.background, colors.textPrimary, colors.textSecondary, avatar, online, otherTyping, statusText]);

  const handleDeleteConversation = useCallback(() => {
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
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
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

        const fetched = await chatGetMessages(conversationId);
        if (active) {
          setMessages(fetched);
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

      const normalized: ChatApiMessage = {
        ...message,
        // socket pode enviar senderId como string (sem populate)
        senderId: message.senderId,
        createdAt: message.createdAt || new Date().toISOString(),
        updatedAt: message.updatedAt || message.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => {
        if (prev.some((m) => m._id === normalized._id)) return prev;
        return [...prev, normalized];
      });
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

  const handleSend = useCallback(
    async (text: string) => {
      if (!myUserId) {
        Alert.alert('Erro', 'Sessão do chat ausente. Faça login novamente.');
        return;
      }

      try {
        sendMessageSocket({
          conversationId,
          senderId: myUserId,
          receiverId,
          text,
        });
      } catch (error: any) {
        console.error('Erro ao enviar:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível enviar a mensagem.');
      }
    },
    [conversationId, myUserId, receiverId]
  );

  const handleUploadAndSend = useCallback(
    async (file: { uri: string; name: string; type: string }) => {
      if (!myUserId) {
        Alert.alert('Erro', 'Sessão do chat ausente. Faça login novamente.');
        return;
      }

      setUploading(true);
      try {
        const uploaded = await chatUploadMedia(file);
        const displayName = uploaded.fileName || file.name;
        const text = uploaded.mediaType === 'image' ? undefined : displayName;

        sendMessageSocket({
          conversationId,
          senderId: myUserId,
          receiverId,
          text,
          mediaUrl: uploaded.mediaUrl,
          mediaType: uploaded.mediaType,
        });
      } catch (error: any) {
        console.error('Erro ao enviar mídia:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível enviar o arquivo.');
      } finally {
        setUploading(false);
      }
    },
    [conversationId, myUserId, receiverId]
  );

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
    ({ item }: { item: ChatApiMessage }) => {
      const senderId = extractUserId(item.senderId);
      const isMine = !!myUserId && !!senderId && senderId === myUserId;

      const senderName = !isMine ? extractUserName(item.senderId) || name : undefined;
      const text = item.text ? String(item.text) : '';
      const timestamp = Math.floor(new Date(item.createdAt).getTime() / 1000);

      return (
        <MessageBubble
          message={text}
          mediaUrl={item.mediaUrl}
          mediaType={item.mediaType}
          timestamp={timestamp}
          isMine={isMine}
          senderName={senderName}
        />
      );
    },
    [myUserId, name]
  );

  if (loading) {
    return <LoadingSpinner message="Carregando mensagens..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundChat }]} edges={['bottom']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={headerHeight}>
          <View style={[styles.chatWallpaper, { backgroundColor: colors.backgroundChat }]} />

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
            onSend={handleSend}
            onAttachPress={() => setAttachOpen(true)}
            onTyping={() => {
              if (!myUserId) return;
              sendTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            onStopTyping={() => {
              if (!myUserId) return;
              sendStopTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            disabled={uploading}
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.flex, { paddingBottom: Math.max(0, keyboardHeight) }]}>
          <View style={[styles.chatWallpaper, { backgroundColor: colors.backgroundChat }]} />

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
            onSend={handleSend}
            onAttachPress={() => setAttachOpen(true)}
            onTyping={() => {
              if (!myUserId) return;
              sendTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            onStopTyping={() => {
              if (!myUserId) return;
              sendStopTypingSocket({ conversationId, senderId: myUserId, receiverId });
            }}
            disabled={uploading}
          />
        </View>
      )}

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
});
