import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  placeholder?: string;
}

export default function MessageInput({ onSend, onTyping, onStopTyping, placeholder = 'Mensagem' }: MessageInputProps) {
  const [text, setText] = useState('');
  const { colors } = useTheme();
  const typingTimeoutRef = React.useRef<any>(null);

  const handleChangeText = (val: string) => {
    setText(val);
    
    if (val.trim().length > 0) {
      if (onTyping) onTyping();
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 3000); // Para de digitar depois de 3 segundos
    } else {
      if (onStopTyping) onStopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = () => {
    const value = text.trim();
    if (!value) {
      return;
    }
    
    if (onStopTyping) onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    onSend(value);
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.leadingButton}>
          <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={4096}
        />
        <TouchableOpacity activeOpacity={0.7} style={styles.trailingButton}>
          <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={handleSend}
        activeOpacity={0.8}
        disabled={!hasText}
      >
        <Ionicons name={hasText ? 'send' : 'mic'} size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 5,
    backgroundColor: 'transparent',
  },
  inputWrap: {
    flex: 1,
    height: 40,
    borderRadius: 26,
    backgroundColor: '#1a201bff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 6,
  },
  leadingButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: 40,
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  trailingButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f7cff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
