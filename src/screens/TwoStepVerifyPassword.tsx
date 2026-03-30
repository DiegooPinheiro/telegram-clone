import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import useAuth from '../hooks/useAuth';
import { UserProfile } from '../types/user';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepVerifyPassword'>;

export default function TwoStepVerifyPasswordScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const { userProfile, user, phoneVerified, refreshSession } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingForApp, setWaitingForApp] = useState(false);
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const inputRef = useRef<TextInput>(null);

  const currentMode = useMemo<'login' | 'settings' | 'change'>(() => {
    if (route.params?.mode) {
      return route.params.mode;
    }

    return (route as any).name === 'TwoStepVerifyPasswordSettings' ? 'settings' : 'login';
  }, [route]);

  const isLoginMode = currentMode === 'login';
  const buttonDisabled = !password || loading || waitingForApp;
  const noteCardBackground = isDark ? '#163247' : colors.primaryLight;
  const noteTextColor = isDark ? '#EAF6FF' : colors.primaryDark;
  const helperTextColor = isDark ? '#B6C0C8' : colors.textSecondary;

  useEffect(() => {
    if (phoneVerified && isLoginMode) {
      setWaitingForApp(true);
      const routeNames = navigation.getState().routeNames || [];
      if (routeNames.includes('MainTabs')) {
        navigation.replace('MainTabs');
      }
    }
  }, [isLoginMode, navigation, phoneVerified]);

  useEffect(() => {
    let active = true;

    const loadProfileForValidation = async () => {
      try {
        const { getCurrentUserProfile, getUserProfile } = await import('../services/authService');

        let profile: UserProfile | null = null;

        if (isLoginMode && route.params?.targetUid) {
          profile = (await getUserProfile(route.params.targetUid)) as UserProfile | null;
        } else if (isLoginMode) {
          profile = userProfile;
        } else {
          profile = (await getCurrentUserProfile(userProfile?.uid || undefined)) as UserProfile | null;
        }

        if (!profile && userProfile) {
          profile = userProfile;
        }

        if (active) {
          setTargetProfile(profile);
        }
      } catch (error) {
        console.error('[TwoStepVerifyPassword] Erro ao carregar perfil para validacao:', error);
        if (active) {
          setTargetProfile(userProfile);
        }
      }
    };

    loadProfileForValidation();

    return () => {
      active = false;
    };
  }, [isLoginMode, route.params?.targetUid, userProfile]);

  const handleNext = async () => {
    if (buttonDisabled) return;

    const profileForValidation = targetProfile || userProfile;

    if (!profileForValidation?.twoStepPassword) {
      Alert.alert('Aguarde', 'Ainda estamos carregando os dados de seguranca da sua conta.');
      return;
    }

    if (password !== profileForValidation.twoStepPassword) {
      Alert.alert('Senha incorreta', 'A senha inserida nao corresponde a sua senha de Verificacao em Duas Etapas.');
      setPassword('');
      inputRef.current?.focus();
      return;
    }

    if (isLoginMode) {
      const phoneNumberForLogin = route.params?.phoneNumber || profileForValidation.phone;

      if (!phoneNumberForLogin) {
        Alert.alert('Erro no login', 'Nao foi possivel identificar o telefone desta conta para concluir o login.');
        return;
      }

      setLoading(true);
      try {
        const { completePhoneVerificationLogin } = await import('../services/authService');
        const uidToVerify = route.params?.targetUid || targetProfile?.uid || userProfile?.uid || user?.uid;

        if (!uidToVerify) {
          throw new Error('Conta de destino nao identificada para concluir o login.');
        }

        await completePhoneVerificationLogin(uidToVerify, phoneNumberForLogin);
        await refreshSession();
        setWaitingForApp(true);
      } catch (error: any) {
        Alert.alert('Erro no login', error.message || 'Falha ao autenticar.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const routeNames = navigation.getState().routeNames || [];
      if (routeNames.includes('TwoStepSettings')) {
        navigation.replace('TwoStepSettings');
      } else {
        navigation.navigate('TwoStepSettings');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={[styles.headerBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark-outline" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isLoginMode ? 'Digite sua senha' : 'Confirmar senha'}
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isLoginMode
                ? 'Sua conta esta protegida por uma senha extra. Digite-a para concluir este login.'
                : 'Digite a senha configurada para abrir as opcoes da Verificacao em Duas Etapas.'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Senha</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputBox, { backgroundColor: colors.backgroundSecondary }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Digite sua senha"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !waitingForApp}
                  returnKeyType="go"
                  blurOnSubmit={false}
                  onSubmitEditing={handleNext}
                  selectionColor={colors.primary}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.inlineButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: buttonDisabled ? 0.55 : 1,
                  },
                ]}
                activeOpacity={0.85}
                disabled={buttonDisabled}
                onPress={handleNext}
              >
                {loading || waitingForApp ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: helperTextColor }]}>
              Essa senha foi criada por voce para proteger a conta em novos logins.
            </Text>
          </View>

          <View style={[styles.noteCard, { backgroundColor: noteCardBackground, borderColor: isDark ? '#24506f' : colors.separator }]}>
            <Ionicons name="information-circle-outline" size={20} color={noteTextColor} />
            <Text style={[styles.noteText, { color: noteTextColor }]}>
              Se esquecer a senha, a recuperacao sera enviada para o email configurado nessa conta.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert('Recuperacao', 'O codigo de recuperacao sera enviado para o seu e-mail configurado.')
            }
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    letterSpacing: 0.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  inputBox: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  input: {
    fontSize: 18,
    padding: 0,
  },
  inlineButton: {
    width: 62,
    minHeight: 62,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    marginTop: spacing.lg,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
