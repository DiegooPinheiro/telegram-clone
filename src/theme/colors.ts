const common = {
  primary: "#0088cc",
  primaryDark: "#006da3",
  primaryLight: "#e6f4fe",
  online: "#4DCA57",
  badge: "#ff3b30",
};

export const light = {
  ...common,
  background: "#ffffff",
  backgroundSecondary: "#f0f0f0",
  backgroundChat: "#d6e8c4",
  surface: "#ffffff",
  bubbleMine: "#EFFDDE",
  bubbleTheirs: "#ffffff",
  textPrimary: "#000000",
  textSecondary: "#707579",
  textOnPrimary: "#ffffff",
  textTimestamp: "#8E8E93",
  separator: "#e0e0e0",
  inputBackground: "#f0f0f0",
  badgeUnread: "#d9d9dd",
  tabBarBackground: "#ffffff",
  tabBarActive: "#0088cc",
};

export const dark = {
  ...common,
  background: "#000000",
  backgroundSecondary: "#0f0f0f",
  backgroundChat: "#000000",
  surface: "#1c1c1e",
  bubbleMine: "#0088cc",
  bubbleTheirs: "#1c1c1e",
  textPrimary: "#ffffff",
  textSecondary: "#8E8E93",
  textOnPrimary: "#ffffff",
  textTimestamp: "#8E8E93",
  separator: "#1c1c1e",
  inputBackground: "#1c1c1e",
  badgeUnread: "#2c2c2e", // Greyish color from screenshot
  tabBarBackground: "#1c1c1e",
  tabBarActive: "#0088cc",
};

export const colors = light; // Fallback para compatibilidade retroativa durante a transição
