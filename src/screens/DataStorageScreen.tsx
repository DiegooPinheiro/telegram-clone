import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import useTheme from '../hooks/useTheme';

export default function DataStorageScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Uso de Disco</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Uso do Armazenamento</Text>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Download Automático</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Ao usar dados móveis</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>Fotos</Text>
          </View>
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
});
