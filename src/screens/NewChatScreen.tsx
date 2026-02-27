import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fetchUsers } from '../services/cometChatService';
import ContactItem from '../components/ContactItem';
import LoadingSpinner from '../components/LoadingSpinner';

type Props = NativeStackScreenProps<RootStackParamList, 'NewChat'>;

export default function NewChatScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetched = await fetchUsers();
        setUsers(fetched);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.getName().toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }: { item: CometChat.User }) => (
    <ContactItem
      uid={item.getUid()}
      name={item.getName()}
      status={item.getStatusMessage() || ''}
      avatar={item.getAvatar() || null}
      online={item.getStatus() === 'online'}
      onPress={() =>
        navigation.navigate('Chat', {
          uid: item.getUid(),
          name: item.getName(),
        })
      }
    />
  );

  if (loading) {
    return <LoadingSpinner message="Buscando usuários..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Quem você quer contactar?"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.getUid()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  searchInput: {
    height: 40,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  listContent: {
    paddingVertical: spacing.xs,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 78,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
