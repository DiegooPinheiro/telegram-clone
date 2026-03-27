import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

interface NewContactModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (contact: {
    firstName: string;
    lastName: string;
    phone: string;
    syncWithPhone: boolean;
  }) => void;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({ visible, onClose, onSave }) => {
  const { colors, isDark } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [syncWithPhone, setSyncWithPhone] = useState(true);

  const handleCreate = () => {
    if (!firstName.trim()) return;
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      syncWithPhone,
    });
    // Reset fields
    setFirstName('');
    setLastName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.indicator} />
            
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Novo Contato</Text>
            </View>

            <ScrollView 
              contentContainerStyle={styles.form} 
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome (obrigatório)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
                  placeholder=""
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.separator }]}
                  placeholder="Sobrenome (opcional)"
                  placeholderTextColor={colors.textSecondary}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View style={styles.phoneSection}>
                <Text style={styles.label}>Número de telefone</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryPicker}>
                    <Text style={styles.flag}>🇧🇷</Text>
                    <Text style={[styles.countryCode, { color: colors.textPrimary }]}>+55</Text>
                  </View>
                  <View style={styles.phoneInputWrap}>
                    <TextInput
                      style={[styles.phoneInput, { color: colors.textPrimary }]}
                      placeholder="00 00000 0000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.syncRow}>
                <Text style={[styles.syncText, { color: colors.textPrimary }]}>Sincronizar com o celular</Text>
                <Switch
                  value={syncWithPhone}
                  onValueChange={setSyncWithPhone}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? '#fff' : syncWithPhone ? '#fff' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity style={styles.qrRow} activeOpacity={0.7}>
                <Ionicons name="grid-outline" size={20} color={colors.primary} />
                <Text style={[styles.qrText, { color: colors.primary }]}>Adicionar via Código QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary, opacity: firstName.trim() ? 1 : 0.6 }]}
                onPress={handleCreate}
                disabled={!firstName.trim()}
              >
                <Text style={styles.createBtnText}>Criar Contato</Text>
              </TouchableOpacity>
              
              {/* Espaçamento extra para garantir que o botão não seja cortado */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 10,
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8e8e93',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 26,
  },
  label: {
    color: '#8aa4ff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  input: {
    fontSize: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  phoneSection: {
    marginBottom: 26,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3c',
    paddingVertical: 6,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: '#3a3a3c',
  },
  flag: {
    fontSize: 22,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '500',
  },
  phoneInputWrap: {
    flex: 1,
    paddingLeft: 14,
  },
  phoneInput: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  syncText: {
    fontSize: 17,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 36,
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
