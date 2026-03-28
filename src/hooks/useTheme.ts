import { useSettings } from '../context/SettingsContext';
import { light, dark } from '../theme/colors';

export default function useTheme() {
  const { theme, chatThemeColor } = useSettings();
  const isDark = theme === 'dark';
  const baseColors = isDark ? dark : light;

  const colors = {
    ...baseColors,
    chatPrimary: chatThemeColor || baseColors.primary,
    bubbleMine: chatThemeColor || baseColors.primary,
  };

  return {
    theme,
    colors,
    isDark,
  };
}
