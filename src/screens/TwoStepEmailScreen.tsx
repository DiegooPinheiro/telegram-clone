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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { validateEmail } from '../utils/validators';
import { chatSendTwoStepCode } from '../services/chatApi';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepEmail'>;

export default function TwoStepEmailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { password } = route.params;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>💌</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Email de Recuperacao</Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Voce pode definir um email de recuperacao para redefinir a sua senha e restaurar acesso a sua conta.
          </Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputBox, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
              <Text style={[styles.inputLabel, { color: colors.primary, backgroundColor: colors.background }]}>
                Email
              </Text>
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
              />
            </View>

            <TouchableOpacity
              style={[
                styles.inlineButton,
                { backgroundColor: colors.primary, opacity: email.length > 3 && !loading ? 1 : 0.55 },
              ]}
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={email.length <= 3 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
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
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
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
});
