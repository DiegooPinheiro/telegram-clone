import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { spacing } from '../theme/spacing';
import { formatChatDate } from '../utils/formatDate';

interface ChatListItemProps {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isOutgoing?: boolean;
  outgoingRead?: boolean;
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
  isOutgoing = false,
  outgoingRead = false,
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
      <Avatar uri={avatar} name={name} size={46} online={online} />

      <View style={styles.content}>
        <View style={styles.textColumn}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {lastMessage}
            </Text>
          </View>
        </View>

        <View style={styles.metaColumn}>
          <View style={styles.timeRow}>
            {isOutgoing ? (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={outgoingRead ? (isDark ? '#7cb7ff' : colors.primary) : colors.textSecondary}
                style={styles.timeCheck}
              />
            ) : null}
            <Text
              style={[
                styles.time,
                { color: unreadCount > 0 ? colors.primary : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {formatChatDate(timestamp)}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: isDark ? '#4b6bff' : colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : (
            <View style={styles.badgeSpacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    paddingRight: 10,
  },
  header: {
    justifyContent: 'center',
    marginBottom: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    paddingRight: 4,
  },
  time: {
    fontSize: 13,
  },
  metaColumn: {
    width: 58,
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  timeCheck: {
    marginRight: 2,
  },
  footer: {
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    paddingRight: 2,
    lineHeight: 18,
  },
  badge: {
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSpacer: {
    height: 22,
    marginTop: 6,
  },
});
