import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getUserProfile } from '../services/authService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types/user';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { uid: currentUserId } = useAuth();
  
  // Use UID from params, or fallback to current logged in user
  const uid = route.params?.uid || currentUserId;
  
  const { online, statusText } = useOnlineStatus(uid || '');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const loadProfile = async () => {
      try {
        const data = await getUserProfile(uid);
        if (data) {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [uid]);

  if (loading) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  const displayName = profile?.displayName || 'D H';
  const isCurrentUser = uid === currentUserId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            uri={profile?.photoURL}
            name={displayName}
            size={90}
            online={false} // Customizing UI for screenshot
          />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.status}>{statusText || 'online'}</Text>
        </View>

        {/* Action Buttons Row */}
        {isCurrentUser && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="add-a-photo" size={22} color="#FFF" />
              <Text style={styles.actionButtonText}>Definir Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
              <MaterialIcons name="edit" size={22} color="#FFF" />
              <Text style={styles.actionButtonText}>Editar Informações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
              <MaterialIcons name="settings" size={22} color="#FFF" />
              <Text style={styles.actionButtonText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoValue}>+55 (98) 98441-0040</Text>
            <Text style={styles.infoLabel}>Celular</Text>
          </View>
          
          <View style={styles.infoBlock}>
            <Text style={styles.infoValue}>@DiegoHatake_dh</Text>
            <Text style={styles.infoLabel}>Nome de Usuário</Text>
          </View>
          
          <View style={[styles.infoBlock, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.infoValue}>12 de set. de 1996 (29 anos)</Text>
            <Text style={styles.infoLabel}>Aniversário</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsBackground}>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabTextActive}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextInactive}>Posts Arquivados</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum post ainda...</Text>
          <Text style={styles.emptySubtitle}>
            Publique fotos e vídeos para mostrar na sua página de perfil
          </Text>
        </View>

      </ScrollView>

      {/* FAB - Bottom Centered */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Ionicons name="camera" size={20} color="#FFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>Adicione um post</Text>
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
    color: '#FFFFFF',
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    color: '#8E8E93',
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
    backgroundColor: '#1C1C1D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#1C1C1D',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoBlock: {
    marginBottom: 16,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 4,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tabsBackground: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1D',
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
    color: '#8C92FF',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextInactive: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0, // Should be above bottom tab ideally, handled by edges
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 24,
  },
  fab: {
    flexDirection: 'row',
    backgroundColor: '#5E5CE6',
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
