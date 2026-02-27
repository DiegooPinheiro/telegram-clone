---
description: Como rodar, debugar e resolver erros comuns no Telegram Clone (Expo)
---

# Rodar o Projeto

## Comandos Principais

### Instalar dependências

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npm install
```

### Iniciar o servidor de desenvolvimento

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo start
```

### Iniciar com cache limpo (resolver problemas)

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo start -c
```

### Rodar no Android

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo start --android
```

### Rodar no iOS

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo start --ios
```

### Rodar na Web

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo start --web
```

## Instalar Todas as Dependências do Projeto

Se as dependências ainda não foram instaladas no `telegram-clone/`, rodar:

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npm install @react-navigation/native @react-navigation/native-stack @cometchat/chat-sdk-react-native firebase
```

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
```

## Configurar babel.config.js para Reanimated

Criar/atualizar `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
```

> **IMPORTANTE**: O plugin do Reanimated DEVE ser o último na lista de plugins.

## Erros Comuns e Soluções

### "Unable to resolve module"

```bash
# Limpar cache e reinstalar
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone
rm -rf node_modules
npm install
npx expo start -c
```

### "Metro bundler failed to start"

```bash
# Matar processos do Metro e reiniciar
npx expo start -c
```

### "Invariant Violation: requireNativeComponent"

- Verificar se usou `npx expo install` (não `npm install`) para pacotes nativos
- Verificar se não está usando componente nativo na web sem suporte

### "Firebase: No Firebase App"

- Verificar se `initializeApp()` é chamado antes de qualquer outro uso do Firebase
- Verificar se `firebaseConfig.ts` está com as credenciais corretas

### "CometChat initialization failed"

- Verificar APP_ID e REGION no `cometChatConfig.ts`
- Verificar se `CometChat.init()` é chamado no `App.tsx` antes de qualquer uso
- Verificar conexão com a internet

### Tela branca / App não carrega

1. Verificar se `index.ts` aponta para o componente correto
2. Verificar erros no terminal do Metro bundler
3. Rodar com `npx expo start -c` para limpar cache
4. Verificar se todas as dependências estão instaladas

### Erros de TypeScript

```bash
# Verificar tipos
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npx tsc --noEmit
```

## Checklist antes de rodar

- [ ] Todas as dependências instaladas (`npm install`)
- [ ] `babel.config.js` com plugin do Reanimated
- [ ] `firebaseConfig.ts` com credenciais reais
- [ ] `cometChatConfig.ts` com credenciais reais
- [ ] CometChat inicializado no `App.tsx`
