import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import useAuth from '../hooks/useAuth';
import { updateUserProfile, getUserProfileByUsername } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangeUsername'>;

export default function ChangeUsernameScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const { uid } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<'none' | 'available' | 'taken' | 'invalid'>('none');
  
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!uid) return;
    import('../services/authService').then(m => m.getUserProfile(uid)).then(p => {
      if (p?.username) {
        setUsername(p.username);
      }
    });
  }, [uid]);

  const checkUsername = async (val: string) => {
    const clean = val.trim().replace(/^@+/, '');
    
    if (clean.length === 0) {
      setAvailability('none');
      return;
    }

    if (clean.length < 5) {
      setAvailability('invalid');
      return;
    }

    setChecking(true);
    try {
      const existing = await getUserProfileByUsername(clean);
      // If found and it's not the current user, it's taken
      if (existing && (existing as any).uid !== uid) {
        setAvailability('taken');
      } else {
        setAvailability('available');
      }
    } catch (e) {
      console.error('[ChangeUsernameScreen] Erro ao verificar disponibilidade do username:', e);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);

    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    
    if (clean.length >= 5) {
      checkTimeout.current = setTimeout(() => {
        checkUsername(clean);
      }, 600);
    } else {
      setAvailability(clean.length > 0 ? 'invalid' : 'none');
    }
  };

  const handleSave = async () => {
    if (availability === 'taken') {
      Alert.alert('Erro', 'Este nome de usuário já está sendo usado.');
      return;
    }

    if (username.length > 0 && username.length < 5) {
      Alert.alert('Erro', 'O nome de usuário deve ter pelo menos 5 caracteres.');
      return;
    }

    if (!uid) return;

    setLoading(true);
    try {
      await updateUserProfile(uid, { username: username.trim() });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar username');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={loading || checking || availability === 'taken' || (username.length > 0 && username.length < 5)} 
          style={{ marginRight: 5, opacity: (availability === 'taken' || (username.length > 0 && username.length < 5)) ? 0.4 : 1 }}
        >
          <Ionicons name="checkmark" size={28} color={themeColors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, themeColors, loading, checking, username, availability]);

  const getStatusColor = () => {
    if (availability === 'available') return '#4CAF50';
    if (availability === 'taken' || availability === 'invalid') return '#F44336';
    return themeColors.primary;
  };

  const getStatusText = () => {
    if (checking) return 'Verificando disponibilidade...';
    if (availability === 'available') return `${username} está disponível.`;
    if (availability === 'taken') return `${username} já existe.`;
    if (availability === 'invalid' && username.length > 0) return 'O nome de usuário deve ter pelo menos 5 caracteres.';
    return '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Definir nome de usuário</Text>
          <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderColor: getStatusColor(), borderWidth: availability !== 'none' ? 1 : 0 }]}>
            <Text style={[styles.prefix, { color: themeColors.textPrimary }]}>@</Text>
            <TextInput
              style={[styles.input, { color: themeColors.textPrimary }]}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="seuusername"
              placeholderTextColor={themeColors.textSecondary}
              maxLength={32}
            />
            {checking && <ActivityIndicator size="small" color={themeColors.primary} style={{ marginRight: 10 }} />}
          </View>
          
          {getStatusText() !== '' && (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
            Você pode escolher um nome de usuário no <Text style={{ fontWeight: 'bold' }}>Telegram</Text>. Se escolher, as pessoas poderão te encontrar pelo nome de usuário e entrar em contato sem precisar do seu número de telefone.
          </Text>
          <Text style={[styles.infoText, { color: themeColors.textSecondary, marginTop: 15 }]}>
            Você pode usar <Text style={{ color: themeColors.textPrimary }}>a-z, 0-9</Text> e underlines.{"\n"}
            O tamanho mínimo é de <Text style={{ color: themeColors.textPrimary }}>5 caracteres</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 2,
    height: '100%',
  },
  statusText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  infoContainer: {
    paddingHorizontal: 22,
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
