import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useSettings } from '../context/SettingsContext';
import useTheme from '../hooks/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

export default function LanguageScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { language, setLanguage } = useSettings();

  const handleSelectLanguage = (lang: 'pt' | 'en') => {
    setLanguage(lang);
  };

  const renderLanguageOption = (label: string, subLabel: string, code: 'pt' | 'en') => {
    const isSelected = language === code;
    return (
      <TouchableOpacity 
        style={styles.row}
        onPress={() => handleSelectLanguage(code)}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{subLabel}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardSection}>
        
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Idioma Oficial</Text>
          {renderLanguageOption('Português (Brasil)', 'Portuguese', 'pt')}
          {renderLanguageOption('English', 'Inglês', 'en')}
        </View>
        
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Pode ser que o texto retorne completamente ao idioma imposto apenas após o reinício do aplicativo.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '400',
  },
  subLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  footerText: {
    fontSize: 13,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
