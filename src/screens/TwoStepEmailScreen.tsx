import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { validateEmail } from '../utils/validators';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepEmail'>;

export default function TwoStepEmailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { password } = route.params;
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (!validateEmail(email)) {
      Alert.alert('E-mail inválido', 'Por favor, insira um endereço de e-mail válido.');
      return;
    }

    // Simulando o envio de um código para o e-mail
    const code = '123456';
    console.log(`[2FA Sync] Código fixo para teste (${email}): ${code}`);
    
    navigation.navigate('TwoStepVerify', { password, email, code });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>💌</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Email de Recuperação
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Você pode definir um email de recuperação para redefinir a sua senha e restaurar acesso à sua conta.
          </Text>

          <View style={[styles.inputBox, { borderColor: colors.primary }]}>
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
              autoFocus
              onSubmitEditing={handleNext}
            />
          </View>
        </View>

        {email.length > 3 && (
          <TouchableOpacity 
            style={[styles.floatingButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
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
    marginBottom: 12,
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
