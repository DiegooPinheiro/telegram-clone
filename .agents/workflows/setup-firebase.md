---
description: Configurar Firebase (Auth + Firestore) no projeto Telegram Clone
---

# Setup Firebase

## Pré-requisitos

- Ter um projeto criado no [Firebase Console](https://console.firebase.google.com/)
- Copiar as credenciais do projeto (apiKey, authDomain, projectId, etc.)

## Passos

### 1. Instalar Firebase (se ainda não instalado)

// turbo

```bash
cd c:\Users\aluno\Desktop\CHAT-INSTATANEO\telegram-clone && npm install firebase
```

### 2. Criar arquivo de configuração

Criar `src/config/firebaseConfig.ts` com o seguinte conteúdo:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

> **IMPORTANTE**: Peça ao usuário as credenciais reais do Firebase antes de preencher.

### 3. Criar serviço de autenticação

Criar `src/services/authService.ts`:

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";

// Registrar novo usuário
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  // Salvar perfil no Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    status: "Hey there! I am using Telegram Clone",
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: true,
  });

  return user;
};

// Login
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
};

// Logout
export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Observar mudanças de auth
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Buscar perfil do usuário
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
```

### 4. Regras do Firestore (configurar no Console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Validação

- Verificar se `import { auth, db } from '../config/firebaseConfig'` não dá erro
- Testar `signUp` e `signIn` com um email de teste
- Verificar no Firebase Console se o usuário aparece em Authentication
- Verificar se o perfil foi salvo na coleção `users` do Firestore
