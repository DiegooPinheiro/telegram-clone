import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList } from './types';
import useTheme from '../hooks/useTheme';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
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
import HeaderMenuButton from '../components/HeaderMenuButton';

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
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          title: 'Telegram Clone',
          headerLeft: () => null,
          headerRight: () => <HeaderMenuButton />,
        }}
      />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
        <Stack.Screen name="NewChat" component={NewChatScreen} options={{ title: 'Nova Conversa' }} />
        <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ title: 'Novo Grupo' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificacoes' }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacidade' }} />
        <Stack.Screen name="DataStorage" component={DataStorageScreen} options={{ title: 'Dados e Armazenamento' }} />
        <Stack.Screen name="Help" component={HelpScreen} options={{ title: 'Ajuda' }} />
      </Stack.Navigator>
  );
}

