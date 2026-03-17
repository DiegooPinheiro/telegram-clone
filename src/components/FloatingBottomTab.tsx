import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import useTheme from '../hooks/useTheme';
import { getTotalUnreadCount } from '../services/cometChatService';

const { width } = Dimensions.get('window');

export default function FloatingBottomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      const loggedInUser = await CometChat.getLoggedinUser();
      if (!loggedInUser) return;
      
      const count = await getTotalUnreadCount();
      setUnreadCount(count);
    };

    fetchUnread();

    const listenerID = 'BOTTOM_TAB_UNREAD_LISTENER_' + Math.random().toString(36).substring(7);
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: () => fetchUnread(),
        onMediaMessageReceived: () => fetchUnread(),
        onCustomMessageReceived: () => fetchUnread(),
        onMessagesDelivered: () => fetchUnread(),
        onMessagesRead: () => fetchUnread(),
        onMessageDeleted: () => fetchUnread(),
      })
    );

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, []);

  return (
    <View style={[styles.container, { bottom: insets.bottom + 8 }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBackground,
            shadowColor: isDark ? '#000' : '#8f98a8',
            borderColor: isDark ? '#2a2a2e' : '#d9dce3',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: any = 'chatbubbles';
          let label = 'Chats';

          if (route.name === 'ChatList') {
            iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
            label = 'Chats';
          } else if (route.name === 'Contacts') {
            iconName = isFocused ? 'people' : 'people-outline';
            label = 'Contatos';
          } else if (route.name === 'Settings') {
            iconName = isFocused ? 'settings' : 'settings-outline';
            label = 'Configs';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
            label = 'Perfil';
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && [
                      styles.activeIconContainer,
                      { backgroundColor: isDark ? '#2b3f63' : '#dce9ff' },
                    ],
                  ]}
                >
                  <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={isFocused ? colors.tabBarActive : colors.textSecondary} 
                  />
                </View>
                {route.name === 'ChatList' && unreadCount > 0 && (
                  <View style={[styles.badge, { borderColor: colors.tabBarBackground }]}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: isFocused ? colors.tabBarActive : colors.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    width: width,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    elevation: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '94%',
    maxWidth: 560,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  iconContainer: {
    width: 58,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeIconContainer: {
    backgroundColor: '#2b3f63',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -6,
    backgroundColor: '#0088cc',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
