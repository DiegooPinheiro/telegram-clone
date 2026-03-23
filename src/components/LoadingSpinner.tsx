import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import useTheme from '../hooks/useTheme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message,
  size = 'large',
  fullScreen = true,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>{content}</View>;
  }

  return <View style={styles.inline}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  message: {
    marginTop: 12,
    fontSize: 15,
  },
});
