import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import useTheme from '../hooks/useTheme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ uri, name, size = 48, online }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const hue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 55%, 55%)`;

  const indicatorSize = Math.max(12, size * 0.28);

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '600' }}>
            {initials}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              borderWidth: size > 40 ? 2 : 1.5,
              backgroundColor: colors.online,
              borderColor: colors.background,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
