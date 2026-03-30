import React, { useRef, useState } from 'react';
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
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepPassword'>;

export default function TwoStepPasswordScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isChangeMode = route.params?.mode === 'change';
  const buttonDisabled = password.length < 4 || loading;
  const noteCardBackground = isDark ? '#163247' : colors.primaryLight;
  const noteTextColor = isDark ? '#EAF6FF' : colors.primaryDark;
  const helperTextColor = isDark ? '#B6C0C8' : colors.textSecondary;

  const handleNext = async () => {
    if (buttonDisabled) return;

    if (isChangeMode) {
      setLoading(true);
      try {
        await updateTwoStepAuth({ password, enabled: true });
        navigation.replace('TwoStepSuccess', {
          title: 'Senha alterada',
          description: 'Sua senha de Verificacao em Duas Etapas foi atualizada com sucesso.',
        });
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Falha ao atualizar senha.');
      } finally {
        setLoading(false);
      }
      return;
    }

    navigation.navigate('TwoStepEmail', { password });
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
              <Ionicons name="lock-closed-outline" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isChangeMode ? 'Nova senha de seguranca' : 'Criar uma senha'}
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isChangeMode
                ? 'Atualize a senha que sera pedida nos novos logins da sua conta.'
                : 'Defina a senha extra que sera pedida depois do codigo SMS em novos dispositivos.'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Senha de verificacao</Text>

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
                  editable={!loading}
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
                onPress={handleNext}
                disabled={buttonDisabled}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperText, { color: helperTextColor }]}>
              Use pelo menos 4 caracteres. Escolha algo facil de lembrar e dificil para outras pessoas adivinharem.
            </Text>
          </View>

          <View style={[styles.noteCard, { backgroundColor: noteCardBackground, borderColor: isDark ? '#24506f' : colors.separator }]}>
            <Ionicons name="information-circle-outline" size={20} color={noteTextColor} />
            <Text style={[styles.noteText, { color: noteTextColor }]}>
              Essa senha sera usada quando o login for feito em um novo aparelho.
            </Text>
          </View>
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
});
