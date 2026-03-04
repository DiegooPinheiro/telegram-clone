import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function NotificationsScreen() {
  const [msgNotifications, setMsgNotifications] = React.useState(true);
  const [groupNotifications, setGroupNotifications] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensagens</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Notificações de chats</Text>
            <Switch 
              value={msgNotifications} 
              onValueChange={setMsgNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grupos</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Notificações de grupos</Text>
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
    backgroundColor: colors.backgroundSecondary,
  },
  section: {
    backgroundColor: colors.background,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.primary,
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
    color: colors.textPrimary,
  },
});
