import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

export default function MessageInput({ onSend, placeholder = 'Mensagem' }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const value = text.trim();
    if (!value) {
      return;
    }
    onSend(value);
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Ionicons name="happy-outline" size={24} color="#8E8E93" style={styles.leadingIcon} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={4096}
        />
        <TouchableOpacity activeOpacity={0.7} style={styles.trailingButton}>
          <Ionicons name="attach-outline" size={24} color="#c5c8cf" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  inputWrap: {
    flex: 1,
    minHeight: 52,
    maxHeight: 130,
    borderRadius: 26,
    backgroundColor: '#15171d',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 12,
    paddingRight: 8,
  },
  leadingIcon: {
    marginBottom: 13,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    maxHeight: 110,
    paddingTop: 12,
    paddingBottom: 12,
  },
  trailingButton: {
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4f7cff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
