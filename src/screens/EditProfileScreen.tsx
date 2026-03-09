import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import useAuth from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/authService';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { UserProfile } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const { displayName: initialName, photoURL, uid } = useAuth();

  const [name, setName] = useState(initialName || '');
  const [photoUrlInput, setPhotoUrlInput] = useState(photoURL || '');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!uid) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profile = (await getUserProfile(uid)) as UserProfile | null;
        if (profile) {
          setName(profile.displayName || initialName || '');
          setPhotoUrlInput(profile.photoURL || photoURL || '');
          setUsername(profile.username || '');
          setPhone(profile.phone || '');
          setBio(profile.bio || '');
          setBirthday(profile.birthday || '');
        }
      } catch (error) {
        console.error('Erro ao carregar perfil para edicao:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    load();
  }, [uid, initialName, photoURL]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome nao pode estar vazio.');
      return;
    }

    if (!uid) {
      Alert.alert('Erro', 'Usuario nao autenticado.');
      return;
    }

    setLoading(true);
    try {
      const normalizedUsername = username.trim().replace(/^@+/, '');
      await updateUserProfile(uid, {
        displayName: name.trim(),
        photoURL: photoUrlInput.trim() || '',
        username: normalizedUsername,
        phone: phone.trim(),
        bio: bio.trim(),
        birthday: birthday.trim(),
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || loadingProfile;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { borderBottomColor: themeColors.separator }]}> 
          <Avatar uri={photoUrlInput || null} name={name || 'U'} size={80} />
          <Text style={[styles.helperText, { color: themeColors.textSecondary }]}>Cole uma URL de imagem para a foto</Text>
        </View>

        <View style={styles.form}>
          <Field
            label="URL da Foto"
            value={photoUrlInput}
            onChangeText={setPhotoUrlInput}
            placeholder="https://..."
            themeColors={themeColors}
            autoCapitalize="none"
          />

          <Field
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            themeColors={themeColors}
          />

          <Field
            label="@Username"
            value={username}
            onChangeText={setUsername}
            placeholder="seuusername"
            themeColors={themeColors}
            autoCapitalize="none"
          />

          <Field
            label="Celular"
            value={phone}
            onChangeText={setPhone}
            placeholder="+55 (XX) XXXXX-XXXX"
            themeColors={themeColors}
            keyboardType="phone-pad"
          />

          <Field
            label="Aniversario"
            value={birthday}
            onChangeText={setBirthday}
            placeholder="dd/mm/aaaa"
            themeColors={themeColors}
          />

          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Alguma coisa sobre voce..."
            themeColors={themeColors}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColors.primary }, isBusy && styles.disabledButton]}
            onPress={handleSave}
            disabled={isBusy}
          >
            <Text style={styles.saveButtonText}>{isBusy ? 'Salvando...' : 'Salvar Alteracoes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  themeColors,
  multiline = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  themeColors: any;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: themeColors.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.bioInput,
          { borderBottomColor: themeColors.separator, color: themeColors.textPrimary },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textSecondary}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  helperText: {
    marginTop: spacing.sm,
    fontSize: 13,
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

