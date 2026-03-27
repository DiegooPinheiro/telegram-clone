import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import ContactItem from '../components/ContactItem';
import LoadingSpinner from '../components/LoadingSpinner';
import useTheme from '../hooks/useTheme';
import { chatListUsers } from '../services/chatApi';
import type { ChatApiUser } from '../types/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'NewChat'>;

export default function NewChatScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ChatApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetched = await chatListUsers();
        setUsers(fetched);
      } catch (error: any) {
        console.error('Erro ao buscar usuários:', error);
        Alert.alert('Erro', error?.message || 'Não foi possível buscar usuários.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((u) => {
      const name = (u.nome || u.username || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      return name.includes(normalized) || username.includes(normalized);
    });
  }, [users, search]);

  const handleStartChat = (user: ChatApiUser) => {
    navigation.navigate('Chat', {
      userId: user._id,
      name: user.nome || user.username,
      avatar: user.foto || null,
      username: user.username,
    });
  };

  if (loading) {
    return <LoadingSpinner message="Buscando usuários..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: themeColors.background, borderBottomColor: themeColors.separator },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: themeColors.backgroundSecondary, color: themeColors.textPrimary },
          ]}
          placeholder="Quem você quer contatar?"
          placeholderTextColor={themeColors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      <FlatList
        data={filteredUsers}
        style={{ backgroundColor: themeColors.surface }}
        renderItem={({ item }) => (
          <ContactItem
            uid={item._id}
            name={item.nome || item.username}
            status="visto recentemente"
            avatar={item.foto || null}
            online={false}
            onPress={() => handleStartChat(item)}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.separator }]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={38} color={themeColors.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Nenhum usuário encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  listContent: {
    paddingVertical: spacing.xs,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 78,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
});
