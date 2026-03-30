import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepSuccess'>;

export default function TwoStepSuccessScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const title = route.params?.title || 'Senha definida';
  const description =
    route.params?.description ||
    'Essa senha sera solicitada quando voce entrar em um novo dispositivo, apos o codigo SMS.';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={[styles.headerBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-done-outline" size={36} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{description}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.summaryTextBlock}>
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Protecao ativada</Text>
                <Text style={[styles.summaryDescription, { color: colors.textSecondary }]}>
                  Agora sua conta conta com uma etapa extra de seguranca antes de concluir um novo login.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => {
              navigation.reset({
                index: 1,
                routes: [{ name: 'MainTabs' as any }, { name: 'Privacy' as any }],
              });
            }}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Voltar as configuracoes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  summaryTextBlock: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  button: {
    minHeight: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
