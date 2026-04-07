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

  const renderToggle = (label: string, value: boolean, key: string, subtitle?: string) => (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={(val) => updateSetting(key, val)}
        trackColor={{ false: '#767577', true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : '#ccc'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardSection}>
        
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notificações de Mensagens</Text>
          {renderToggle('Mostrar Notificações', msgNotifications, 'msgNotifications')}
          {renderToggle('Prévia da Mensagem', msgPreview, 'msgPreview', 'Mostra o texto nas notificações')}
          {renderToggle('Som', msgSound, 'msgSound')}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notificações de Grupos</Text>
          {renderToggle('Mostrar Notificações', groupNotifications, 'groupNotifications')}
          {renderToggle('Prévia da Mensagem', groupPreview, 'groupPreview')}
          {renderToggle('Som', groupSound, 'groupSound')}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notificações no App</Text>
          {renderToggle('Sons no App', inAppSound, 'inAppSound')}
          {renderToggle('Vibração no App', appVibration, 'appVibration')}
          {renderToggle('Prévia no App', inAppPreview, 'inAppPreview')}
        </View>
        
        <View style={styles.resetGroup}>
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.surface, padding: 0 }]}
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
            <View style={styles.resetButton}>
              <Text style={styles.resetText}>Redefinir Todas as Notificações</Text>
            </View>
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
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    marginTop: 16,
  },
  resetButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '400',
  },
  footerText: {
    fontSize: 13,
    paddingHorizontal: 8,
    marginTop: -8,
    textAlign: 'center',
  },
});
