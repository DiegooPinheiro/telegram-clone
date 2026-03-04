import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import useTheme from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

interface ContactItemProps {
  uid: string;
  name: string;
  status: string;
  avatar?: string | null;
  online: boolean;
  onPress: () => void;
}

export default function ContactItem({
  name,
  status,
  avatar,
  online,
  onPress,
}: ContactItemProps) {
  const { colors: themeColors } = useTheme();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
      <Avatar uri={avatar} name={name} size={46} online={online} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: themeColors.textPrimary }]}>{name}</Text>
        <Text style={[styles.status, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {online ? 'online' : status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
  },
});
