import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/authService';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { UserProfile } from '../types/user';
import { cloudinaryUpload } from '../services/cloudinaryService';
import { BirthdayModal } from '../components/BirthdayModal';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const { displayName: initialName, photoURL, uid } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState(photoURL || '');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isBirthdayModalVisible, setIsBirthdayModalVisible] = useState(false);

  const loadProfile = async () => {
    if (!uid) {
      setLoadingProfile(false);
      return;
    }

    try {
      const profile = (await getUserProfile(uid)) as UserProfile | null;
      if (profile) {
        const parts = (profile.displayName || initialName || '').split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        
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

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [uid, initialName, photoURL])
  );

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    if (!uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setLoading(true);
    try {
      const normalizedUsername = username.trim().replace(/^@+/, '');
      const fullDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim();

      await updateUserProfile(uid, {
        displayName: fullDisplayName,
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Conta',
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading || loadingProfile || isUploadingPhoto}
          style={{ marginRight: 5 }}
        >
          <Ionicons name="checkmark" size={28} color={themeColors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, themeColors, loading, loadingProfile, isUploadingPhoto, firstName, lastName, photoUrlInput, username, phone, bio, birthday]);

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
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const isBusy = loading || loadingProfile || isUploadingPhoto;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}> 
          <TouchableOpacity activeOpacity={0.8} onPress={handlePickPhoto} disabled={isBusy} style={styles.avatarContainer}>
            <Avatar uri={photoUrlInput || null} name={firstName || 'U'} size={90} />
            <View style={[styles.uploadBadge, { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
              {isUploadingPhoto ? (
                <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: themeColors.primary, fontWeight: '500' }]} onPress={handlePickPhoto}>
            {isUploadingPhoto ? 'Enviando foto...' : 'Alterar Foto de Perfil'}
          </Text>
        </View>

        {/* Seção 1: Suas Informações */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Suas Informações</Text>
        <View style={[styles.infoCard, { backgroundColor: themeColors.surface }]}>
          <InfoRow 
            icon="call-outline" 
            value={phone || '+55 (XX) XXXXX-XXXX'} 
            subtitle="Toque para alterar o número de telefone"
            onPress={() => navigation.navigate('ChangePhone')}
          />
          <InfoRow 
            icon="at" 
            value={username ? `@${username}` : '@username'} 
            subtitle="Nome de Usuário"
            onPress={() => navigation.navigate('ChangeUsername')}
          />
          <InfoRow 
            icon="cake-variant-outline" 
            iconType="Material"
            value={birthday || 'Não informado'} 
            subtitle="Nascimento"
            isLast
            onPress={() => setIsBirthdayModalVisible(true)}
          />
        </View>
        <TouchableOpacity style={styles.birthdayFootnote} onPress={() => setIsBirthdayModalVisible(true)}>
          <Text style={[styles.footnoteText, { color: themeColors.textSecondary }]}>
            Somente seus contatos podem ver seu aniversário. <Text style={{ color: themeColors.primary }}>Alterar {'>'}</Text>
          </Text>
        </TouchableOpacity>

        {/* Seção 2: Seu nome */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Seu nome</Text>
        <View style={[styles.infoCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: themeColors.primary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { color: themeColors.textPrimary }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nome"
              placeholderTextColor={themeColors.textSecondary}
              editable={!isBusy}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: themeColors.separator }]} />
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: themeColors.primary }]}>Sobrenome</Text>
            <TextInput
              style={[styles.input, { color: themeColors.textPrimary }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Sobrenome"
              placeholderTextColor={themeColors.textSecondary}
              editable={!isBusy}
            />
          </View>
        </View>

        {/* Seção 3: Sua Bio */}
        <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Sua bio</Text>
        <View style={[styles.infoCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.bioContainer}>
            <TextInput
              style={[styles.bioInput, { color: themeColors.textPrimary }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Escreva sobre você..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              maxLength={70}
              editable={!isBusy}
            />
            <Text style={[styles.charCount, { color: themeColors.textSecondary }]}>{70 - bio.length}</Text>
          </View>
        </View>
        <Text style={[styles.footnoteTextUnder, { color: themeColors.textSecondary }]}>
          Você pode escrever algo sobre você. Escolha quem pode ver sua bio nas Configurações.
        </Text>

        {/* Seção 4: Ações */}
        <View style={{ marginTop: spacing.xl }}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: themeColors.surface }]} activeOpacity={0.7}>
            <Ionicons name="person-add-outline" size={22} color={themeColors.primary} />
            <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>Adicionar Conta</Text>
          </TouchableOpacity>
        </View>

        <BirthdayModal 
          visible={isBirthdayModalVisible}
          onClose={() => setIsBirthdayModalVisible(false)}
          initialValue={birthday}
          onSave={(date) => {
            setBirthday(date);
            // Optionally auto-save if profile logic is here or wait for header checkmark
          }}
          onRemove={() => setBirthday('')}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ 
  icon, 
  value, 
  subtitle, 
  iconType = 'Ionicons', 
  isLast = false, 
  onPress 
}: { 
  icon: string; 
  value: string; 
  subtitle: string; 
  iconType?: 'Ionicons' | 'Material'; 
  isLast?: boolean; 
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();

  return (
    <TouchableOpacity style={styles.infoRowContainer} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.infoRowLeft}>
        {iconType === 'Ionicons' ? (
          <Ionicons name={icon as any} size={24} color={themeColors.textSecondary} />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={24} color={themeColors.textSecondary} />
        )}
      </View>
      <View style={[styles.infoRowRight, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.separator }]}>
        <Text style={[styles.infoValue, { color: themeColors.textPrimary }]}>{value}</Text>
        <Text style={[styles.infoSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  helperText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  infoRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowLeft: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowRight: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
  },
  birthdayFootnote: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  footnoteText: {
    fontSize: 13,
  },
  footnoteTextUnder: {
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  inputRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    paddingVertical: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  bioContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bioInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    gap: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
