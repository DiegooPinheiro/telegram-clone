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
}

export default function ChatListItem({
  name,
  lastMessage,
  timestamp,
  unreadCount,
  avatar,
  online,
  onPress,
}: ChatListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
      <Avatar uri={avatar} name={name} size={52} online={online} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>
            {formatChatDate(timestamp)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.message} numberOfLines={1}>
            {lastMessage}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timeUnread: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
