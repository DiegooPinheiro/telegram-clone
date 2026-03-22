import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import ChatListItem from '../components/ChatListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import useTheme from '../hooks/useTheme';
import { chatDeleteConversation, chatGetConversations } from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import { onReceiveMessage } from '../services/chatSocket';
import type { ChatApiConversation, ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ChatApiConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuConversation, setMenuConversation] = useState<ChatApiConversation | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getChatSession();
      if (!session?.userId) {
        setMyUserId(null);
        setConversations([]);
        return;
      }

      setMyUserId(session.userId);
      const fetched = await chatGetConversations(session.userId);
      setConversations(fetched);
    } catch (error: any) {
      console.error('Erro ao carregar conversas:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível carregar suas conversas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      return () => {};
    }, [loadConversations])
  );

  useEffect(() => {
    const unsubscribe = onReceiveMessage(() => {
      loadConversations();
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((c) => {
      const other = getOtherParticipant(c, myUserId);
      const name = other?.nome || other?.username || '';
      return name.toLowerCase().includes(normalized);
    });
  }, [search, conversations, myUserId]);

  const renderConversation = useCallback(
    ({ item }: { item: ChatApiConversation }) => {
      const other = getOtherParticipant(item, myUserId);
      const name = other?.nome || other?.username || 'Conversa';
      const avatar = other?.foto || null;

      const lastMessageText = item.lastMessage?.text ? String(item.lastMessage.text) : '';
      const lastMessageSenderId = extractParticipantId(item.lastMessage?.senderId);
      const isOutgoing = !!myUserId && !!lastMessageSenderId && lastMessageSenderId === myUserId;
      const unreadCount = Number(item.unreadCount || 0);
      const timestamp = item.lastMessage?.createdAt
        ? Math.floor(new Date(item.lastMessage.createdAt).getTime() / 1000)
        : Math.floor(new Date(item.updatedAt).getTime() / 1000);

      return (
        <ChatListItem
          id={item._id}
          name={name}
          lastMessage={lastMessageText || 'Toque para abrir'}
          timestamp={timestamp}
          unreadCount={unreadCount}
          isOutgoing={isOutgoing}
          outgoingRead={false}
          avatar={avatar}
          online={false}
          onPress={() => {
            if (!other?._id) {
              Alert.alert('Erro', 'Participante inválido nesta conversa.');
              return;
            }

            navigation.navigate('Chat', {
              conversationId: item._id,
              userId: other._id,
              name,
              avatar,
              username: other.username,
            });
          }}
          onLongPress={() => {
            setMenuConversation(item);
            setMenuVisible(true);
          }}
        />
      );
    },
    [navigation, myUserId]
  );

  const handleDeleteConversation = useCallback(() => {
    if (!menuConversation) return;

    Alert.alert(
      'Excluir conversa',
      'Tem certeza que deseja excluir esta conversa? Isso pode apagar as mensagens deste chat.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatDeleteConversation(menuConversation._id);
              setMenuVisible(false);
              setMenuConversation(null);
              setConversations((prev) => prev.filter((c) => c._id !== menuConversation._id));
              loadConversations();
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
  }, [menuConversation, loadConversations]);

  if (loading) {
    return <LoadingSpinner message="Carregando conversas..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.inputBackground }]}>
          <Ionicons name="search" size={18} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textPrimary }]}
            placeholder="Buscar Chats"
            placeholderTextColor={themeColors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.separator }]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={54}
              color={themeColors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Nenhuma conversa encontrada</Text>
          </View>
        }
      />

      <View style={[styles.fabStack, { bottom: insets.bottom + 82 }]}>
        <TouchableOpacity
          style={[
            styles.fabSmall,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.separator,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Câmera', 'Abrir câmera em breve.')}
        >
          <Ionicons name="camera-outline" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabPrimary, { backgroundColor: themeColors.primary }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('NewChat')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuCard, { backgroundColor: themeColors.surface, borderColor: themeColors.separator }]}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: themeColors.separator }]}
              activeOpacity={0.75}
              onPress={() => {
                setMenuVisible(false);
                handleDeleteConversation();
              }}
            >
              <Ionicons name="trash-outline" size={22} color={themeColors.textPrimary} />
              <Text style={[styles.menuText, { color: themeColors.textPrimary }]}>Excluir conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => {
                setMenuVisible(false);
                setMenuConversation(null);
              }}
            >
              <Ionicons name="close-outline" size={22} color={themeColors.textSecondary} />
              <Text style={[styles.menuText, { color: themeColors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const getOtherParticipant = (conversation: ChatApiConversation, myUserId: string | null): ChatApiUser | null => {
  if (!conversation.participants || conversation.participants.length === 0) return null;
  if (!myUserId) return conversation.participants[0];

  return conversation.participants.find((p) => p._id !== myUserId) || conversation.participants[0];
};

const extractParticipantId = (value: string | ChatApiUser | undefined): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return null;
};

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
    paddingBottom: 180,
    flexGrow: 1,
  },
  fabStack: {
    position: 'absolute',
    right: 18,
    alignItems: 'center',
    zIndex: 10,
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#141518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2D2E33',
  },
  fabPrimary: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F7CFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
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
  menuBackdrop: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    right: 14,
    bottom: 120,
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
