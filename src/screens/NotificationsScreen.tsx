import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import useTheme from '../hooks/useTheme';

export default function NotificationsScreen() {
  const [msgNotifications, setMsgNotifications] = React.useState(true);
  const [groupNotifications, setGroupNotifications] = React.useState(true);
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <ScrollView>
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Mensagens</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Notificações de chats</Text>
            <Switch 
              value={msgNotifications} 
              onValueChange={setMsgNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Grupos</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Notificações de grupos</Text>
            <Switch 
              value={groupNotifications} 
              onValueChange={setGroupNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 16,
  },
});
