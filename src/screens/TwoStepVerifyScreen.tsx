import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { updateTwoStepAuth } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepVerify'>;

export default function TwoStepVerifyScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { password, email, code: expectedCode } = route.params;
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleInputChange = (text: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    // Auto-focus next input
    if (text.length > 0 && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const currentPin = pin.join('');
    if (currentPin.length === 6) {
      verifyPin(currentPin);
    }
  }, [pin]);

  const verifyPin = async (enteredPin: string) => {
    if (enteredPin !== expectedCode) {
      Alert.alert('Erro', 'Código de verificação incorreto.');
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }

    setLoading(true);
    try {
      await updateTwoStepAuth({
        password,
        email,
        enabled: true
      });
      navigation.navigate('TwoStepSuccess');
    } catch (error: any) {
      Alert.alert('Erro ao ativar 2FA', error.message || 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>📬</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Código de Verificação
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Para completar a Configuração da Verificação em Duas Etapas, verifique o seu email (verifique também a pasta de spam) e digite o código que te enviamos.
          </Text>

          <View style={styles.pinContainer}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref as TextInput;
                }}
                style={[
                  styles.pinBox, 
                  { 
                    color: colors.textPrimary, 
                    borderColor: pin[index] ? colors.primary : colors.separator,
                    backgroundColor: colors.surface
                  }
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleInputChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

          <TouchableOpacity style={styles.resendBtn} onPress={() => Alert.alert('Simulação', `O código é ${expectedCode}`)}>
            <Text style={[styles.resendText, { color: colors.primary }]}>Reenviar Código</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Obs: Import ScrollView was missing
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 30,
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
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  pinBox: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  resendBtn: {
    marginTop: 40,
    padding: 10,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
