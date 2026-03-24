import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { useSettings } from '../context/SettingsContext';

type MenuItem = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
};

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { displayName, email, photoURL } = useAuth();
  const { colors, isDark } = useTheme();
  const { toggleTheme } = useSettings();

  const menuItems: MenuItem[] = [
    { label: 'Novo Grupo', iconName: 'people-outline', route: 'NewChat' },
    { label: 'Contatos', iconName: 'person-outline', route: 'Contacts' },
    { label: 'Chamadas', iconName: 'call-outline', route: 'Help' },
    { label: 'Pessoas Proximas', iconName: 'location-outline', route: 'Help' },
    { label: 'Mensagens Salvas', iconName: 'bookmark-outline', route: 'Help' },
    { label: 'Configuracoes', iconName: 'settings-outline', route: 'Settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: isDark ? colors.backgroundSecondary : colors.primary }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Avatar uri={photoURL} name={displayName || 'U'} size={64} />
              <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{email || 'Sem email'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerItems}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('MainFlow', { screen: item.route })}
          >
            <Ionicons name={item.iconName} size={22} color={colors.textPrimary} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      <View style={[styles.footer, { borderTopColor: colors.separator }]}>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Vibe v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    marginTop: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  themeToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginTop: spacing.md,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  drawerItems: {
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  menuIcon: {
    marginRight: spacing.xl,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  version: {
    fontSize: 12,
  },
});
