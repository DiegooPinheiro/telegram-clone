---
description: Documentação da arquitetura do Telegram Clone (Navegação, Temas e Serviços)
---

# Arquitetura do Projeto Telegram Clone

Este guia descreve os padrões de arquitetura utilizados no projeto, incluindo a estrutura de navegação, o sistema de temas dinâmicos e a integração de serviços.

## 1. Estrutura de Navegação

O app utiliza uma combinação de `Drawer Navigator` e `Stack Navigator`.

- **Drawer Navigator (Raiz)**: Gerencia o menu lateral e o gesto de arrastar.
  - Localização: `src/navigation/AppNavigator.tsx` (Componente `AppNavigator`)
  - Conteúdo Customizado: `src/components/CustomDrawerContent.tsx`
- **Stack Navigator (Interno)**: Gerencia o fluxo principal de telas.
  - Localização: `src/navigation/AppNavigator.tsx` (Componente `MainStack`)
  - Telas incluídas: `ChatList`, `Chat`, `Profile`, `Settings`, `Contacts`, etc.

## 2. Sistema de Temas (Dark Mode)

A aplicação suporta temas claro e escuro de forma dinâmica e persistente.

- **Configuração**: `src/theme/colors.ts` define as paletas `light` e `dark`.
- **Estado Global**: `src/context/SettingsContext.tsx` gerencia a preferência via `AsyncStorage`.
- **Consumo**: O hook `src/hooks/useTheme.ts` permite que qualquer componente use as cores corretas:
  ```tsx
  const { colors, isDark } = useTheme();
  ```

## 3. Serviços e Integração

- **CometChat SDK**: Utilizado para mensagens em tempo real e lista de conversas.
  - Serviços: `src/services/cometChatService.ts` e `cometChatService.ts`.
  - Listeners: Implementados em `src/hooks/useMessages.ts` e `ChatListScreen.tsx`.
- **Firebase Auth**: Utilizado para autenticação de usuários (UID, Email, Perfil).
  - Serviços: `src/services/authService.ts`.

## 4. Componentes Chave

- **Avatar**: `src/components/Avatar.tsx` - Exibe imagem ou iniciais com indicador de status online.
- **MessageBubble**: `src/components/MessageBubble.tsx` - Bolha de mensagem adaptável ao tema.
- **MessageInput**: `src/components/MessageInput.tsx` - Entrada de texto customizada.

## 5. Como Adicionar Nova Funcionalidade

1. **Definir Rota**: Adicione o nome da tela em `src/navigation/types.ts`.
2. **Criar Tela**: Crie o componente em `src/screens/`.
3. **Registrar**: No `AppNavigator.tsx`, adicione a tela ao `MainStack`.
4. **Links**: Se for uma opção global, adicione ao `CustomDrawerContent.tsx` ou `SettingsScreen.tsx`.
