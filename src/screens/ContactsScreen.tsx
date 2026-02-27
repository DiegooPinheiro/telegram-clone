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

type Props = NativeStackScreenProps<RootStackParamList, 'Contacts'>;

export default function ContactsScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetched = await fetchUsers();
        setUsers(fetched);
      } catch (error) {
        console.error('Erro ao buscar contatos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.getName().toLowerCase().includes(search.toLowerCase())
  );

  const renderContact = ({ item }: { item: CometChat.User }) => (
    <ContactItem
      uid={item.getUid()}
      name={item.getName()}
      status={item.getStatusMessage() || ''}
      avatar={item.getAvatar() || null}
      online={item.getStatus() === 'online'}
      onPress={() => navigation.navigate('Profile', { uid: item.getUid() })}
    />
  );

  if (loading) {
    return <LoadingSpinner message="Carregando contatos..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contatos..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderContact}
        keyExtractor={(item) => item.getUid()}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
