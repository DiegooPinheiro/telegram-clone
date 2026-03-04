import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { spacing } from '../theme/spacing';
import useTheme from '../hooks/useTheme';

interface MessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  placeholder = 'Mensagem',
}: MessageInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.separator }]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={4096}
      />
      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: colors.primary }, !text.trim() && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  },
});
