import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

  useEffect(() => {
    if (phoneVerified) {
      setWaitingForApp(true);
      const routeNames = navigation.getState().routeNames || [];
      if (route.params?.mode === 'login' && routeNames.includes('MainTabs')) {
        navigation.replace('MainTabs');
      }
    }
  }, [navigation, phoneVerified, route.params?.mode]);

  useEffect(() => {
    let active = true;

    const loadProfileForValidation = async () => {
      if (route.params?.mode !== 'login') {
        setTargetProfile(userProfile);
        return;
      }

      if (!route.params?.targetUid) {
        setTargetProfile(userProfile);
        return;
      }

      try {
        const { getUserProfile } = await import('../services/authService');
        const profile = await getUserProfile(route.params.targetUid);
        if (active) {
          setTargetProfile((profile as UserProfile | null) || null);
        }
      } catch (error) {
        console.error('[TwoStepVerifyPassword] Failed to load target profile:', error);
        if (active) {
          setTargetProfile(null);
        }
      }
    };

    loadProfileForValidation();

    return () => {
      active = false;
    };
  }, [route.params?.mode, route.params?.targetUid, userProfile]);

  const handleNext = async () => {
    const profileForValidation =
      route.params?.mode === 'login' ? targetProfile : userProfile;

    if (!profileForValidation && route.params?.mode !== 'settings') {
      Alert.alert('Aguarde', 'Carregando perfil de seguranca...');
      return;
    }

    if (password === profileForValidation?.twoStepPassword) {
      const phoneNumberForLogin = route.params?.phoneNumber || profileForValidation?.phone;

      if (route.params?.mode === 'login' && phoneNumberForLogin) {
        setLoading(true);
        try {
          const { completePhoneVerificationLogin } = await import('../services/authService');
          const uidToVerify = route.params.targetUid || user?.uid;

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
      } else {
        navigation.navigate('TwoStepSettings');
      }
    } else {
      Alert.alert('Senha Incorreta', 'A senha inserida nao corresponde a sua senha de Verificacao em Duas Etapas.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

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

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Sua senha
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            A Verificacao em Duas Etapas esta ativada. A sua conta esta protegida com uma senha adicional.
          </Text>

          <View style={[styles.inputBox, { borderColor: colors.primary }]}>
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
              editable={!loading}
              onSubmitEditing={handleNext}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => Alert.alert('Recuperacao', 'O codigo de recuperacao sera enviado para o seu e-mail configurado.')}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        {password.length > 0 && (
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { backgroundColor: colors.primary, opacity: loading || waitingForApp ? 0.7 : 1 },
            ]}
            activeOpacity={0.8}
            disabled={loading || waitingForApp}
            onPress={handleNext}
          >
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 40,
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
    marginBottom: 40,
  },
  inputBox: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderRadius: 8,
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
  forgotBtn: {
    marginTop: 30,
    alignSelf: 'flex-start',
  },
  forgotText: {
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
