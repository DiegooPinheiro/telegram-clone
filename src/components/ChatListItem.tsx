import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatChatDate } from '../utils/formatDate';

interface ChatListItemProps {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  avatar?: string | null;
  online: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

import useTheme from '../hooks/useTheme';

export default function ChatListItem({
  name,
  lastMessage,
  timestamp,
  unreadCount,
  avatar,
  online,
  onPress,
  onLongPress,
  selected = false,
}: ChatListItemProps) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, selected && { backgroundColor: isDark ? '#2b2d33' : '#e8f0ff' }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.6}
    >
      <Avatar uri={avatar} name={name} size={60} online={online} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }, unreadCount > 0 && { color: isDark ? colors.textPrimary : colors.primary }]}>
            {formatChatDate(timestamp)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {lastMessage}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: isDark ? '#2c2c2e' : colors.primary }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  message: {
    fontSize: 15,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
