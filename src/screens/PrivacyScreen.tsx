import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import useTheme from '../hooks/useTheme';

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Segurança</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Usuários Bloqueados</Text>
            <Text style={[styles.value, { color: colors.primary }]}>0</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Visto por último</Text>
            <Text style={[styles.value, { color: colors.primary }]}>Todos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
});
