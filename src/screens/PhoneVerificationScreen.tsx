import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { auth } from '../config/firebaseConfig';
import { getEnv } from '../config/env';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { 
  completePhoneVerificationLogin,
  getUserByPhone,
  normalizePhoneNumber 
} from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneVerification'>;

export default function PhoneVerificationScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ 
      visible: true, 
      title, 
      message, 
      onConfirm: onConfirm || hideAlert 
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const firebaseConfig = {
    apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };

  // Firebase recaptcha verifier
  const recaptchaVerifier = useRef<any>(null);

  const handleSendCode = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      showAlert('Erro', 'Informe um número de telefone válido com DDD (ex: +5511...)');
      return;
    }

    setLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      // Em Expo Managed Workflow, o Firebase usa um modal interno ou reCAPTCHA invisível se configurado
      // Para simular/usar no Expo Go, você precisa configurar o App Check ou usar um número de teste no Firebase Console
      const vid = await phoneProvider.verifyPhoneNumber(
        phoneNumber.startsWith('+') ? phoneNumber : `+55${phoneNumber}`,
        recaptchaVerifier.current
      );
      setVerificationId(vid);
      setStep('code');
      showAlert('Código Enviado', 'O código de verificação foi enviado para seu celular.');
    } catch (error: any) {
      console.error('Erro ao enviar SMS:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar o código SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      showAlert('Erro', 'Digite o código de 6 dígitos');
      return;
    }

    if (!verificationId) return;

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      
      // 1. Logar no Firebase com a credencial de telefone
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      if (!user) throw new Error('Falha ao autenticar via SMS.');

      // 2. Identificar o usuário (Prioridade: UID -> Fallback: Telefone)
      const { uid } = user;
      console.log('[PhoneVerify] Checking identity for UID:', uid);
      
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const { resolveUserProfileForFirebaseUid } = await import('../services/authService');
      let userData = await getUserByPhone(normalizedPhone);
      
      if (!userData) {
        console.log('[PhoneVerify] No profile found by phone. Trying current Firebase UID...');
        userData = await resolveUserProfileForFirebaseUid(uid);
      }

      if (userData) {
        console.log('[PhoneVerify] Identity confirmed:', userData.displayName || 'User');
        const resolvedUid = userData.uid || uid;
        if (!resolvedUid) throw new Error('Conta encontrada sem UID valido.');
        
        // USUÁRIO EXISTENTE: Verifica se tem 2FA ativado
        if (userData.twoStepEnabled) {
          console.log('[PhoneVerify] 2FA is ENABLED. Redirecting to password challenge...');
          navigation.navigate('TwoStepVerifyPassword', {
            mode: 'login',
            phoneNumber: normalizedPhone,
            targetUid: resolvedUid,
          });
        } else {
          console.log('[PhoneVerify] 2FA is disabled. Finalizing login...');
          await completePhoneVerificationLogin(resolvedUid, normalizedPhone);
          // O AuthContext vai detectar a mudança e navegar para MainTabs
        }
      } else {
        console.log('[PhoneVerify] Complete NEW ACCOUNT. Redirecting to Register...');
        navigation.navigate('Register', { phone: normalizedPhone });
      }
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      showAlert('Erro', 'Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Ionicons 
              name={step === 'phone' ? "phone-portrait-outline" : "chatbubble-ellipses-outline"} 
              size={64} 
              color={colors.primary} 
            />
            <Text style={styles.title}>
              {step === 'phone' ? 'Verificar Telefone' : 'Digite o Código'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone' 
                ? 'Para sua segurança, precisamos confirmar seu número de celular.' 
                : `Enviamos um código SMS para ${phoneNumber}`}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'phone' ? (
              <TextInput
                style={styles.input}
                placeholder="+55 11 99999-9999"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 'phone' ? 'Enviar Código' : 'Verificar'}
                </Text>
              )}
            </TouchableOpacity>

            {step === 'code' && (
              <TouchableOpacity onPress={() => setStep('phone')} style={styles.resendButton}>
                <Text style={styles.resendText}>Alterar número de telefone</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
        />

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  input: {
    height: 56,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
});
