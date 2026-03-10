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

### 2) Firebase

Edite `src/config/firebaseConfig.ts` e coloque as credenciais do seu projeto Firebase:

- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

> Em producao, use variaveis de ambiente. Nao commite credenciais reais.

### 3) CometChat

Edite `src/config/cometChatConfig.ts`:

- APP_ID
- REGION
- AUTH_KEY

> O CometChat e inicializado no `App.tsx` antes de qualquer uso.

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
