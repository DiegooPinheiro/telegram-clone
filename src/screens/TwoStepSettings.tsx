import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { disableTwoStepAuth } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepSettings'>;

export default function TwoStepSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { refreshProfile } = useAuthContext();

  const handleDisable = () => {
    Alert.alert(
      'Desativar Senha',
      'Tem certeza de que deseja desativar a Verificação em Duas Etapas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desativar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await disableTwoStepAuth();
              await refreshProfile();
              navigation.navigate('Privacy');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível desativar o 2FA.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingItem 
            label="Alterar senha" 
            onPress={() => navigation.navigate('TwoStepPassword', { mode: 'change' })} 
          />
          <Divider />
          <SettingItem 
            label="Desativar Senha" 
            onPress={handleDisable} 
            destructive
          />
          <Divider />
          <SettingItem 
            label="Alterar email de recuperação" 
            onPress={() => navigation.navigate('TwoStepEmail', { password: '', mode: 'change' })} 
          />
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Você ativou a Verificação em Duas Etapas. Você precisará da senha que configurou aqui para fazer o login em sua conta do Telegram.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.itemText, { color: destructive ? '#FF3B30' : colors.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.separator }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 17,
  },
  divider: {
    height: 0.5,
    marginLeft: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
