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
import { getUserProfile, getUserProfileByUsername } from '../services/authService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types/user';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactProfile'>;

export default function ContactProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const routeUid = route.params?.uid || null;
  const routeUsername = route.params?.username || '';
  const routeName = route.params?.name || '';
  const routeAvatar = route.params?.avatar || null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { statusText } = useOnlineStatus(profile?.uid || routeUid || '');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = routeUid
        ? await getUserProfile(routeUid)
        : routeUsername
          ? await getUserProfileByUsername(routeUsername)
          : null;

      setProfile(data ? (data as UserProfile) : null);
    } catch (error) {
      console.error('Erro ao carregar perfil do contato:', error);
    } finally {
      setLoading(false);
    }
  }, [routeUid, routeUsername]);

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

  const displayName =
    profile?.displayName?.trim() ||
    profile?.username?.trim() ||
    routeName?.trim() ||
    'Sem nome';
  const profilePhoto = profile?.photoURL || routeAvatar || null;
  const phoneText = profile?.phone?.trim() || 'Não informado';
  const bioText = profile?.bio?.trim() || 'Nenhuma biografia disponível.';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.profileHeader}>
          <Avatar uri={profilePhoto} name={displayName} size={90} online={false} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.status}>{statusText || 'visto recentemente'}</Text>
        </View>

        <View style={styles.contactActionsRow}>
          <TouchableOpacity style={styles.contactActionButton}>
            <Ionicons name="chatbubble" size={22} color="#FFFFFF" />
            <Text style={styles.contactActionText}>Mensagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactActionButton}>
            <Ionicons name="notifications-off" size={22} color="#FFFFFF" />
            <Text style={styles.contactActionText}>Ativar som</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactActionButton}>
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text style={styles.contactActionText}>Ligar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactActionButton}>
            <Ionicons name="videocam" size={22} color="#FFFFFF" />
            <Text style={styles.contactActionText}>Vídeo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoValue}>{phoneText}</Text>
            <Text style={styles.infoLabel}>Celular</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.infoBlock, { marginBottom: 0 }]}>
            <Text style={styles.infoValue}>{bioText}</Text>
            <Text style={styles.infoLabel}>Biografia</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabsBackground}>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabTextActive}>Arquivos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextInactive}>Músicas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabTextInactive}>Voz</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fileList}>
          <View style={styles.emptyFilesCard}>
            <Ionicons name="document-outline" size={30} color="#8b9099" />
            <Text style={styles.emptyFilesTitle}>Nenhum arquivo compartilhado</Text>
            <Text style={styles.emptyFilesText}>
              Os arquivos enviados nas conversas aparecerão aqui.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 26,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 14,
  },
  status: {
    fontSize: 14,
    color: '#9ea1aa',
    marginTop: 4,
  },
  contactActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  contactActionButton: {
    flex: 1,
    backgroundColor: '#1C1C1D',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#1C1C1D',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingLeft: 16,
    marginBottom: 26,
  },
  infoBlock: {
    paddingVertical: 14,
    paddingRight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 2,
  },
  infoLabel: {
    color: '#9ea1aa',
    fontSize: 14,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsBackground: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1D',
    borderRadius: 24,
    padding: 3,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#33435C',
  },
  tabTextActive: {
    color: '#8aa4ff',
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextInactive: {
    color: '#9ea1aa',
    fontSize: 15,
    fontWeight: '500',
  },
  fileList: {
    paddingHorizontal: 16,
  },
  emptyFilesCard: {
    backgroundColor: '#1C1C1D',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyFilesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyFilesText: {
    color: '#9ea1aa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
