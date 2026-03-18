# Telegram Clone (Expo + Firebase + Chat API)

Projeto mobile inspirado no Telegram, construído com Expo/React Native.

- **Firebase**: autenticação (email/senha) e perfil do usuário (Firestore).
- **Sua Chat API (Node/Express + MongoDB + Socket.IO)**: conversas e mensagens em tempo real.

> Este app foi migrado do CometChat para uma API própria.

## Principais recursos (MVP)

- Autenticação com email/senha (Firebase Auth).
- Perfil do usuário no Firestore (nome, bio, foto, status).
- Lista de conversas recentes (Chat API).
- Chat 1:1 com envio/recebimento em tempo real (Socket.IO).
- Contatos e busca (lista de usuários da Chat API).
- Tema claro/escuro (via SettingsContext).

## Stack

- Expo (React Native)
- React Navigation (stack + tabs)
- Firebase (Auth + Firestore)
- Socket.IO Client
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

## Configuração

### 1) Instalar dependências

```bash
npm install
```

### 2) Variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

O projeto lê variáveis diretamente do `process.env` (Expo). Todas precisam do prefixo `EXPO_PUBLIC_`.

#### Firebase

Preencha no `.env`:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

#### Chat API

- `EXPO_PUBLIC_CHAT_API_URL`
  - Exemplo: `https://chat-api-v2-tested.onrender.com`

> Dica: no Render (Free) a primeira requisição pode demorar ~50s porque o serviço “dorme”.

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
2. Firebase Auth define se o usuário está logado.
3. No login/cadastro, o app registra/autentica o usuário na Chat API e salva `token` + `userId` em `AsyncStorage`.
4. O app conecta no Socket.IO e escuta mensagens (`receive_message`).

## Observações importantes

- A Chat API ainda não implementa alguns recursos que existiam no CometChat (ex.: grupos, typing, receipts, contagem de não lidas).
- Para produção real, recomenda-se:
  - autenticar o Socket.IO (não confiar em `senderId` vindo do cliente)
  - usar storage/CDN para uploads (no Render o disco é efêmero)

## Licença

Projeto para fins de estudo/protótipo.
