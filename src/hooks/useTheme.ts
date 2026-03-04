import { useSettings } from '../context/SettingsContext';
import { light, dark } from '../theme/colors';

export default function useTheme() {
  const { theme } = useSettings();
  const themeColors = theme === 'dark' ? dark : light;

  return {
    theme,
    colors: themeColors,
    isDark: theme === 'dark',
  };
}
