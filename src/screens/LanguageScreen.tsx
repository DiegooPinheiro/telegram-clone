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

  const renderLanguageOption = (label: string, subLabel: string, code: 'pt' | 'en', isLast = false) => {
    const isSelected = language === code;
    return (
      <TouchableOpacity 
        style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Oficial</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderLanguageOption('Português (Brasil)', 'Portuguese', 'pt')}
            {renderLanguageOption('English', 'Inglês', 'en', true)}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  headerButtonText: {
    fontSize: 17,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  group: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 16,
    marginLeft: 16,
    minHeight: 46,
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
    paddingHorizontal: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
