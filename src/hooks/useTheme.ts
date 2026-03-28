import { useSettings } from '../context/SettingsContext';
import { light, dark } from '../theme/colors';

export default function useTheme() {
  const { theme, chatThemeColor } = useSettings();
  const isDark = theme === 'dark';
  const baseColors = isDark ? dark : light;

  // Cores dinâmicas baseadas no tema selecionado (APENAS PARA O CHAT)
  const colors = {
    ...baseColors,
    // chatPrimary: Cor escolhida para os balões e ícones dentro do chat
    chatPrimary: chatThemeColor || baseColors.primary,
    
    // Balão de mensagem "Mine" (Meu) - baseado na cor do chat
    bubbleMine: isDark 
      ? (`${chatThemeColor}66` || baseColors.bubbleMine) 
      : (`${chatThemeColor}26` || baseColors.bubbleMine),
  };

  return {
    theme,
    colors,
    isDark,
  };
}
