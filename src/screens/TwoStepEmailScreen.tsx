import React, { useState } from 'react';
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
import { validateEmail } from '../utils/validators';
import { chatSendTwoStepCode } from '../services/chatApi';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepEmail'>;

export default function TwoStepEmailScreen({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const { password } = route.params;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isChangeMode = route.params?.mode === 'change';
  const buttonDisabled = email.length <= 3 || loading;
  const noteCardBackground = isDark ? '#163247' : colors.primaryLight;
  const noteTextColor = isDark ? '#EAF6FF' : colors.primaryDark;
  const helperTextColor = isDark ? '#B6C0C8' : colors.textSecondary;

  const handleNext = async () => {
    if (loading) return;

    if (!validateEmail(email)) {
      Alert.alert('E-mail invalido', 'Por favor, insira um endereco de e-mail valido.');
      return;
    }

    setLoading(true);
    try {
      const response = await chatSendTwoStepCode(email);

      if (response && response.success) {
        navigation.navigate('TwoStepVerify', {
          password,
          email,
          code: response.code,
          mode: route.params?.mode,
        });
      }
    } catch (error: any) {
      Alert.alert('Erro no envio', error.message || 'Nao foi possivel enviar o e-mail de verificacao.');
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
              <Ionicons name="mail-open-outline" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isChangeMode ? 'Atualizar email de recuperacao' : 'Email de recuperacao'}
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Informe o email que sera usado para recuperar sua conta caso voce esqueca a senha.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Email</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputBox, { backgroundColor: colors.backgroundSecondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
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
              Voce recebera um codigo de confirmacao nesse email para concluir a configuracao.
            </Text>
          </View>

          <View style={[styles.noteCard, { backgroundColor: noteCardBackground, borderColor: isDark ? '#24506f' : colors.separator }]}>
            <Ionicons name="shield-outline" size={20} color={noteTextColor} />
            <Text style={[styles.noteText, { color: noteTextColor }]}>
              Mantenha um email que voce realmente usa, assim a recuperacao fica simples se voce esquecer a senha.
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
