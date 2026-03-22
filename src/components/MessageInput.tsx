import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  Keyboard,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
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
  recording?: boolean;
  recordingDurationMs?: number;
  onStartRecording?: () => void;
  onCancelRecording?: () => void;
  onSendRecording?: () => void;
}

export type MessageInputHandle = {
  appendText: (value: string) => void;
  focus: () => void;
  blur: () => void;
};

const CANCEL_THRESHOLD = 90;
const LOCK_THRESHOLD = 72;

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
    recording = false,
    recordingDurationMs = 0,
    onStartRecording,
    onCancelRecording,
    onSendRecording,
  } = props;

  const [text, setText] = useState('');
  const [localEmojiOpen, setLocalEmojiOpen] = useState(false);
  const [recordingLocked, setRecordingLocked] = useState(false);
  const [recordingCancelling, setRecordingCancelling] = useState(false);
  const { colors } = useTheme();
  const typingTimeoutRef = React.useRef<any>(null);
  const textRef = React.useRef('');
  const inputRef = React.useRef<TextInput>(null);
  const recordingStartedByGestureRef = React.useRef(false);
  const actionTranslateX = React.useRef(new Animated.Value(0)).current;
  const actionTranslateY = React.useRef(new Animated.Value(0)).current;

  const isEmojiOpen = emojiOpen ?? localEmojiOpen;
  const setEmojiOpen = (open: boolean) => {
    if (onEmojiOpenChange) onEmojiOpenChange(open);
    else setLocalEmojiOpen(open);
  };

  const handleChangeText = (val: string) => {
    setText(val);

    if (val.trim().length > 0) {
      onTyping?.();

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 3000);
    } else {
      onStopTyping?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!recording) {
      setRecordingLocked(false);
      setRecordingCancelling(false);
      recordingStartedByGestureRef.current = false;
      actionTranslateX.setValue(0);
      actionTranslateY.setValue(0);
    }
  }, [actionTranslateX, actionTranslateY, recording]);

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
    [disabled]
  );

  const handleSend = () => {
    const value = text.trim();
    if (!value || disabled) {
      return;
    }

    onStopTyping?.();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    onSend(value);
    setText('');
  };

  const hasText = text.trim().length > 0;
  const canStartRecording = !hasText && !!onStartRecording && !disabled;
  const recordingLabel = formatRecordingTime(recordingDurationMs);
  const showRecordingGestureUi = recording && !recordingLocked;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canStartRecording,
        onMoveShouldSetPanResponder: () => canStartRecording,
        onPanResponderGrant: () => {
          if (!canStartRecording) return;
          recordingStartedByGestureRef.current = true;
          setRecordingCancelling(false);
          setRecordingLocked(false);
          onStartRecording?.();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!recordingStartedByGestureRef.current) return;

          const dx = Math.min(0, gestureState.dx);
          const dy = Math.min(0, gestureState.dy);

          actionTranslateX.setValue(dx);
          actionTranslateY.setValue(dy);

          setRecordingCancelling(Math.abs(dx) > CANCEL_THRESHOLD);
          if (Math.abs(dy) > LOCK_THRESHOLD) {
            setRecordingLocked(true);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!recordingStartedByGestureRef.current) return;

          const shouldCancel = Math.abs(Math.min(0, gestureState.dx)) > CANCEL_THRESHOLD;
          const shouldLock = Math.abs(Math.min(0, gestureState.dy)) > LOCK_THRESHOLD;

          recordingStartedByGestureRef.current = false;
          actionTranslateX.setValue(0);
          actionTranslateY.setValue(0);
          setRecordingCancelling(false);

          if (shouldCancel) {
            onCancelRecording?.();
            return;
          }

          if (shouldLock) {
            setRecordingLocked(true);
            return;
          }

          onSendRecording?.();
        },
        onPanResponderTerminate: () => {
          if (!recordingStartedByGestureRef.current) return;
          recordingStartedByGestureRef.current = false;
          actionTranslateX.setValue(0);
          actionTranslateY.setValue(0);
          setRecordingCancelling(false);
          onCancelRecording?.();
        },
      }),
    [actionTranslateX, actionTranslateY, canStartRecording, onCancelRecording, onSendRecording, onStartRecording]
  );

  return (
    <View>
      <View style={styles.container}>
        <View style={[styles.inputWrap, { backgroundColor: colors.inputBackground }]}>
          {recording ? (
            <View style={styles.recordingWrap}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={[styles.recordingTime, { color: colors.textPrimary }]}>{recordingLabel}</Text>
              </View>

              {recordingLocked ? (
                <View style={styles.recordingHintWrap}>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={colors.textSecondary}
                    style={styles.recordingLockIcon}
                  />
                  <Text style={[styles.recordingHint, { color: colors.textSecondary }]} numberOfLines={1}>
                    Gravação travada
                  </Text>
                </View>
              ) : (
                <Animated.View
                  style={[
                    styles.recordingHintAnimated,
                    {
                      transform: [
                        {
                          translateX: actionTranslateX.interpolate({
                            inputRange: [-120, 0],
                            outputRange: [-24, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.recordingHint,
                      { color: recordingCancelling ? '#ef4444' : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {recordingCancelling ? 'Solte para cancelar' : 'Deslize para cancelar'}
                  </Text>
                </Animated.View>
              )}

              {recordingLocked ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.trailingButton}
                  onPress={onCancelRecording}
                  disabled={disabled}
                >
                  <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.recordingLockHint}>
                  <Ionicons name="arrow-up" size={16} color={colors.textSecondary} />
                  <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                </View>
              )}
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>

        {hasText || recordingLocked ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (recordingLocked) {
                onSendRecording?.();
                return;
              }
              handleSend();
            }}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <Ionicons name="send" size={22} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary },
              showRecordingGestureUi
                ? {
                    transform: [
                      {
                        translateX: actionTranslateX.interpolate({
                          inputRange: [-120, 0],
                          outputRange: [-34, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                      {
                        translateY: actionTranslateY.interpolate({
                          inputRange: [-110, 0],
                          outputRange: [-18, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  }
                : null,
            ]}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              style={styles.actionButtonTouch}
              onPress={() => {
                if (canStartRecording) {
                  onStartRecording?.();
                  setRecordingLocked(true);
                }
              }}
              activeOpacity={0.8}
              disabled={disabled || !canStartRecording}
            >
              <Ionicons name="mic" size={22} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}
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
  recordingWrap: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '700',
  },
  recordingHint: {
    flex: 1,
    fontSize: 14,
  },
  recordingHintWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingHintAnimated: {
    flex: 1,
  },
  recordingLockIcon: {
    marginRight: 6,
  },
  recordingLockHint: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButtonTouch: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const formatRecordingTime = (millis: number) => {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
