import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import useMessages from '../hooks/useMessages';
import useOnlineStatus from '../hooks/useOnlineStatus';
import useAuth from '../hooks/useAuth';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { uid: receiverUID, name, isGroup = false, avatar } = route.params;
  const { uid: myUID } = useAuth();
  const { messages, loading, send, isTyping } = useMessages(receiverUID, isGroup);
  const { statusText } = useOnlineStatus(receiverUID, !isGroup);
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [avatarUri, setAvatarUri] = useState<string | null>(avatar ?? null);
  const [cometChatUid, setCometChatUid] = useState<string | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleWrap}>
          <Avatar name={name} size={38} uri={avatarUri} />
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]} numberOfLines={1}>
              {isGroup ? 'grupo' : isTyping ? 'digitando...' : statusText || 'visto recentemente'}
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
  }, [navigation, name, statusText, isTyping, colors.background, colors.textPrimary, avatarUri]);

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

    CometChat.getLoggedinUser()
      .then((user) => {
        if (active) {
          setCometChatUid(user?.getUid?.() ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setCometChatUid(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (avatar) {
      setAvatarUri(avatar);
      return;
    }

    const loadAvatar = async () => {
      try {
        if (isGroup) {
          const group = await CometChat.getGroup(receiverUID);
          const icon = group?.getIcon?.() || null;
          if (active) {
            setAvatarUri(icon);
          }
        } else {
          const user = await CometChat.getUser(receiverUID);
          const photo = user?.getAvatar?.() || null;
          if (active) {
            setAvatarUri(photo);
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar avatar do chat:', error);
      }
    };

    loadAvatar();

    return () => {
      active = false;
    };
  }, [receiverUID, isGroup, avatar]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await send(text);
      } catch (error) {
        console.error('Erro ao enviar:', error);
      }
    },
    [send]
  );

  const renderMessage = useCallback(
    ({ item }: { item: CometChat.BaseMessage }) => {
      const senderUid = item.getSender?.()?.getUid?.();
      const receiverId = item.getReceiverId?.();
      const mineUid = cometChatUid || myUID;
      let isMine = false;

      if (mineUid && senderUid) {
        isMine = senderUid === mineUid;
      } else if (!isGroup && receiverId) {
        isMine = receiverId === receiverUID;
      }
      const text = item instanceof CometChat.TextMessage ? item.getText() : '[Midia]';

      return (
        <MessageBubble
          message={text}
          timestamp={item.getSentAt()}
          isMine={isMine}
          senderName={!isMine ? item.getSender().getName() : undefined}
        />
      );
    },
    [myUID, cometChatUid, isGroup, receiverUID]
  );

  if (loading) {
    return <LoadingSpinner message="Carregando mensagens..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundChat }]} edges={['bottom']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.flex}
          keyboardVerticalOffset={headerHeight}
        >
          <View style={[styles.chatWallpaper, { backgroundColor: colors.backgroundChat }]} />

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.getId().toString()}
            style={styles.list}
            contentContainerStyle={styles.messagesList}
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
            keyExtractor={(item) => item.getId().toString()}
            style={styles.list}
            contentContainerStyle={styles.messagesList}
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
