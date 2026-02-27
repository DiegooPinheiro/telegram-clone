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

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { uid } = route.params;
  const { online, statusText } = useOnlineStatus(uid);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <Avatar
            uri={profile?.photoURL}
            name={displayName}
            size={100}
            online={online}
          />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>
              {profile?.status || 'Sem bio'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              navigation.navigate('Chat', { uid, name: displayName })
            }
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Enviar mensagem</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  status: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  infoRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
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
    color: colors.primary,
    fontWeight: '500',
  },
});
