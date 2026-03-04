import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../services/authService';
import Avatar from '../components/Avatar';

import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const { displayName: initialName, photoURL, uid } = useAuth();
  const [name, setName] = useState(initialName || '');
  const [bio, setBio] = useState(''); // Bio support can be added to authService later
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(uid as string, { displayName: name });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: themeColors.separator }]}>
        <Avatar uri={photoURL} name={name} size={80} />
        <TouchableOpacity style={styles.changePhoto}>
          <Text style={[styles.changePhotoText, { color: themeColors.primary }]}>Alterar Foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: themeColors.primary }]}>Nome</Text>
          <TextInput
            style={[styles.input, { borderBottomColor: themeColors.separator, color: themeColors.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: themeColors.primary }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { borderBottomColor: themeColors.separator, color: themeColors.textPrimary }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Alguma coisa sobre você..."
            placeholderTextColor={themeColors.textSecondary}
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: themeColors.primary }, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  changePhoto: {
    marginTop: spacing.sm,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderBottomWidth: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
