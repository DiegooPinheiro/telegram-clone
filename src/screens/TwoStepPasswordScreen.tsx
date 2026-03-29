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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { updateTwoStepAuth } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepPassword'>;

export default function TwoStepPasswordScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleNext = async () => {
    if (password.length < 4 || loading) return;

    if (route.params?.mode === 'change') {
      setLoading(true);
      try {
        await updateTwoStepAuth({ password, enabled: true });
        navigation.replace('TwoStepSuccess', {
          title: 'Senha Alterada!',
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
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>🙈</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Criar uma Senha</Text>

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
                editable={!loading}
                returnKeyType="go"
                blurOnSubmit={false}
                onSubmitEditing={handleNext}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.inlineButton,
                { backgroundColor: colors.primary, opacity: password.length >= 4 && !loading ? 1 : 0.55 },
              ]}
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={password.length < 4 || loading}
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
