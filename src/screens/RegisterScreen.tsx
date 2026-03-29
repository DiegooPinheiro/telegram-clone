import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { validateEmail, validatePassword, validateDisplayName } from '../utils/validators';
import { signUp } from '../services/authService';
import CustomAlert from '../components/CustomAlert';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { cloudinaryUpload } from '../services/cloudinaryService';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation, route }: Props) {
  const verifiedPhone = route.params?.phone || '';
  const { colors: themeColors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(verifiedPhone);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const hideAlert = () => setAlertConfig({ ...alertConfig, visible: false });

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
      setPhotoUrl(uploaded.mediaUrl);
    } catch (error: any) {
      console.error('Erro ao enviar foto para o Cloudinary:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível enviar a foto de perfil.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };


  const handleRegister = async () => {
    const nameError = validateDisplayName(name);
    if (nameError) {
      Alert.alert('Erro', nameError);
      return;
    }


    setLoading(true);
    try {
      // Remove a mascara antes de enviar para o backend
      const rawPhone = phone.replace(/\D/g, '');
      const authRes = await signUp(name.trim(), '', rawPhone, photoUrl) as any;

      if (authRes) {
        // Nao navegamos manualmente. O App.tsx vai trocar o navegador quando phoneVerified for true.
        console.log('[Register] Perfil finalizado com sucesso.');
      }
    } catch (error: any) {
      let message = 'Tente novamente mais tarde.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso por outra conta.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      } else if (error.message) {
        message = error.message;
      }
      
      showAlert('Erro no cadastro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handlePickPhoto} 
            disabled={isUploadingPhoto || loading} 
            style={styles.avatarContainer}
          >
            <Avatar uri={photoUrl || null} name={name || 'U'} size={100} />
            <View style={[styles.uploadBadge, { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
              {isUploadingPhoto ? (
                <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.primary }]}>Crie seu Perfil</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Escolha seu nome e uma foto (opcional)</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.textPrimary }]}
            placeholder="Nome completo"
            placeholderTextColor={themeColors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />




          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={themeColors.textOnPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: themeColors.textOnPrimary }]}>Começar a usar</Text>
            )}
          </TouchableOpacity>
        </View>


        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={hideAlert}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  button: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDark,
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});


