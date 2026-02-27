import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

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
  const content = (
    <>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return <View style={styles.inline}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  inline: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
