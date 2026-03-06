import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import { fetchConversations } from '../services/cometChatService';
import ChatListItem from '../components/ChatListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const loggedInUser = await CometChat.getLoggedinUser();
      if (!loggedInUser) {
        console.log('[ChatList] Aguardando login do CometChat...');
        return;
      }

      const fetched = await fetchConversations();
      setConversations(fetched);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const listenerID = 'chatlist_listener';

    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: () => loadConversations(),
        onMediaMessageReceived: () => loadConversations(),
        onCustomMessageReceived: () => loadConversations(),
        onMessageDeleted: () => loadConversations(),
        onUnreadMessageCountUpdated: () => loadConversations(),
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
        lastMessageText = '[Midia]';
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

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.getConversationWith().getName().toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return <LoadingSpinner message="Carregando conversas..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: '#1c1c1e' }]}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: '#ffffff' }]}
            placeholder="Buscar Chats"
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.getConversationId()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: '#1c1c1e' }]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={54}
              color="#ffffff"
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
              Nenhuma conversa encontrada
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingVertical: spacing.xs,
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
