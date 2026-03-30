import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { disableTwoStepAuth } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';
import CustomAlert from '../components/CustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepSettings'>;

export default function TwoStepSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { refreshProfile } = useAuthContext();
  const [disableAlertVisible, setDisableAlertVisible] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [errorAlert, setErrorAlert] = useState({
    visible: false,
    message: '',
  });

  const handleDisable = () => {
    setDisableAlertVisible(true);
  };

  const handleConfirmDisable = async () => {
    if (disabling) return;

    setDisabling(true);

    try {
      await disableTwoStepAuth();
      await refreshProfile();
      setDisableAlertVisible(false);
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' as never },
          { name: 'Privacy' as never },
        ],
      });
    } catch (error: any) {
      setDisableAlertVisible(false);
      setErrorAlert({
        visible: true,
        message: error.message || 'Nao foi possivel desativar o 2FA.',
      });
    } finally {
      setDisabling(false);
    }
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
            label="Alterar email de recuperacao"
            onPress={() => navigation.navigate('TwoStepEmail', { password: '', mode: 'change' })}
          />
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Voce ativou a Verificacao em Duas Etapas. Voce precisara da senha que configurou aqui para fazer o login em sua conta do Telegram.
        </Text>
      </ScrollView>

      <CustomAlert
        visible={disableAlertVisible}
        title="Desativar Senha"
        message="Se voce continuar, a senha extra deixara de ser exigida nos novos logins. Tem certeza de que deseja desativar a Verificacao em Duas Etapas?"
        onCancel={() => {
          if (!disabling) {
            setDisableAlertVisible(false);
          }
        }}
        onConfirm={handleConfirmDisable}
        cancelLabel="Manter ativa"
        confirmLabel="Desativar"
        isDestructive
        loading={disabling}
      />

      <CustomAlert
        visible={errorAlert.visible}
        title="Erro"
        message={errorAlert.message}
        onConfirm={() => setErrorAlert({ visible: false, message: '' })}
      />
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
