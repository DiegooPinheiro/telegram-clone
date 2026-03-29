import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepPassword'>;

export default function TwoStepPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleNext = () => {
    if (password.length < 4) {
      // Pequena validação para garantir segurança mínima
      return;
    }
    navigation.navigate('TwoStepEmail', { password });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Text style={styles.emoji}>🙈</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Criar uma Senha
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
              onSubmitEditing={handleNext}
            />
          </View>
        </View>

        {password.length >= 4 && (
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
