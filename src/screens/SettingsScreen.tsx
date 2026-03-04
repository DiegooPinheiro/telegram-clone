import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import useAuth from '../hooks/useAuth';
import { signOut } from '../services/authService';
import { logoutCometChat } from '../services/cometChatService';
import Avatar from '../components/Avatar';
import { useSettings } from '../context/SettingsContext';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { displayName, email, photoURL } = useAuth();
  const { theme, toggleTheme, language } = useSettings();
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutCometChat();
            await signOut();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao sair');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        {/* Perfil */}
        <TouchableOpacity 
          style={[styles.profileSection, { backgroundColor: colors.background }]} 
          activeOpacity={0.7}
        >
          <Avatar
            uri={photoURL}
            name={displayName || 'User'}
            size={64}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{displayName || 'Usuário'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{email || ''}</Text>
          </View>
        </TouchableOpacity>

        {/* Opções */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Conta</Text>
          <SettingRow 
            icon="📝" 
            label="Editar perfil" 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <SettingRow 
            icon="🔔" 
            label="Notificações" 
            onPress={() => navigation.navigate('Notifications')} 
          />
          <SettingRow 
            icon="🔒" 
            label="Privacidade" 
            onPress={() => navigation.navigate('Privacy')} 
          />
          <SettingRow 
            icon="💾" 
            label="Dados e armazenamento" 
            onPress={() => navigation.navigate('DataStorage')} 
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Configurações</Text>
          <SettingRow 
            icon={theme === 'dark' ? '☀️' : '🌙'} 
            label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'} 
            onPress={toggleTheme} 
          />
          <SettingRow 
            icon="🌐" 
            label="Idioma" 
            subtitle={language === 'pt' ? 'Português' : 'English'} 
            onPress={() => {}} 
          />
          <SettingRow 
            icon="❓" 
            label="Ajuda" 
            onPress={() => navigation.navigate('Help')} 
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.background }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.badge }]}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSecondary }]}>Telegram Clone v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={settingStyles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={settingStyles.icon}>{icon}</Text>
      <View style={settingStyles.content}>
        <Text style={[settingStyles.label, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[settingStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Text style={[settingStyles.arrow, { color: colors.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.lg,
    width: 28,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 15,
  },
  section: {
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: spacing.lg,
  },
});
