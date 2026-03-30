import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TwoStepIntro'>;

export default function TwoStepIntroScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={[styles.headerBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark-outline" size={34} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>Verificacao em Duas Etapas</Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Adicione uma senha extra para proteger sua conta quando voce entrar em um novo aparelho.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <FeatureItem
              icon="lock-closed-outline"
              title="Camada extra de seguranca"
              description="Depois do codigo por SMS, o app tambem vai pedir a senha que voce configurar aqui."
            />
            <FeatureItem
              icon="mail-open-outline"
              title="Recuperacao por email"
              description="Voce podera cadastrar um email para recuperar o acesso se esquecer a senha."
            />
            <FeatureItem
              icon="phone-portrait-outline"
              title="Protecao em novos dispositivos"
              description="A senha so entra no fluxo quando o login for identificado como uma nova sessao."
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TwoStepPassword')}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Configurar senha</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.featureTextBlock}>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  featureDescription: {
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
