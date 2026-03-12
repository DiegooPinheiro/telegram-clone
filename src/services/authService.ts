import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { createCometChatUser, loginCometChat, logoutCometChat } from './cometChatService';

/**
 * Registrar novo usuário com email e senha.
 * Cria o perfil no Firestore automaticamente.
 */
export const signUp = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Atualizar displayName no Firebase Auth
  await updateProfile(user, { displayName });

  // Salvar perfil no Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    status: 'Hey there! I am using Telegram Clone',
    username: '',
    phone: '',
    bio: '',
    birthday: '',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: true,
  });

  // Criar e logar no CometChat
  try {
    await createCometChatUser(user.uid, displayName);
    await loginCometChat(user.uid, displayName);
  } catch (ccError) {
    console.warn('[AuthService] Erro ao sincronizar com CometChat:', ccError);
  }

  return user;
};

/**
 * Login com email e senha.
 * Atualiza status online no Firestore.
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Marcar como online
  await updateDoc(doc(db, 'users', user.uid), {
    online: true,
    lastSeen: new Date().toISOString(),
  });

  // Logar no CometChat
  try {
    const profile = await getUserProfile(user.uid);
    await loginCometChat(user.uid, (profile as any)?.displayName || user.displayName || 'Usuário');
  } catch (ccError) {
    console.warn('[AuthService] Erro ao logar no CometChat:', ccError);
  }

  return user;
};

/**
 * Logout do Firebase.
 * Atualiza status offline no Firestore.
 */
export const signOut = async () => {
  const user = auth.currentUser;

  if (user) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        online: false,
        lastSeen: new Date().toISOString(),
      }, { merge: true });
    } catch (firestoreError) {
      console.warn('[AuthService] Nao foi possivel atualizar status offline:', firestoreError);
    }

    try {
      await logoutCometChat();
    } catch (ccError) {
      console.warn('[AuthService] Erro ao deslogar do CometChat:', ccError);
    }
  }

  await firebaseSignOut(auth);
};

/**
 * Observar mudanças no estado de autenticação.
 * Retorna um unsubscribe function.
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Buscar perfil de um usuário pelo UID.
 */
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

/**
 * Atualizar perfil do usuário logado.
 */
export const updateUserProfile = async (
  uid: string,
  data: {
    displayName?: string;
    photoURL?: string;
    status?: string;
    username?: string;
    phone?: string;
    bio?: string;
    birthday?: string;
  }
) => {
  await updateDoc(doc(db, 'users', uid), data);

  // Atualizar também no Firebase Auth se for displayName ou photoURL
  const user = auth.currentUser;
  if (user && (data.displayName || data.photoURL)) {
    await updateProfile(user, {
      displayName: data.displayName || user.displayName,
      photoURL: data.photoURL || user.photoURL,
    });
  }
};

/**
 * Retorna o usuário atualmente logado ou null.
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};
