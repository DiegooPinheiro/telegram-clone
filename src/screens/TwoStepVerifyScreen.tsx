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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { updateTwoStepAuth } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepVerify'>;

const EMPTY_PIN = ['', '', '', '', '', ''];

export default function TwoStepVerifyScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const { refreshProfile } = useAuthContext();
  const { password, email, code: expectedCode } = route.params;
  const [pin, setPin] = useState<string[]>(EMPTY_PIN);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const filledInputBackground = isDark ? '#D8EEFF' : colors.primaryLight;
  const filledInputTextColor = isDark ? colors.primaryDark : colors.primaryDark;

  const handleInputChange = (text: string, index: number) => {
    if (loading) return;

    const digit = text.replace(/\D/g, '').slice(-1);

    setPin((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace' || loading) return;

    if (pin[index]) {
      setPin((current) => {
        const next = [...current];
        next[index] = '';
        return next;
      });
      return;
    }

    if (index > 0) {
      inputs.current[index - 1]?.focus();
      setPin((current) => {
        const next = [...current];
        next[index - 1] = '';
        return next;
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => inputs.current[0]?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentPin = pin.join('');
    if (currentPin.length === 6 && !loading) {
      verifyPin(currentPin);
    }
  }, [loading, pin]);

  const verifyPin = async (enteredPin: string) => {
    if (enteredPin !== expectedCode) {
      Alert.alert('Erro', 'Codigo de verificacao incorreto.');
      setPin([...EMPTY_PIN]);
      inputs.current[0]?.focus();
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        email,
        enabled: true,
      };

      if (password) {
        updateData.password = password;
      }

      await updateTwoStepAuth(updateData);
      await refreshProfile();

      if (route.params?.mode === 'change') {
        navigation.replace('TwoStepSuccess', {
          title: 'Email alterado',
          description: 'Seu email de recuperacao foi atualizado com sucesso.',
        });
      } else {
        navigation.replace('TwoStepSuccess');
      }
    } catch (error: any) {
      Alert.alert('Erro ao ativar 2FA', error.message || 'Tente novamente mais tarde.');
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
              <Ionicons name="keypad-outline" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>Confirmar email</Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Digite o codigo de 6 digitos enviado para {email}. Se nao chegar, verifique tambem a pasta de spam.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Codigo de verificacao</Text>

            <View style={styles.codeContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    {
                      color: digit ? filledInputTextColor : colors.textPrimary,
                      backgroundColor: digit ? filledInputBackground : colors.backgroundSecondary,
                      borderColor: digit ? colors.primary : colors.separator,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e.nativeEvent.key, index)}
                  textAlign="center"
                  editable={!loading}
                  selectionColor={colors.primary}
                />
              ))}
            </View>

            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              O codigo sera validado automaticamente assim que os 6 digitos forem preenchidos.
            </Text>

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Validando codigo...</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.separator }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Simulacao', `O codigo e ${expectedCode}`)}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Reenviar codigo</Text>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
    borderWidth: 1.5,
    fontSize: 26,
    fontWeight: '700',
  },
  helperText: {
    marginTop: spacing.md,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 18,
  },
  secondaryButton: {
    marginTop: spacing.lg,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
