import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLPAPER_KEY = '@vibe_chat_wallpaper';

export type WallpaperType = 'color' | 'image' | 'pattern';

export interface WallpaperConfig {
  type: WallpaperType;
  value: string; // Hex color, Image URI, or pattern name
}

export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'pattern',
  value: 'chat_bg_doodle',
};

/**
 * Saves the wallpaper configuration to local storage.
 */
export const saveWallpaper = async (config: WallpaperConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(WALLPAPER_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('[WallpaperService] Erro ao salvar wallpaper:', error);
  }
};

/**
 * Loads the wallpaper configuration from local storage.
 */
export const loadWallpaper = async (): Promise<WallpaperConfig> => {
  try {
    const value = await AsyncStorage.getItem(WALLPAPER_KEY);
    return value ? JSON.parse(value) : DEFAULT_WALLPAPER;
  } catch (error) {
    console.warn('[WallpaperService] Erro ao carregar wallpaper, usando padrão:', error);
    return DEFAULT_WALLPAPER;
  }
};

/**
 * Resets to default wallpaper.
 */
export const resetWallpaper = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WALLPAPER_KEY);
  } catch (error) {
    console.error('[WallpaperService] Erro ao resetar wallpaper:', error);
  }
};
