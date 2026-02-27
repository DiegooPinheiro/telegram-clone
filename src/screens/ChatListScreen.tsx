import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fetchConversations } from '../services/cometChatService';
import ChatListItem from '../components/ChatListItem';
import LoadingSpinner from '../components/LoadingSpinner';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const fetched = await fetchConversations();
      setConversations(fetched);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listener para novas mensagens atualizarem a lista
  useEffect(() => {
    const listenerID = 'chatlist_listener';

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: () => {
          loadConversations();
        },
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, []);

  const renderConversation = useCallback(
    ({ item }: { item: CometChat.Conversation }) => {
      const conversationWith = item.getConversationWith();
      const lastMessage = item.getLastMessage();

      let name = '';
      let uid = '';
      let avatar: string | null = null;
      let online = false;

      if (conversationWith instanceof CometChat.User) {
        name = conversationWith.getName();
        uid = conversationWith.getUid();
        avatar = conversationWith.getAvatar() || null;
        online = conversationWith.getStatus() === 'online';
      } else if (conversationWith instanceof CometChat.Group) {
        name = conversationWith.getName();
        uid = conversationWith.getGuid();
        avatar = conversationWith.getIcon() || null;
      }

      let lastMessageText = '';
      if (lastMessage instanceof CometChat.TextMessage) {
        lastMessageText = lastMessage.getText();
      } else if (lastMessage) {
        lastMessageText = '📎 Mídia';
      }

      return (
        <ChatListItem
          id={uid}
          name={name}
          lastMessage={lastMessageText}
          timestamp={lastMessage ? lastMessage.getSentAt() : 0}
          unreadCount={item.getUnreadMessageCount()}
          avatar={avatar}
          online={online}
          onPress={() => navigation.navigate('Chat', { uid, name })}
        />
      );
    },
    [navigation]
  );

  if (loading) {
    return <LoadingSpinner message="Carregando conversas..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.getConversationId()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão abaixo para começar
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewChat')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: spacing.xs,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabIcon: {
    fontSize: 24,
  },
});
