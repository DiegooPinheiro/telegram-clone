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

export default function ContactsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ChatApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [noSession, setNoSession] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setNoSession(false);
    try {
      const session = await getChatSession();
      if (!session?.userId) {
        console.warn('[ContactsScreen] Sessão não encontrada, aguardando...');
        setNoSession(true);
        setLoading(false);
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

  if (loading) {
    return <LoadingSpinner message="Carregando contatos..." />;
  }

  if (noSession) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
        edges={['left', 'right']}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
          Sessão não encontrada. Faça login novamente.
        </Text>
        <TouchableOpacity
          onPress={loadUsers}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Contatos</Text>
        <TouchableOpacity style={styles.headerAction} onPress={loadUsers}>
          <MaterialCommunityIcons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar Contatos"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.listTitle, { color: colors.primary }]}>Listado por Nome</Text>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.sectionContent}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const displayName = item.nome || item.username;
            const subtitle = item.username;

            return (
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.75} onPress={() => startChat(item)}>
                <Avatar uri={item.foto || null} name={displayName} size={54} online={false} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.textPrimary }]}>{displayName}</Text>
                  <Text style={[styles.contactStatus, { color: colors.textSecondary }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum contato encontrado</Text>
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  searchWrap: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A1A1D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
  },
  listCard: {
    flex: 1,
    backgroundColor: '#141518',
    borderRadius: 22,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  listTitle: {
    color: '#8C92FF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    color: '#6E6E73',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactStatus: {
    color: '#8E8E93',
    fontSize: 14,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 108,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F7CFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
  },
});
