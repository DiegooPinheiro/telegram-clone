import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Keyboard, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onAttachPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  emojiOpen?: boolean;
  onEmojiOpenChange?: (open: boolean) => void;
}

export type MessageInputHandle = {
  appendText: (value: string) => void;
  focus: () => void;
  blur: () => void;
};

const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>((props, ref) => {
  const {
    onSend,
    onTyping,
    onStopTyping,
    onAttachPress,
    placeholder = 'Mensagem',
    disabled = false,
    emojiOpen,
    onEmojiOpenChange,
  } = props;

  const [text, setText] = useState('');
  const [localEmojiOpen, setLocalEmojiOpen] = useState(false);
  const { colors } = useTheme();
  const typingTimeoutRef = React.useRef<any>(null);
  const textRef = React.useRef('');
  const inputRef = React.useRef<TextInput>(null);

  const isEmojiOpen = emojiOpen ?? localEmojiOpen;
  const setEmojiOpen = (open: boolean) => {
    if (onEmojiOpenChange) onEmojiOpenChange(open);
    else setLocalEmojiOpen(open);
  };

  const handleChangeText = (val: string) => {
    setText(val);

    if (val.trim().length > 0) {
      if (onTyping) onTyping();

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 3000);
    } else {
      if (onStopTyping) onStopTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useImperativeHandle(
    ref,
    () => ({
      appendText: (value: string) => {
        if (disabled) return;
        handleChangeText(`${textRef.current}${value}`);
      },
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }),
    [disabled, handleChangeText]
  );

  const handleSend = () => {
    const value = text.trim();
    if (!value) {
      return;
    }

    if (disabled) {
      return;
    }
    
    if (onStopTyping) onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    onSend(value);
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View>
      <View style={styles.container}>
        <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.leadingButton}
            onPress={() => {
              if (disabled) return;
              const next = !isEmojiOpen;
              setEmojiOpen(next);
              if (next) {
                inputRef.current?.blur();
                Keyboard.dismiss();
              } else {
                inputRef.current?.focus();
              }
            }}
          >
            <Ionicons
              name={isEmojiOpen ? 'keypad-outline' : 'happy-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            value={text}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={4096}
            editable={!disabled}
            onFocus={() => setEmojiOpen(false)}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.trailingButton}
            onPress={onAttachPress}
            disabled={disabled || !onAttachPress}
          >
            <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!hasText || disabled}
        >
          <Ionicons name={hasText ? 'send' : 'mic'} size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default MessageInput;

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
