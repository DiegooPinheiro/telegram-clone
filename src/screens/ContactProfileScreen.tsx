import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { getUserProfile, getUserProfileByUsername } from '../services/authService';
import { chatListUsers } from '../services/chatApi';
import type { ChatApiUser } from '../types/chatApi';
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
  const { setMenuVisible: setGlobalMenuVisible } = useSettings();
  const [localMenuVisible, setLocalMenuVisible] = useState(false);
  
  const routeUid = route.params?.uid || null;
  const routeUsername = route.params?.username || '';
  const routeName = route.params?.name || '';
  const routeAvatar = route.params?.avatar || null;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chatUser, setChatUser] = useState<ChatApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { statusText } = useOnlineStatus(profile?.uid || routeUid || '');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadProfile = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      
      let profileData: UserProfile | null = null;
      
      const firestoreData = routeUid
        ? await getUserProfile(routeUid)
        : routeUsername
          ? await getUserProfileByUsername(routeUsername)
          : null;
      
      if (firestoreData) {
        profileData = firestoreData as UserProfile;
        setProfile(profileData);
      }

      // Sincronizar com Chat API para obter o _id correto
      const searchTerms = profileData?.email || profileData?.username || routeUsername;
      if (searchTerms) {
        const chatUsers = await chatListUsers(searchTerms);
        // Tentar encontrar o melhor match
        const found = chatUsers.find(u => 
          u.username === profileData?.username || 
          u.nome === profileData?.displayName ||
          u.username === routeUsername
        );
        setChatUser(found || chatUsers[0] || null);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do contato:', error);
    } finally {
      setLoading(false);
    }
  }, [routeUid, routeUsername]);

  useEffect(() => {
    loadProfile(true);
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(false);
    }, [loadProfile])
  );

  const displayName =
    profile?.displayName?.trim() ||
    profile?.username?.trim() ||
    routeName?.trim() ||
    'Sem nome';
  const profilePhoto = profile?.photoURL || routeAvatar || null;
  const phoneText = profile?.phone?.trim() || 'Não informado';
  const bioText = profile?.bio?.trim() || 'Nenhuma biografia disponível.';

  if (!profile && loading) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLocalMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.profileHeader}>
          <Avatar uri={profilePhoto} name={displayName} size={90} online={false} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>{statusText || 'visto recentemente'}</Text>
        </View>

        <View style={styles.contactActionsRow}>
          <TouchableOpacity 
            style={[styles.contactActionButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              const targetChatId = chatUser?._id;
              if (targetChatId) {
                navigation.navigate('Chat', {
                  userId: targetChatId,
                  name: displayName,
                  avatar: profilePhoto,
                  username: profile?.username || routeUsername,
                });
              } else {
                console.log('[ContactProfile] Chat ID não encontrado para o usuário.');
              }
            }}
          >
            <Ionicons name="chatbubble" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Mensagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="notifications-off" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Ativar som</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="call" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Ligar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactActionButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="videocam" size={22} color={colors.textPrimary} />
            <Text style={[styles.contactActionText, { color: colors.textPrimary }]}>Vídeo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{phoneText}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Celular</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]} />
          <View style={[styles.infoBlock, { marginBottom: 0 }]}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{bioText}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Biografia</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tabsBackground, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={[styles.tab, { backgroundColor: isDark ? "#33435C" : "#E5E5EA" }]}>
              <Text style={[styles.tabTextActive, { color: isDark ? "#8aa4ff" : colors.primary }]}>Arquivos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: colors.textSecondary }]}>Músicas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: colors.textSecondary }]}>Voz</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fileList}>
          <View style={[styles.emptyFilesCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="document-outline" size={30} color={colors.textSecondary} />
            <Text style={[styles.emptyFilesTitle, { color: colors.textPrimary }]}>Nenhum arquivo compartilhado</Text>
            <Text style={[styles.emptyFilesText, { color: colors.textSecondary }]}>
              Os arquivos enviados nas conversas aparecerão aqui.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={localMenuVisible} animationType="fade" onRequestClose={() => setLocalMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setLocalMenuVisible(false)}>
          <View
            style={[
              styles.menuCard,
              {
                top: insets.top + 6,
                backgroundColor: colors.surface,
                borderColor: colors.separator,
              },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="timer-outline" size={22} color={colors.textPrimary} />
              <View style={styles.menuItemTextRow}>
                <Text style={[styles.menuText, { color: colors.textPrimary }]}>Autoexcluir</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Compartilhar contato</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="ban-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Bloquear usuário</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="pencil-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Editar Contato</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="trash-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Apagar Contato</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="gift-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Enviar um Presente</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Iniciar Chat Secreto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="eye-off-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Desativar Compartilhamento</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setLocalMenuVisible(false)}>
              <Ionicons name="add-circle-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Adicionar à Tela Inicial</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  menuBackdrop: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    right: 14,
    width: 280,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  menuItemTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuText: {
    fontSize: 15.5,
    fontWeight: '500',
  },
});
