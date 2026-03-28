import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import Avatar from './Avatar';

interface EmptyChatStateProps {
  type: 'private' | 'group' | 'saved';
  name: string;
  avatar?: string | null;
  onSendWave?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ type, name, avatar, onSendWave }) => {
  const { colors, isDark } = useTheme();

  const getContent = () => {
    switch (type) {
      case 'saved':
        return {
          icon: 'bookmark',
          title: 'Mensagens Salvas',
          subtitle: 'Salve rascunhos, links e mídias aqui para acessá-los em qualquer dispositivo.',
          sticker: null,
          showWave: false,
        };
      case 'group':
        return {
          icon: avatar ? null : 'people',
          title: name || 'Novo Grupo',
          subtitle: 'Este é o início da sua conversa em grupo. Envie uma mensagem para começar!',
          sticker: null,
          showWave: false,
        };
      default:
        return {
          icon: null,
          title: 'Ainda não há mensagens...',
          subtitle: `Envie uma mensagem para ${name} ou toque no aceno abaixo.`,
          sticker: '👋🐻',
          showWave: true,
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
        {content.sticker && <Text style={styles.sticker}>{content.sticker}</Text>}
        { (type === 'group' || avatar) && type !== 'saved' ? (
          <View style={styles.icon}>
            <Avatar uri={avatar} name={name} size={80} />
          </View>
        ) : (
          content.icon && <Ionicons name={content.icon as any} size={64} color={colors.chatPrimary} style={styles.icon} />
        )}
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>{content.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{content.subtitle}</Text>

        {content.showWave && (
          <TouchableOpacity 
            style={[styles.waveBtn, { backgroundColor: colors.chatPrimary + '20' }]} 
            activeOpacity={0.7} 
            onPress={onSendWave}
          >
            <Text style={styles.waveEmoji}>👋</Text>
            <Text style={[styles.waveText, { color: colors.chatPrimary }]}>Dê um aceno</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  sticker: {
    fontSize: 64,
    marginBottom: 16,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  waveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  waveEmoji: {
    fontSize: 20,
  },
  waveText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
