---
description: Configurar CometChat SDK no projeto Telegram Clone
---

# Setup CometChat

## Pré-requisitos

- Ter uma conta no [CometChat Dashboard](https://app.cometchat.com/)
- Criar um app e obter: **APP_ID**, **REGION** e **AUTH_KEY**

## Passos

### 1. Instalar CometChat SDK (se ainda não instalado)

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npm install @cometchat/chat-sdk-react-native
```

### 2. Criar arquivo de configuração

Criar `src/config/cometChatConfig.ts`:

```typescript
export const COMETCHAT_CONSTANTS = {
  APP_ID: "SEU_APP_ID",
  REGION: "us", // ou 'eu', dependendo da sua região
  AUTH_KEY: "SEU_AUTH_KEY",
};
```

> **IMPORTANTE**: Peça ao usuário as credenciais reais do CometChat antes de preencher.

### 3. Inicializar CometChat no App.tsx

No `App.tsx`, adicionar a inicialização antes de qualquer renderização:

```typescript
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { COMETCHAT_CONSTANTS } from "./src/config/cometChatConfig";

// Dentro de um useEffect no App.tsx:
useEffect(() => {
  const initCometChat = async () => {
    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(COMETCHAT_CONSTANTS.REGION)
      .autoEstablishSocketConnection(true)
      .build();

    try {
      await CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting);
      console.log("CometChat inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar CometChat:", error);
    }
  };

  initCometChat();
}, []);
```

### 4. Criar serviço do CometChat

Criar `src/services/cometChatService.ts`:

```typescript
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { COMETCHAT_CONSTANTS } from "../config/cometChatConfig";

// Login no CometChat (usar o UID do Firebase como UID do CometChat)
export const loginCometChat = async (uid: string) => {
  try {
    const user = await CometChat.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
    console.log("CometChat login sucesso:", user);
    return user;
  } catch (error) {
    console.error("CometChat login erro:", error);
    throw error;
  }
};

// Logout do CometChat
export const logoutCometChat = async () => {
  try {
    await CometChat.logout();
    console.log("CometChat logout sucesso");
  } catch (error) {
    console.error("CometChat logout erro:", error);
    throw error;
  }
};

// Criar ou atualizar usuário no CometChat (chamar junto com signUp do Firebase)
export const createCometChatUser = async (uid: string, name: string) => {
  const user = new CometChat.User(uid);
  user.setName(name);

  try {
    const createdUser = await CometChat.createUser(
      user,
      COMETCHAT_CONSTANTS.AUTH_KEY,
    );
    console.log("Usuário CometChat criado:", createdUser);
    return createdUser;
  } catch (error) {
    console.error("Erro ao criar usuário CometChat:", error);
    throw error;
  }
};

// Buscar lista de usuários
export const fetchUsers = async () => {
  const usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();

  try {
    const users = await usersRequest.fetchNext();
    return users;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
};

// Buscar conversas
export const fetchConversations = async () => {
  const conversationsRequest = new CometChat.ConversationsRequestBuilder()
    .setLimit(30)
    .build();

  try {
    const conversations = await conversationsRequest.fetchNext();
    return conversations;
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    throw error;
  }
};
```

### 5. Integração com Firebase Auth

No fluxo de autenticação, sincronizar Firebase com CometChat:

```typescript
// No signUp:
// 1. Criar usuário no Firebase
// 2. Criar usuário no CometChat com o mesmo UID
// 3. Fazer login no CometChat

// No signIn:
// 1. Login no Firebase
// 2. Login no CometChat com o UID do Firebase

// No signOut:
// 1. Logout do CometChat
// 2. Logout do Firebase
```

## Validação

- Verificar no console se "CometChat inicializado com sucesso" aparece
- Testar login/logout com um usuário
- Verificar no CometChat Dashboard se o usuário aparece na lista de Users
