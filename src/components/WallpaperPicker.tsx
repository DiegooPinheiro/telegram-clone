import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useTheme from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';
import { WallpaperConfig, saveWallpaper } from '../services/wallpaperService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WallpaperPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (config: WallpaperConfig) => void;
  currentWallpaper?: WallpaperConfig;
}

const PRESET_COLORS = [
  '#2a2f32', // Dark Grey
  '#1e3a5f', // Dark Blue
  '#2d4a22', // Dark Green
  '#4a1e4a', // Dark Purple
  '#5f3a1e', // Dark Brown
  '#000000', // Black
];

const PRESET_THEMES = [
  { id: 'none', type: 'color', value: '#2a2f32', label: 'Sem Tema', isReset: true },
  { id: 'doodle', type: 'pattern', value: 'chat_bg_doodle', label: 'Doodle' },
  { id: 'blue_sky', type: 'color', value: '#3a86ff', label: 'Blue Sky' },
  { id: 'green_leaf', type: 'color', value: '#8338ec', label: 'Purple Vibe' },
  { id: 'warm', type: 'color', value: '#fb5607', label: 'Sunset' },
];

export const WallpaperPicker: React.FC<WallpaperPickerProps> = ({ visible, onClose, onSelect, currentWallpaper }) => {
  const { colors, isDark } = useTheme();
  const { toggleTheme } = useSettings();
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const config: WallpaperConfig = { type: 'image', value: result.assets[0].uri };
      await saveWallpaper(config);
      onSelect(config);
      onClose();
    }
  };

  const handleSelectPreset = async (item: any) => {
    const config: WallpaperConfig = { type: item.type as any, value: item.value };
    await saveWallpaper(config);
    onSelect(config);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
              transform: [{ translateY: panY }]
            }
          ]}
        >
          <View style={styles.indicatorContainer} {...panResponder.panHandlers}>
            <View style={styles.indicator} />
          </View>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Selecionar tema</Text>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.themesScroll}
          >
            {PRESET_THEMES.map((item: any) => {
              const isSelected = currentWallpaper?.value === item.value;
              const previewBg = item.id === 'doodle' 
                ? (isDark ? '#1c2431' : '#d7e5d0') 
                : (item.color || item.value);
              
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.themeCard, isSelected && { borderColor: colors.primary, borderWidth: 2 }]} 
                  onPress={() => handleSelectPreset(item)}
                >
                  <View style={[styles.themePreview, { backgroundColor: previewBg }]}>
                    {item.isReset && (
                      <Ionicons name="close-circle" size={32} color="#ff3b30" />
                    )}
                    {item.type === 'pattern' && (
                      <Image 
                        source={require('../../assets/chat_bg_doodle.png')} 
                        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.35 : 0.4, width: '100%', height: '100%' }]} 
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
            <Text style={[styles.galleryBtnText, { color: colors.primary }]}>Escolher da Galeria</Text>
          </TouchableOpacity>
          
          <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
  },
  indicatorContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8e8e93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  themesScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 20,
  },
  themeCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  themePreview: {
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#3a3a3c',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  themeLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  galleryBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  galleryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
