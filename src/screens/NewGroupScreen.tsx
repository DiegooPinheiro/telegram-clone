import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { createGroup } from '../services/cometChatService';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'NewGroup'>;

export default function NewGroupScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const groupName = name.trim();
    if (!groupName) {
      Alert.alert('Aviso', 'Informe um nome para o grupo.');
      return;
    }

    setCreating(true);
    try {
      const group = await createGroup(groupName, 'public');
      navigation.replace('Chat', {
        uid: group.getGuid(),
        name: group.getName(),
        isGroup: true,
      });
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Nao foi possivel criar o grupo.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Nome do grupo</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBackground,
              borderColor: colors.separator,
            },
          ]}
          placeholder="Ex: Time do Projeto"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={80}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: creating ? 0.7 : 1 }]}
          activeOpacity={0.85}
          onPress={handleCreate}
          disabled={creating}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {creating ? 'Criando...' : 'Criar Grupo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
