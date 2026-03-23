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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/authService';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { UserProfile } from '../types/user';
import { cloudinaryUpload } from '../services/cloudinaryService';

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      const file = {
        uri: fileAsset.uri,
        name: fileAsset.fileName || `profile_${Date.now()}.jpg`,
        type: fileAsset.mimeType || 'image/jpeg',
      };

      setIsUploadingPhoto(true);
      const uploaded = await cloudinaryUpload(file);
      setPhotoUrlInput(uploaded.mediaUrl);
    } catch (error: any) {
      console.error('Erro ao enviar foto para o Cloudinary:', error);
      Alert.alert('Erro', error?.message || 'Nao foi possivel atualizar a foto de perfil.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const isBusy = loading || loadingProfile || isUploadingPhoto;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { borderBottomColor: themeColors.separator }]}> 
          <TouchableOpacity activeOpacity={0.8} onPress={handlePickPhoto} disabled={isBusy} style={styles.avatarContainer}>
            <Avatar uri={photoUrlInput || null} name={name || 'U'} size={90} />
            <View style={[styles.uploadBadge, { backgroundColor: themeColors.primary }]}>
              {isUploadingPhoto ? (
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: themeColors.primary, fontWeight: '500' }]} onPress={handlePickPhoto}>
            {isUploadingPhoto ? 'Enviando foto...' : 'Alterar Foto de Perfil'}
          </Text>
        </View>

        <View style={styles.form}>

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
  avatarContainer: {
    position: 'relative',
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000', // Override based on theme if needed, but absolute is fine for now
  },
  helperText: {
    marginTop: spacing.md,
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

