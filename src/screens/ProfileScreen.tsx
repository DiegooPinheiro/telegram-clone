import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { getUserProfile } from '../services/authService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types/user';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { uid: currentUserId } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const uid = route.params?.uid || currentUserId;

  const { statusText, online } = useOnlineStatus(uid || '');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getUserProfile(uid);
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  const displayName = profile?.displayName || 'Sem nome';
  const isCurrentUser = uid === currentUserId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 200 }]}> 
        <View style={styles.profileHeader}>
          <Avatar uri={profile?.photoURL || null} name={displayName} size={90} online={isCurrentUser ? true : online} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{isCurrentUser ? 'online' : statusText || 'visto recentemente'}</Text>
        </View>

        {isCurrentUser && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('EditProfile')}>
              <MaterialIcons name="add-a-photo" size={22} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Definir Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('EditProfile')}>
              <MaterialIcons name="edit" size={22} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Editar Informacoes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Settings')}>
              <MaterialIcons name="settings" size={22} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Configuracoes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{profile?.phone || '+55 (XX) XXXXX-XXXX'}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Celular</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{profile?.username ? `@${profile.username}` : '@username'}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nome de Usuario</Text>
          </View>

          <View style={[styles.infoBlock, { marginBottom: 0 }]}> 
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{profile?.birthday || '--/--/----'}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Aniversario</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tabsBackground, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={[styles.tab, styles.tabActive, { backgroundColor: isDark ? '#2A2A35' : '#dce9ff' }]}>
              <Text style={[styles.tabTextActive, { color: colors.tabBarActive }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: colors.textSecondary }]}>Posts Arquivados</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhum post ainda...</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {profile?.bio || 'Preencha sua bio em Editar Informacoes para completar o perfil.'}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.fabContainer, { bottom: insets.bottom + 82 }]}> 
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.8} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="camera" size={20} color="#FFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>Adicionar ao perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  infoCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoBlock: {
    marginBottom: 16,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tabsBackground: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#2A2A35',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 24,
  },
  fab: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabIcon: {
    marginRight: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

