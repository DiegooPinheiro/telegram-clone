import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import { fetchConversations, loginCometChat } from '../services/cometChatService';
import { getUserProfile } from '../services/authService';
import ChatListItem from '../components/ChatListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderMenuButton from '../components/HeaderMenuButton';
import useTheme from '../hooks/useTheme';
import useAuth from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

export default function ChatListScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const { uid, displayName } = useAuth();
  const [conversations, setConversations] = useState<CometChat.Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [firestoreNames, setFirestoreNames] = useState<Record<string, string>>({});
  const [onlineUids, setOnlineUids] = useState<Set<string>>(new Set());
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    type: string;
    name: string;
    isGroup: boolean;
  } | null>(null);

  const ensureCometChatSession = useCallback(async () => {
    const loggedInUser = await CometChat.getLoggedinUser();
    if (loggedInUser) {
      return true;
    }

    if (!uid) {
      return false;
    }

    try {
      // Firebase Auth pode não ter o displayName ainda (race condition pós-cadastro)
      // Lemos o Firestore para garantir o nome correto
      let nameToUse = displayName;
      if (!nameToUse) {
        const profile = await getUserProfile(uid);
        nameToUse = (profile as any)?.displayName || null;
      }
      await loginCometChat(uid, nameToUse || undefined);
      return true;
    } catch (error) {
      console.error('[ChatList] Falha ao recuperar sessao CometChat:', error);
      return false;
    }
  }, [uid, displayName]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const hasSession = await ensureCometChatSession();
      if (!hasSession) {
        setConversations([]);
        return;
      }

      const fetched = await fetchConversations();
      setConversations(fetched);

      // Inicializa status online a partir das conversas carregadas
      const initialOnline = new Set(
        fetched
          .filter((conv) => {
            const w = conv.getConversationWith();
            return w instanceof CometChat.User && w.getStatus() === 'online';
          })
          .map((conv) => (conv.getConversationWith() as CometChat.User).getUid())
      );
      setOnlineUids(initialOnline);

      // Busca nomes reais do Firestore para corrigir nomes errados do CometChat (ex: "Usuario")
      const userUids = fetched
        .filter((conv) => conv.getConversationWith() instanceof CometChat.User)
        .map((conv) => (conv.getConversationWith() as CometChat.User).getUid());

      if (userUids.length > 0) {
        const profiles = await Promise.all(
          userUids.map((id) => getUserProfile(id).catch(() => null))
        );
        const namesMap: Record<string, string> = {};
        userUids.forEach((id, i) => {
          const profile = profiles[i] as any;
          if (profile?.displayName) {
            namesMap[id] = profile.displayName;
          }
        });
        setFirestoreNames(namesMap);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, [ensureCometChatSession]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      return () => {
        setSelectedConversation(null);
      };
    }, [loadConversations])
  );

  useEffect(() => {
    const listenerID = 'chatlist_user_listener';
    CometChat.addUserListener(
      listenerID,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          setOnlineUids((prev) => new Set(prev).add(onlineUser.getUid()));
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          setOnlineUids((prev) => {
            const next = new Set(prev);
            next.delete(offlineUser.getUid());
            return next;
          });
        },
      })
    );
    return () => {
      CometChat.removeUserListener(listenerID);
    };
  }, []);

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
  }, [loadConversations]);

  const renderConversation = useCallback(
    ({ item }: { item: CometChat.Conversation }) => {
      const conversationWith = item.getConversationWith();
      const lastMessage = item.getLastMessage();

      let name = '';
      let uid = '';
      let avatar: string | null = null;
      let online = false;
      let isGroup = false;

      if (conversationWith instanceof CometChat.User) {
        uid = conversationWith.getUid();
        name = firestoreNames[uid] || conversationWith.getName();
        avatar = conversationWith.getAvatar() || null;
        online = onlineUids.has(conversationWith.getUid());
      } else if (conversationWith instanceof CometChat.Group) {
        name = conversationWith.getName();
        uid = conversationWith.getGuid();
        avatar = conversationWith.getIcon() || null;
        isGroup = true;
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
          selected={selectedConversation?.id === uid && selectedConversation?.type === (isGroup ? CometChat.RECEIVER_TYPE.GROUP : CometChat.RECEIVER_TYPE.USER)}
          onPress={() => {
            if (selectedConversation) {
              if (selectedConversation.id === uid) {
                setSelectedConversation(null);
              } else {
                setSelectedConversation({
                  id: uid,
                  type: isGroup ? CometChat.RECEIVER_TYPE.GROUP : CometChat.RECEIVER_TYPE.USER,
                  name,
                  isGroup,
                });
              }
              return;
            }
            navigation.navigate('Chat', { uid, name, isGroup, avatar });
          }}
          onLongPress={() => {
            setSelectedConversation({
              id: uid,
              type: isGroup ? CometChat.RECEIVER_TYPE.GROUP : CometChat.RECEIVER_TYPE.USER,
              name,
              isGroup,
            });
          }}
        />
      );
    },
    [navigation, selectedConversation, firestoreNames, onlineUids]
  );

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.getConversationWith().getName().toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedConversation) {
      return;
    }

    const title = selectedConversation.isGroup ? 'Sair do grupo' : 'Apagar conversa';
    const message = selectedConversation.isGroup
      ? `Deseja sair do grupo "${selectedConversation.name}"?`
      : `Deseja apagar a conversa com "${selectedConversation.name}"?`;

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: selectedConversation.isGroup ? 'Sair' : 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (selectedConversation.isGroup) {
              await CometChat.leaveGroup(selectedConversation.id);
            } else {
              await CometChat.deleteConversation(selectedConversation.id, selectedConversation.type);
            }
            setSelectedConversation(null);
            loadConversations();
          } catch (error: any) {
            console.error('Erro ao remover conversa:', error);
            if (selectedConversation.isGroup && error?.code === 'ERR_OWNER_EXIT_FORBIDDEN') {
              Alert.alert(
                'Voce e dono do grupo',
                'Para sair, transfira a propriedade ou exclua o grupo.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir Grupo',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await CometChat.deleteGroup(selectedConversation.id);
                        setSelectedConversation(null);
                        loadConversations();
                      } catch (deleteError) {
                        console.error('Erro ao excluir grupo:', deleteError);
                        Alert.alert('Erro', 'Nao foi possivel excluir o grupo.');
                      }
                    },
                  },
                ]
              );
              return;
            }
            Alert.alert('Erro', 'Nao foi possivel remover a conversa.');
          }
        },
      },
    ]);
  }, [selectedConversation, loadConversations]);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {selectedConversation && (
            <TouchableOpacity
              style={{ marginRight: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.75}
              onPress={handleDeleteSelected}
            >
              <Ionicons name="trash-outline" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
          )}
          <HeaderMenuButton />
        </View>
      ),
    });
  }, [navigation, selectedConversation, handleDeleteSelected, themeColors.textPrimary]);

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
        keyExtractor={(item) => item.getConversationId()}
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
            <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
              Nenhuma conversa encontrada
            </Text>
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
          onPress={() => Alert.alert('Camera', 'Abrir camera em breve.')}
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
    ...Platform.select({
      web: { boxShadow: '0px 5px 7px rgba(0,0,0,0.35)' },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
      },
    }),
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
