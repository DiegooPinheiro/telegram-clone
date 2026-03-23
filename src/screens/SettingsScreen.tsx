import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import useAuth from '../hooks/useAuth';
import { getUserProfile, signOut } from '../services/authService';
import Avatar from '../components/Avatar';
import { useSettings } from '../context/SettingsContext';
import useTheme from '../hooks/useTheme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { displayName, photoURL, uid } = useAuth();
  const { language } = useSettings();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await getUserProfile(uid);
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil em configuracoes:', error);
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

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao sair');
          }
        },
      },
    ]);
  };

  const headerPhone = profile?.phone || '+55 (XX) XXXXX-XXXX';
  const headerUsername = profile?.username ? `@${profile.username}` : '@username';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.topBarButton}>
          <Ionicons name="search-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarButton}>
          <Ionicons name="ellipsis-vertical" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}> 
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={styles.avatarContainer} onPress={() => navigation.navigate('EditProfile')}>
            <Avatar uri={profile?.photoURL || photoURL} name={profile?.displayName || displayName || 'User'} size={100} />
            <View style={[styles.cameraBadge, { borderColor: colors.background }]}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerName, { color: colors.textPrimary }]}>{profile?.displayName || displayName || 'Sem nome'}</Text>
          <Text style={[styles.headerPhone, { color: colors.textSecondary }]}>{`${headerPhone} • ${headerUsername}`}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            iconName="person"
            iconBgColor="#2A85FF"
            label="Conta"
            subtitle="Numero, Nome de Usuario, Bio"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingRow
            iconName="chatbubble"
            iconBgColor="#F7931A"
            label="Configuracoes de Chat"
            subtitle="Papel de Parede, Modo Noturno, Animacoes"
            onPress={() => {}}
          />
          <SettingRow
            iconName="key"
            iconBgColor="#34C759"
            label="Privacidade e Seguranca"
            subtitle="Visto por Ultimo, Dispositivos, Chaves de Acesso"
            onPress={() => navigation.navigate('Privacy')}
          />
          <SettingRow
            iconName="notifications"
            iconBgColor="#FF3B30"
            label="Notificacoes"
            subtitle="Sons, Chamadas, Contadores"
            onPress={() => navigation.navigate('Notifications')}
          />
          <SettingRow
            iconName="pie-chart"
            iconBgColor="#5856D6"
            label="Dados e Armazenamento"
            subtitle="Opcoes de download de midia"
            onPress={() => navigation.navigate('DataStorage')}
          />
          <SettingRow
            iconName="laptop-outline"
            iconBgColor="#64D2FF"
            label="Dispositivos"
            subtitle="Gerenciar dispositivos conectados"
            onPress={() => {}}
          />
          <SettingRow
            iconName="globe-outline"
            iconBgColor="#AF52DE"
            label="Idioma"
            subtitle={language === 'pt' ? 'Portugues (Brasil)' : 'English'}
            onPress={() => {}}
            isLast
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>

          <SettingRow iconName="exit-outline" iconBgColor="#FF3B30" label="Sair da Conta" onPress={handleLogout} isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  iconName,
  iconType = 'Ionicons',
  iconBgColor,
  label,
  subtitle,
  rightBadge,
  onPress,
  isLast = false,
}: {
  iconName: string;
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
  iconBgColor: string;
  label: string;
  subtitle?: string;
  rightBadge?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={[settingStyles.container, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={settingStyles.row}>
        <View style={[settingStyles.iconContainer, { backgroundColor: iconBgColor }]}> 
          {iconType === 'Ionicons' ? (
            <Ionicons name={iconName as any} size={18} color="#FFF" />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={18} color="#FFF" />
          )}
        </View>
        <View style={settingStyles.content}>
          <Text style={[settingStyles.label, { color: colors.textPrimary }]}>{label}</Text>
          {subtitle && <Text style={[settingStyles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {rightBadge && <Text style={settingStyles.badgeText}>{rightBadge}</Text>}
      </View>
      {!isLast && <View style={[settingStyles.divider, { backgroundColor: colors.separator }]} />}
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  badgeText: {
    color: '#0A84FF',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383A',
    marginLeft: 62,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  topBarButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5E5CE6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerPhone: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1D',
  },
});


