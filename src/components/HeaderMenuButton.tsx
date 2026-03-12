import React, { useState } from 'react';
import { TouchableOpacity, Modal, Pressable, View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import { navigationRef } from '../navigation/navigationRef';

export default function HeaderMenuButton() {
  const [visible, setVisible] = useState(false);
  const { isDark, colors } = useTheme();
  const { toggleTheme } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <>
      <TouchableOpacity style={styles.action} activeOpacity={0.75} onPress={() => setVisible(true)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View
            style={[
              styles.card,
              {
                top: insets.top + 6,
                backgroundColor: colors.surface,
                borderColor: colors.separator,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.item, styles.itemBorder, { borderBottomColor: colors.separator }]}
              activeOpacity={0.75}
              onPress={() => {
                toggleTheme();
                setVisible(false);
              }}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>{isDark ? 'Modo Claro' : 'Modo Escuro'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.75}
              onPress={() => {
                setVisible(false);
                if (navigationRef.isReady()) {
                  navigationRef.navigate('NewGroup');
                }
              }}
            >
              <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Novo Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.75}
              onPress={() => {
                setVisible(false);
                Alert.alert('Mensagens Salvas', 'Esta opcao sera adicionada em breve.');
              }}
            >
              <Ionicons name="bookmark-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Mensagens Salvas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.75}
              onPress={() => {
                setVisible(false);
                Alert.alert('Carteira', 'Esta opcao sera adicionada em breve.');
              }}
            >
              <Ionicons name="wallet-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>Carteira</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  action: {
    marginRight: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    top: 0,
    right: 14,
    width: 270,
    borderRadius: 14,
    backgroundColor: '#232428',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2F3136',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3B40',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
});
