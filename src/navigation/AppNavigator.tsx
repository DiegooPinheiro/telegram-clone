import React, { useState } from 'react';
import { TouchableOpacity, Modal, Pressable, View, Text, StyleSheet, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import useTheme from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContactProfileScreen from '../screens/ContactProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import NewChatScreen from '../screens/NewChatScreen';
import NewGroupScreen from '../screens/NewGroupScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import DataStorageScreen from '../screens/DataStorageScreen';
import HelpScreen from '../screens/HelpScreen';
import FloatingBottomTab from '../components/FloatingBottomTab';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator tabBar={(props) => <FloatingBottomTab {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="ChatList" component={ChatListScreen as any} />
      <Tab.Screen name="Contacts" component={ContactsScreen as any} />
      <Tab.Screen name="Settings" component={SettingsScreen as any} />
      <Tab.Screen name="Profile" component={ProfileScreen as any} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isDark, colors } = useTheme();
  const { toggleTheme, menuVisible, setMenuVisible } = useSettings();
  const insets = useSafeAreaInsets();


  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChatList';
            return {
              headerShown: false,
            title: 'Vibe',
            headerLeft: () => null,
            headerRight: () => (
              <View style={styles.headerActions}>
                {route.params?.showChatActions && (
                  <TouchableOpacity
                    style={styles.headerAction}
                    activeOpacity={0.75}
                    onPress={() => route.params?.onDeleteSelected?.()}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.headerAction} activeOpacity={0.75} onPress={() => setMenuVisible(true)}>
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ),
            };
          }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '', animation: 'slide_from_right' }} />
        <Stack.Screen name="ContactProfile" component={ContactProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewChat" component={NewChatScreen} options={{ title: 'Nova Conversa' }} />
        <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ title: 'Novo Grupo' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificacoes' }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacidade' }} />
        <Stack.Screen name="DataStorage" component={DataStorageScreen} options={{ title: 'Dados e Armazenamento' }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Ajuda' }} />
      </Stack.Navigator>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
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
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.separator }]}
              activeOpacity={0.75}
              onPress={() => {
                toggleTheme();
                setMenuVisible(false);
              }}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>{isDark ? 'Modo Claro' : 'Modo Escuro'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => {
                setMenuVisible(false);
                if (navigationRef.isReady()) {
                  navigationRef.navigate('NewGroup');
                }
              }}
            >
              <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Novo Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Mensagens Salvas', 'Esta opcao sera adicionada em breve.');
              }}
            >
              <Ionicons name="bookmark-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Mensagens Salvas</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginRight: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    top: 0,
    right: 14,
    width: 270,
    borderRadius: 14,
    backgroundColor: '#232428',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2F3136',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3B40',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
});
