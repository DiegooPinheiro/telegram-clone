import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  
  const [msgNotifications, setMsgNotifications] = useState(true);
  const [msgPreview, setMsgPreview] = useState(true);
  const [msgSound, setMsgSound] = useState(true);

  const [groupNotifications, setGroupNotifications] = useState(true);
  const [groupPreview, setGroupPreview] = useState(true);
  const [groupSound, setGroupSound] = useState(true);

  const [appVibration, setAppVibration] = useState(true);
  const [inAppPreview, setInAppPreview] = useState(true);
  const [inAppSound, setInAppSound] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@vibe_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setMsgNotifications(parsed.msgNotifications ?? true);
        setMsgPreview(parsed.msgPreview ?? true);
        setMsgSound(parsed.msgSound ?? true);
        setGroupNotifications(parsed.groupNotifications ?? true);
        setGroupPreview(parsed.groupPreview ?? true);
        setGroupSound(parsed.groupSound ?? true);
        setAppVibration(parsed.appVibration ?? true);
        setInAppPreview(parsed.inAppPreview ?? true);
        setInAppSound(parsed.inAppSound ?? true);
      }
    } catch (e) {
      console.log('Erro ao ler notificações', e);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const current = {
        msgNotifications, msgPreview, msgSound,
        groupNotifications, groupPreview, groupSound,
        appVibration, inAppPreview, inAppSound,
      };
      const updated = { ...current, [key]: value };
      
      if (key === 'msgNotifications') setMsgNotifications(value);
      if (key === 'msgPreview') setMsgPreview(value);
      if (key === 'msgSound') setMsgSound(value);
      if (key === 'groupNotifications') setGroupNotifications(value);
      if (key === 'groupPreview') setGroupPreview(value);
      if (key === 'groupSound') setGroupSound(value);
      if (key === 'appVibration') setAppVibration(value);
      if (key === 'inAppPreview') setInAppPreview(value);
      if (key === 'inAppSound') setInAppSound(value);
      
      await AsyncStorage.setItem('@vibe_notifications', JSON.stringify(updated));
    } catch (e) {}
  };

  const renderToggle = (label: string, value: boolean, key: string, isLast = false, subtitle?: string) => (
    <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={(val) => updateSetting(key, val)}
        trackColor={{ false: '#767577', true: colors.primary }}
        ios_backgroundColor="#3e3e3e"
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notificações de Mensagens</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderToggle('Mostrar Notificações', msgNotifications, 'msgNotifications')}
            {renderToggle('Prévia da Mensagem', msgPreview, 'msgPreview', false, 'Mostra o texto nas notificações')}
            {renderToggle('Som', msgSound, 'msgSound', true)}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notificações de Grupos</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderToggle('Mostrar Notificações', groupNotifications, 'groupNotifications')}
            {renderToggle('Prévia da Mensagem', groupPreview, 'groupPreview')}
            {renderToggle('Som', groupSound, 'groupSound', true)}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notificações no App</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderToggle('Sons no App', inAppSound, 'inAppSound')}
            {renderToggle('Vibração no App', appVibration, 'appVibration')}
            {renderToggle('Prévia no App', inAppPreview, 'inAppPreview', true)}
          </View>
        </View>
        
        <View style={styles.resetGroup}>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={async () => {
              const defaultVals = {
                msgNotifications: true, msgPreview: true, msgSound: true,
                groupNotifications: true, groupPreview: true, groupSound: true,
                appVibration: true, inAppPreview: true, inAppSound: true,
              };
              setMsgNotifications(true); setMsgPreview(true); setMsgSound(true);
              setGroupNotifications(true); setGroupPreview(true); setGroupSound(true);
              setAppVibration(true); setInAppPreview(true); setInAppSound(true);
              await AsyncStorage.setItem('@vibe_notifications', JSON.stringify(defaultVals));
            }}
          >
            <Text style={styles.resetText}>Redefinir Todas as Notificações</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Desfazer todas as suas opções e retornar ao padrão original do sistema para ligações e alertas.</Text>
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
    paddingHorizontal: 8,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  headerButtonText: {
    fontSize: 17,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  group: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 16,
    marginLeft: 16,
    minHeight: 46,
  },
  labelContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  resetGroup: {
    marginTop: 32,
    marginBottom: 40,
  },
  resetButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  resetText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
