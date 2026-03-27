import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import useTheme from '../hooks/useTheme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void; // Made optional
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export default function CustomAlert({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancelar',
  isDestructive = false,
}: CustomAlertProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const handleBackdropPress = onCancel || onConfirm;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleBackdropPress}>
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Pressable style={[styles.alertCard, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={styles.button} onPress={onCancel} activeOpacity={0.7}>
                <Text style={[styles.buttonText, { color: colors.primary }]}>{cancelLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.button} onPress={onConfirm} activeOpacity={0.7}>
              <Text style={[styles.buttonText, { color: isDestructive ? '#FF3B30' : colors.primary, fontWeight: '700' }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertCard: {
    width: '100%',
    borderRadius: 14,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
  },
  button: {
    paddingVertical: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
