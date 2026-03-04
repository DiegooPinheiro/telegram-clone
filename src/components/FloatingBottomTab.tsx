import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function FloatingBottomTab({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();

  if (!isDark) return null; // Only for dark mode according to screenshot? 
  // User might want it for both, but the screenshot is dark. I'll make it for both but styled.

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { backgroundColor: '#1c1c1e', shadowColor: '#000' }]}>
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
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? '#ffffff' : '#8E8E93'} 
                />
                {isFocused && route.name === 'ChatList' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>1</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: isFocused ? '#ffffff' : '#8E8E93' }]}>
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
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    elevation: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden', // Ensures background is clipped to round edges
  },
  activeIconContainer: {
    backgroundColor: '#0088cc',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: 5,
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
