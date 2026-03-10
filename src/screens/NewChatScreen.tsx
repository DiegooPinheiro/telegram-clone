import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import { fetchUsers } from '../services/cometChatService';
import ContactItem from '../components/ContactItem';
import LoadingSpinner from '../components/LoadingSpinner';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewChat'>;

export default function NewChatScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<CometChat.User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetched = await fetchUsers();
        setUsers(fetched);
      } catch (error) {
        console.error('Erro ao buscar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => u.getName().toLowerCase().includes(search.toLowerCase()));

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
          avatar: item.getAvatar() || null,
        })
      }
    />
  );

  if (loading) {
    return <LoadingSpinner message="Buscando usuarios..." />;
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
          placeholder="Quem voce quer contatar?"
          placeholderTextColor={themeColors.textSecondary}
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
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: themeColors.separator }]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={38} color={themeColors.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Nenhum usuario encontrado</Text>
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
