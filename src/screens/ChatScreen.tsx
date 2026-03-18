import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { chatGetMessages } from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import { onReceiveMessage, sendMessageSocket } from '../services/chatSocket';
import type { ChatApiMessage, ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { conversationId, userId: receiverId, name, avatar } = route.params;

  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatApiMessage[]>([]);
  const [loading, setLoading] = useState(true);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <Avatar name={name} size={38} uri={avatar ?? null} online={false} />
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]} numberOfLines={1}>
              via Chat API
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <Ionicons name="call-outline" size={24} color={colors.textPrimary} />
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </View>
      ),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    });
  }, [navigation, name, colors.background, colors.textPrimary, colors.textSecondary, avatar]);

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

  const renderMessage = useCallback(
    ({ item }: { item: ChatApiMessage }) => {
      const senderId = extractUserId(item.senderId);
      const isMine = !!myUserId && !!senderId && senderId === myUserId;

      const senderName = !isMine ? extractUserName(item.senderId) || name : undefined;
      const text = item.text ? String(item.text) : item.mediaUrl ? '[Mídia]' : '';
      const timestamp = Math.floor(new Date(item.createdAt).getTime() / 1000);

      return (
        <MessageBubble
          message={text}
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

          <MessageInput onSend={handleSend} />
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

          <MessageInput onSend={handleSend} />
        </View>
      )}
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
});
