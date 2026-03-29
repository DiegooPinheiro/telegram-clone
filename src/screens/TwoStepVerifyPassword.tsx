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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import useAuth from '../hooks/useAuth';
import { UserProfile } from '../types/user';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepVerifyPassword'>;

export default function TwoStepVerifyPasswordScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
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

  useEffect(() => {
    if (phoneVerified && currentMode === 'login') {
      setWaitingForApp(true);
      const routeNames = navigation.getState().routeNames || [];
      if (routeNames.includes('MainTabs')) {
        navigation.replace('MainTabs');
      }
    }
  }, [currentMode, navigation, phoneVerified]);

  useEffect(() => {
    let active = true;

    const loadProfileForValidation = async () => {
      try {
        const { getCurrentUserProfile, getUserProfile } = await import('../services/authService');

        let profile: UserProfile | null = null;

        if (currentMode === 'login' && route.params?.targetUid) {
          profile = (await getUserProfile(route.params.targetUid)) as UserProfile | null;
        } else if (currentMode === 'login') {
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
  }, [currentMode, route.params?.targetUid, userProfile]);

  const handleNext = async () => {
    if (!password || loading || waitingForApp) return;

    const profileForValidation = targetProfile || userProfile;

    if (!profileForValidation?.twoStepPassword) {
      Alert.alert('Aguarde', 'Ainda estamos carregando os dados de seguranca da sua conta.');
      return;
    }

    if (password !== profileForValidation.twoStepPassword) {
      Alert.alert('Senha Incorreta', 'A senha inserida nao corresponde a sua senha de Verificacao em Duas Etapas.');
      setPassword('');
      inputRef.current?.focus();
      return;
    }

    if (currentMode === 'login') {
      const phoneNumberForLogin = route.params?.phoneNumber || profileForValidation.phone;

      if (!phoneNumberForLogin) {
        Alert.alert('Erro no Login', 'Nao foi possivel identificar o telefone desta conta para concluir o login.');
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
        Alert.alert('Erro no Login', error.message || 'Falha ao autenticar.');
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

  const buttonDisabled = !password || loading || waitingForApp;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>🔐</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Sua senha</Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            A Verificacao em Duas Etapas esta ativada. A sua conta esta protegida com uma senha adicional.
          </Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputBox, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
              <Text style={[styles.inputLabel, { color: colors.primary, backgroundColor: colors.background }]}>
                Insira a senha
              </Text>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.textPrimary }]}
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
              activeOpacity={0.8}
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

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() =>
              Alert.alert('Recuperacao', 'O codigo de recuperacao sera enviado para o seu e-mail configurado.')
            }
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  imageContainer: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  inputBox: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  inputLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontSize: 12,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    fontSize: 18,
    padding: 0,
  },
  inlineButton: {
    width: 56,
    minHeight: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotBtn: {
    marginTop: 30,
    alignSelf: 'flex-start',
  },
  forgotText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
