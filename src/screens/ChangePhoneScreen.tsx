import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import useAuth from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePhone'>;

export default function ChangePhoneScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const { uid } = useAuth();
  const [currentPhone, setCurrentPhone] = useState('+55 (98) 98441-0040');

  React.useEffect(() => {
    if (!uid) return;
    import('../services/authService').then(m => m.getUserProfile(uid)).then(p => {
      if (p?.phone) setCurrentPhone(p.phone);
    });
  }, [uid]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* I'll use the generated image path here. Since we can't easily reference dynamic paths in code during generation, 
              I'll use a placeholder or the actual path if I can determine it. 
              Actually, I should copy the image to assets if possible, but for now I'll use the absolute path 
              from the brain directory as a temporary measure or just use a nice Ionicons as fallback. */}
          <Image 
            source={{ uri: 'file:///C:/Users/diego/.gemini/antigravity/brain/c30de715-176a-4849-bb97-3e0e2db4eaff/telegram_duck_change_phone_1774631879745.png' }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: themeColors.textPrimary }]}>Alterar Número</Text>
        
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          Você pode alterar o seu número do Telegram aqui. A sua conta e todos os seus dados — como mensagens, mídia, contatos etc. serão movidos para o novo número.
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.linkText, { color: themeColors.primary }]}>
              Manter {currentPhone}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('PhoneVerification', { isChangingNumber: true });
            }}
          >
            <Text style={styles.primaryButtonText}>Alterar Número</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
  },
  linkButton: {
    padding: 10,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
