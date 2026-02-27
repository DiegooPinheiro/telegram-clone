---
description: Design system e estilização padrão inspirada no Telegram
---

# Estilo Telegram

Use este workflow como referência para manter a identidade visual consistente do Telegram Clone.

## Paleta de Cores

Criar `src/theme/colors.ts`:

```typescript
export const colors = {
  // Cores principais
  primary: "#0088cc", // Azul Telegram
  primaryDark: "#006da3", // Azul escuro (pressed states)
  primaryLight: "#e6f4fe", // Azul claro (backgrounds)

  // Backgrounds
  background: "#ffffff", // Fundo principal
  backgroundChat: "#d6e8c4", // Fundo do chat (padrão verde suave)
  backgroundSecondary: "#f0f0f0", // Fundo secundário
  surface: "#ffffff", // Cards, modais

  // Bolhas de mensagem
  bubbleMine: "#EFFDDE", // Verde claro (minhas mensagens)
  bubbleTheirs: "#ffffff", // Branco (mensagens dos outros)

  // Textos
  textPrimary: "#000000", // Texto principal
  textSecondary: "#707579", // Texto secundário
  textLink: "#0088cc", // Links
  textOnPrimary: "#ffffff", // Texto sobre fundo azul
  textTimestamp: "#8E8E93", // Timestamps

  // Interface
  separator: "#e0e0e0", // Linhas divisórias
  inputBackground: "#f0f0f0", // Fundo do input
  icon: "#707579", // Ícones
  badge: "#ff3b30", // Badges de notificação
  online: "#4DCA57", // Indicador online
  unread: "#0088cc", // Contador de não lidas

  // Status bar
  statusBar: "#007ab8", // Cor da status bar

  // Tema Escuro (usar quando implementar dark mode)
  dark: {
    background: "#17212B",
    surface: "#1E2C3A",
    textPrimary: "#ffffff",
    textSecondary: "#8B9DAF",
    separator: "#293A4C",
    inputBackground: "#242F3D",
    bubbleMine: "#2B5278",
    bubbleTheirs: "#182533",
  },
};
```

## Tipografia

Criar `src/theme/typography.ts`:

```typescript
import { TextStyle } from "react-native";

export const typography: Record<string, TextStyle> = {
  // Headers
  h1: { fontSize: 28, fontWeight: "bold", color: "#000" },
  h2: { fontSize: 22, fontWeight: "600", color: "#000" },
  h3: { fontSize: 18, fontWeight: "600", color: "#000" },

  // Body
  body: { fontSize: 16, color: "#000", lineHeight: 22 },
  bodySmall: { fontSize: 14, color: "#000", lineHeight: 20 },

  // Chat
  message: { fontSize: 15, color: "#000", lineHeight: 20 },
  timestamp: { fontSize: 11, color: "#8E8E93" },
  senderName: { fontSize: 13, fontWeight: "600", color: "#0088cc" },

  // UI
  caption: { fontSize: 12, color: "#707579" },
  button: { fontSize: 16, fontWeight: "600", color: "#fff" },
  tabLabel: { fontSize: 10, fontWeight: "500" },

  // List items
  listTitle: { fontSize: 16, fontWeight: "500", color: "#000" },
  listSubtitle: { fontSize: 14, color: "#707579" },
};
```

## Espaçamento

Criar `src/theme/spacing.ts`:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999, // Para avatares circulares
};
```

## Componentes de UI Reutilizáveis

### Avatar com indicador online

Criar `src/components/Avatar.tsx`:

```typescript
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ uri, name, size = 48, online }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Gerar cor a partir do nome (como o Telegram faz)
  const hue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  const bgColor = `hsl(${hue}, 60%, 55%)`;

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {online && (
        <View style={[styles.onlineIndicator, { right: 0, bottom: 0 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontWeight: '600' },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
```

## Padrões obrigatórios

1. **Sempre** importar cores de `src/theme/colors.ts` — nunca hardcoded
2. **Sempre** usar os estilos de tipografia de `src/theme/typography.ts`
3. **Header**: backgroundColor `#0088cc`, tintColor `#fff`
4. **Avatares**: usar geração de cor por nome quando não houver foto
5. **Bolhas**: verde claro para minhas mensagens, branco para as dos outros
6. **Animações**: usar `react-native-reanimated` para transições suaves
