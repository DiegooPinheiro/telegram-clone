import React, { useMemo, useRef, useState } from 'react';
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
  normalizePhoneNumber,
} from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneVerification'>;

const EMPTY_CODE = ['', '', '', '', '', ''];

export default function PhoneVerificationScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationDigits, setVerificationDigits] = useState<string[]>(EMPTY_CODE);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  const recaptchaVerifier = useRef<any>(null);

  const verificationCode = useMemo(() => verificationDigits.join(''), [verificationDigits]);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      onConfirm: onConfirm || hideAlert,
    });
  };

  const hideAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const firebaseConfig = {
    apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);

    setVerificationDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < codeInputRefs.current.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;

    if (verificationDigits[index]) {
      setVerificationDigits((current) => {
        const next = [...current];
        next[index] = '';
        return next;
      });
      return;
    }

    if (index > 0) {
      codeInputRefs.current[index - 1]?.focus();
      setVerificationDigits((current) => {
        const next = [...current];
        next[index - 1] = '';
        return next;
      });
    }
  };

  const handleBackToPhone = () => {
    setVerificationDigits([...EMPTY_CODE]);
    setVerificationId(null);
    setStep('phone');
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      showAlert('Erro', 'Informe um numero de telefone valido com DDD (ex: 11999999999).');
      return;
    }

    setLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const vid = await phoneProvider.verifyPhoneNumber(
        phoneNumber.startsWith('+') ? phoneNumber : `+55${phoneNumber}`,
        recaptchaVerifier.current
      );

      setVerificationId(vid);
      setVerificationDigits([...EMPTY_CODE]);
      setStep('code');
      showAlert('Codigo Enviado', 'O codigo de verificacao foi enviado para seu celular.', () => {
        hideAlert();
        setTimeout(() => codeInputRefs.current[0]?.focus(), 50);
      });
    } catch (error: any) {
      console.error('[PhoneVerificationScreen] Erro ao enviar SMS:', error);
      Alert.alert('Erro', error.message || 'Nao foi possivel enviar o codigo SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length < 6) {
      showAlert('Erro', 'Digite o codigo completo de 6 digitos.');
      return;
    }

    if (!verificationId) return;

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      if (!user) throw new Error('Falha ao autenticar via SMS.');

      const { uid } = user;
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const { resolveUserProfileForFirebaseUid } = await import('../services/authService');

      let userData = await getUserByPhone(normalizedPhone);
      if (!userData) {
        userData = await resolveUserProfileForFirebaseUid(uid);
      }

      if (userData) {
        const resolvedUid = userData.uid || uid;
        if (!resolvedUid) throw new Error('Conta encontrada sem UID valido.');

        if (userData.twoStepEnabled) {
          navigation.navigate('TwoStepVerifyPassword', {
            mode: 'login',
            phoneNumber: normalizedPhone,
            targetUid: resolvedUid,
          });
        } else {
          await completePhoneVerificationLogin(resolvedUid, normalizedPhone);
        }
      } else {
        navigation.navigate('Register', { phone: normalizedPhone });
      }
    } catch (error: any) {
      console.error('[PhoneVerificationScreen] Erro na verificacao:', error);
      showAlert('Erro', 'Codigo invalido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Ionicons
                name={step === 'phone' ? 'call-outline' : 'chatbubble-ellipses-outline'}
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.title}>
              {step === 'phone' ? 'Entrar com telefone' : 'Confirmar codigo'}
            </Text>

            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Digite seu numero para receber o codigo de verificacao no celular.'
                : `Enviamos um codigo de 6 digitos para ${phoneNumber}.`}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'phone' ? (
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Numero do telefone</Text>

                <View style={styles.phoneInputShell}>
                  <View style={styles.phoneIconBox}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
                  </View>

                  <TextInput
                    style={styles.phoneInput}
                    placeholder="11 99999-9999"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    selectionColor={colors.primary}
                  />
                </View>

                <Text style={styles.helperText}>
                  Use DDD. Se quiser, pode digitar com ou sem +55.
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Codigo de verificacao</Text>

                <View style={styles.codeContainer}>
                  {verificationDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        codeInputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.codeInput,
                        digit ? styles.codeInputFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleCodeKeyPress(e.nativeEvent.key, index)}
                      textAlign="center"
                      selectionColor={colors.primary}
                    />
                  ))}
                </View>

                <Text style={styles.helperText}>
                  Digite o codigo exatamente como chegou por SMS.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 'phone' ? 'Enviar codigo' : 'Verificar codigo'}
                </Text>
              )}
            </TouchableOpacity>

            {step === 'code' && (
              <TouchableOpacity onPress={handleBackToPhone} style={styles.resendButton}>
                <Text style={styles.resendText}>Alterar numero de telefone</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    letterSpacing: 0.6,
  },
  phoneInputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: spacing.sm,
    minHeight: 62,
  },
  phoneIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: 0.4,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    minWidth: 44,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.separator,
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  helperText: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 58,
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  resendText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
