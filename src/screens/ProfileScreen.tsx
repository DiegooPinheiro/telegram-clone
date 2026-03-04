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
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { getUserProfile } from '../services/authService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types/user';

import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { uid: currentUserId } = useAuth();
  const { colors: themeColors } = useTheme();
  
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

  const displayName = profile?.displayName || 'Usuário';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        <View style={[styles.profileHeader, { backgroundColor: themeColors.background }]}>
          <Avatar
            uri={profile?.photoURL}
            name={displayName}
            size={100}
            online={online}
          />
          <Text style={[styles.name, { color: themeColors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.status, { color: themeColors.textSecondary }]}>{statusText}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.background }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: themeColors.primary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: themeColors.textPrimary }]}>{profile?.email || '-'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: themeColors.primary }]}>Bio</Text>
            <Text style={[styles.infoValue, { color: themeColors.textPrimary }]}>
              {profile?.status || 'Sem bio'}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: themeColors.background }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              navigation.navigate('Chat', { uid: uid!, name: displayName })
            }
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, { color: themeColors.primary }]}>Enviar mensagem</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  status: {
    fontSize: 15,
  },
  section: {
    marginBottom: spacing.sm,
  },
  infoRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
