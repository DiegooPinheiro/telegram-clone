import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SectionList,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import useTheme from '../hooks/useTheme';
import { chatListUsers } from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import type { ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Contacts'>;

type ContactSection = {
  title: string;
  data: ChatApiUser[];
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ContactsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ChatApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [noSession, setNoSession] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setNoSession(false);
    try {
      let session = await getChatSession();
      let attempts = 0;

      while (!session?.userId && attempts < 5) {
        attempts += 1;
        await wait(450);
        session = await getChatSession();
      }

      if (!session?.userId) {
        setNoSession(true);
        return;
      }
      const fetched = await chatListUsers();
      setUsers(fetched);
    } catch (error: any) {
      console.error('Erro ao buscar contatos:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível buscar contatos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
      return () => {};
    }, [])
  );

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((u) => {
      const nome = (u.nome || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return nome.includes(normalized) || username.includes(normalized);
    });
  }, [search, users]);

  const sections = useMemo<ContactSection[]>(() => {
    const sorted = [...filteredUsers].sort((a, b) => (a.nome || a.username).localeCompare(b.nome || b.username));
    const grouped = new Map<string, ChatApiUser[]>();

    sorted.forEach((user) => {
      const display = user.nome || user.username;
      const first = display.trim().charAt(0).toUpperCase() || '#';
      const key = /[A-Z]/.test(first) ? first : '#';

      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(user);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, data]) => ({ title, data }));
  }, [filteredUsers]);

  const startChat = (user: ChatApiUser) => {
    navigation.navigate('Chat', {
      userId: user._id,
      name: user.nome || user.username,
      avatar: user.foto || null,
      username: user.username,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Fixed Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {loading ? 'Carregando...' : 'Contatos'}
        </Text>
        <TouchableOpacity style={styles.headerAction} onPress={loadUsers}>
          <MaterialCommunityIcons name="playlist-check" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {noSession ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
            Sessão não encontrada. Faça login novamente.
          </Text>
          <TouchableOpacity
            onPress={loadUsers}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.sectionContent, { flexGrow: 1 }]}
          style={{ flex: 1 }}
          ListHeaderComponent={
            <View>
              <View style={[styles.searchWrap, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Buscar Contatos"
                  placeholderTextColor={colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <View style={[styles.actionsCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]} activeOpacity={0.7}>
                  <View style={[styles.sideLetterWrap, { alignItems: 'flex-start' }]}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="person-add" size={16} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>Convidar Amigos</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                  <View style={[styles.sideLetterWrap, { alignItems: 'flex-start' }]}>
                    <View style={[styles.actionIconBg, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="call" size={16} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>Chamadas recentes</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[styles.listCardTop, { backgroundColor: colors.surface }]}>
                <Text style={[styles.listTitle, { color: colors.primary }]}>Listado por Nome</Text>
              </View>
            </View>
          }
          renderItem={({ item, index, section }) => {
            const displayName = item.nome || item.username;
            const subtitle = 'visto recentemente';

            return (
              <View style={[styles.contactRowWrap, { backgroundColor: colors.surface }]}>
                {index === 0 ? (
                  <View style={styles.sideLetterWrap}>
                    <Text style={[styles.sideLetter, { color: colors.textSecondary }]}>{section.title}</Text>
                  </View>
                ) : (
                  <View style={styles.sideLetterWrap} />
                )}
                <TouchableOpacity style={styles.contactRow} activeOpacity={0.75} onPress={() => startChat(item)}>
                  <Avatar uri={item.foto || null} name={displayName} size={42} online={false} />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.textPrimary }]}>{displayName}</Text>
                    <Text style={[styles.contactStatus, { color: colors.textSecondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.emptyStateWrap, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum contato encontrado</Text>
            </View>
          }
          ListFooterComponent={<View style={[styles.listCardBottom, { backgroundColor: colors.surface }]} />}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 82, backgroundColor: colors.primary }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('NewChat')}
      >
        <Ionicons name="person-add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  searchWrap: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionsCard: {
    borderRadius: 14,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listCardTop: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  listCardBottom: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 16,
  },
  emptyStateWrap: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 24,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    paddingBottom: 120,
  },
  contactRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sideLetterWrap: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideLetter: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactInfo: {
    marginLeft: 14,
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactStatus: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
  },
});
