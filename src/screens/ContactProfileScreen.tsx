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
import useTheme from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactProfile'>;

export default function ContactProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { setMenuVisible } = useSettings();
  
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

  const backgroundColor = isDark ? "#000000" : colors.background;
  const surfaceColor = isDark ? "#1C1C1D" : colors.surface;
  const secondaryText = isDark ? "#9ea1aa" : colors.textSecondary;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.profileHeader}>
          <Avatar uri={profilePhoto} name={displayName} size={90} online={false} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.status, { color: secondaryText }]}>{statusText || 'visto recentemente'}</Text>
        </View>

        <View style={styles.contactActionsRow}>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: surfaceColor }]}>
            <Ionicons name="chatbubble" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Mensagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: surfaceColor }]}>
            <Ionicons name="notifications-off" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Ativar som</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: surfaceColor }]}>
            <Ionicons name="call" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Ligar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: surfaceColor }]}>
            <Ionicons name="videocam" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Vídeo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{phoneText}</Text>
            <Text style={[styles.infoLabel, { color: secondaryText }]}>Celular</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} />
          <View style={[styles.infoBlock, { marginBottom: 0 }]}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{bioText}</Text>
            <Text style={[styles.infoLabel, { color: secondaryText }]}>Biografia</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tabsBackground, { backgroundColor: surfaceColor }]}>
            <TouchableOpacity style={[styles.tab, isDark && styles.tabActive, !isDark && { backgroundColor: '#E5E5EA' }]}>
              <Text style={[styles.tabTextActive, { color: isDark ? "#8aa4ff" : colors.primary }]}>Arquivos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: secondaryText }]}>Músicas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: secondaryText }]}>Voz</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fileList}>
          <View style={[styles.emptyFilesCard, { backgroundColor: surfaceColor }]}>
            <Ionicons name="document-outline" size={30} color={secondaryText} />
            <Text style={[styles.emptyFilesTitle, { color: colors.textPrimary }]}>Nenhum arquivo compartilhado</Text>
            <Text style={[styles.emptyFilesText, { color: secondaryText }]}>
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
    marginTop: 14,
  },
  status: {
    fontSize: 14,
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
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  infoCard: {
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
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 14,
  },
  tabsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tabsBackground: {
    flexDirection: 'row',
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
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextInactive: {
    fontSize: 15,
    fontWeight: '500',
  },
  fileList: {
    paddingHorizontal: 16,
  },
  emptyFilesCard: {
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyFilesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyFilesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
