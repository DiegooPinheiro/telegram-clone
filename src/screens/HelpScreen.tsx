import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import useTheme from '../hooks/useTheme';

export default function HelpScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://telegram.org/faq')}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Perguntas Frequentes</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Fazer uma Pergunta</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Política de Privacidade</Text>
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
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
});
