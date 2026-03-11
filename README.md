# Telegram Clone (Expo + Firebase + CometChat)

Projeto mobile inspirado no Telegram, construido com Expo/React Native. Ele usa Firebase para autenticacao e perfil do usuario e CometChat para mensagens em tempo real (1:1 e grupos).

## Principais recursos

- Autenticacao com email/senha (Firebase Auth).
- Perfil do usuario no Firestore (nome, bio, foto, status).
- Lista de conversas recentes.
- Chat 1:1 e grupos com envio de mensagens.
- Indicador de digitando e status online.
- Contatos e busca.
- Criacao de grupos.
- Perfil, configuracoes e telas auxiliares (notificacoes, privacidade, dados).
- Tema claro/escuro (via SettingsContext).

## Stack

- Expo (React Native)
- React Navigation (stack + tabs + drawer)
- Firebase (Auth + Firestore)
- CometChat React Native SDK
- TypeScript

## Estrutura de pastas (resumo)

```
telegram-clone/
  App.tsx
  index.ts
  app.json
  src/
    components/
    screens/
    navigation/
    services/
    config/
    hooks/
    types/
    utils/
    theme/
```

## Configuracao

### 1) Instalar dependencias

```bash
npm install
```

### 2) Variaveis de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

O projeto le as variaveis diretamente do `process.env` (Expo). Todas precisam do prefixo `EXPO_PUBLIC_`.

#### Firebase

Preencha no `.env`:

- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- EXPO_PUBLIC_FIREBASE_APP_ID

#### CometChat

Preencha no `.env`:

- EXPO_PUBLIC_COMETCHAT_APP_ID
- EXPO_PUBLIC_COMETCHAT_REGION
- EXPO_PUBLIC_COMETCHAT_AUTH_KEY

> O CometChat e inicializado no `App.tsx` antes de qualquer uso.

## Passo a passo rapido

1. `npm install`
2. `cp .env.example .env`
3. Preencha as variaveis do Firebase e do CometChat no `.env`
4. `npm start`
5. Abra no Expo Go (ou `npm run android` / `npm run ios`)

## Como rodar

```bash
npm start
```

Outros comandos:

```bash
npm run android
npm run ios
npm run web
```

## Fluxo principal

1. App inicia em `App.tsx`.
2. Firebase Auth define se o usuario esta logado.
3. CometChat e inicializado e o usuario e logado (UID do Firebase).
4. Se autenticado: `AppNavigator`. Senao: `AuthNavigator`.

## Scripts (package.json)

- `start`: Expo dev server
- `android`: Expo no Android
- `ios`: Expo no iOS
- `web`: Expo no navegador

## Observacoes importantes

- O UID do Firebase e usado como UID no CometChat para manter sincronia.
- Se o usuario for dono de um grupo, ele nao consegue sair sem transferir a propriedade (regra do CometChat).
- Para evitar logins simultaneos, o serviço do CometChat controla concorrencia de login.
- **Seguranca**: chaves `EXPO_PUBLIC_` ficam embutidas no app. Para producao, mova a geracao de tokens do CometChat para um backend.

## Problemas comuns

### CometChat nao inicializa
- Verifique `APP_ID` e `REGION` em `cometChatConfig.ts`.
- Garanta que `initCometChat()` e chamado no `App.tsx`.

### Firebase nao conecta
- Verifique as credenciais em `firebaseConfig.ts`.

### Metro bundler falha
- Rode `npm start` novamente ou use `npx expo start -c` para limpar cache.

## Licenca

Projeto para fins de estudo/prototipo.
