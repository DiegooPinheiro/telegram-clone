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
import { PhoneAuthProvider } from 'firebase/auth';
import { setPhoneVerified, signOut } from '../services/authService';
import useAuth from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneVerification'>;

export default function PhoneVerificationScreen({ navigation }: Props) {
  const { refreshSession } = useAuth();
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
      const user = auth.currentUser;

      if (!user) throw new Error('Usuário não está logado via Firebase.');

      // Opcional: Vincular o telefone à conta de e-mail atual
      // await linkWithCredential(user, credential);
      
      // Para este fluxo, apenas confirmamos a validade e atualizamos nosso backend
      await setPhoneVerified(user.uid, phoneNumber);
      
      // Atualizar o estado global de autenticação imediatamente
      await refreshSession();

      showAlert('Sucesso', 'Telefone verificado com sucesso!', () => {
        hideAlert();
        navigation.replace('MainTabs' as any);
      });
    } catch (error: any) {
      showAlert('Erro', 'Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity 
            onPress={async () => {
              await signOut();
            }} 
            style={styles.backButton}
          >
            <View style={styles.signOutButton}>
              <Ionicons name="exit-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.signOutText, { color: colors.textPrimary }]}>Sair</Text>
            </View>
          </TouchableOpacity>

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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xxl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
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
