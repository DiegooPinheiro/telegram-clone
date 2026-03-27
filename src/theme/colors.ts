const common = {
  primary: "#0088cc",
  primaryDark: "#006da3",
  primaryLight: "#e6f4fe",
  online: "#4DCA57",
  badge: "#ff3b30",
};

export const light = {
  ...common,
  background: "#f0f2f5",      // Cinza claro para o fundo das telas
  surface: "#ffffff",         // Branco puro para os itens e cards
  backgroundSecondary: "#e4e6eb", // Cinza levemente mais escuro
  backgroundChat: "#d6e8c4",
  bubbleMine: "#EFFDDE",
  bubbleTheirs: "#ffffff",
  textPrimary: "#000000",
  textSecondary: "#707579",
  textOnPrimary: "#ffffff",
  textTimestamp: "#8E8E93",
  separator: "#dcdfe3",       // Separador mais definido
  inputBackground: "#ffffff", // Input branco puro conforme solicitado
  badgeUnread: "#d9d9dd",
  tabBarBackground: "#ffffff",
  tabBarActive: "#0088cc",
};

export const dark = {
  ...common,
  background: "#0e1621",
  backgroundSecondary: "#17212b",
  backgroundChat: "#0e1621",
  surface: "#17212b",
  bubbleMine: "#8774e1",
  bubbleTheirs: "#1f2936",
  textPrimary: "#ffffff",
  textSecondary: "#8e959b",
  textOnPrimary: "#ffffff",
  textTimestamp: "#aeb7be",
  separator: "#0e1621",
  inputBackground: "#17212b",
  badgeUnread: "#212d3b",
  tabBarBackground: "#17212b",
  tabBarActive: "#5288c1",
};

export const colors = light; // Fallback para compatibilidade retroativa durante a transição
