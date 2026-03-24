import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserProfile } from '../types/user';
import { chatSyncFirebaseUser } from './chatApi';
import { clearChatSession, setChatSession } from './chatSession';
import { connectChatSocket, disconnectChatSocket } from './chatSocket';

const syncChatUserFromFirebase = async (fallbackEmail: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  }

  let displayName = (user.displayName || '').trim();

  if (!displayName) {
    const snap = await getDoc(doc(db, 'users', user.uid));
    displayName = (snap.exists() ? String((snap.data() as any)?.displayName || '') : '').trim();
  }

  if (!displayName) displayName = 'Usuário';

  const authRes = await chatSyncFirebaseUser({
    email: (user.email || fallbackEmail).trim().toLowerCase(),
    displayName,
    photoURL: user.photoURL || undefined,
  });

  await setChatSession({ userId: authRes._id });
  await connectChatSocket(authRes._id);
};

/**
 * Registrar novo usuário com email e senha.
 * Cria o perfil no Firestore e sincroniza o usuário na Chat API.
 */
export const signUp = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    status: 'Hey there! I am using Vibe',
    username: '',
    phone: '',
    bio: '',
    birthday: '',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: true,
  });

  try {
    await syncChatUserFromFirebase(email);
  } catch (error: any) {
    await clearChatSession();
    disconnectChatSocket();
    await firebaseSignOut(auth);

    const msg = error?.message ? String(error.message) : 'Falha ao sincronizar na Chat API.';
    throw new Error(`Falha ao conectar no Chat API: ${msg}`);
  }

  return user;
};

/**
 * Login com email e senha.
 * Atualiza status online no Firestore e sincroniza a sessão na Chat API.
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateDoc(doc(db, 'users', user.uid), {
    online: true,
    lastSeen: new Date().toISOString(),
  });

  try {
    await syncChatUserFromFirebase(email);
  } catch (error: any) {
    await clearChatSession();
    disconnectChatSocket();
    await firebaseSignOut(auth);

    const msg = error?.message ? String(error.message) : 'Falha ao sincronizar na Chat API.';
    throw new Error(`Falha ao conectar no Chat API: ${msg}`);
  }

  return user;
};

/**
 * Logout do Firebase.
 * Atualiza status offline no Firestore e limpa sessão do chat.
 */
export const signOut = async () => {
  const user = auth.currentUser;

  if (user) {
    await updateDoc(doc(db, 'users', user.uid), {
      online: false,
      lastSeen: new Date().toISOString(),
    });
  }

  await clearChatSession();
  disconnectChatSocket();
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
 * Buscar perfis de usuários por uma lista de UIDs (Firestore).
 */
export const getUsersByIds = async (uids: string[]): Promise<UserProfile[]> => {
  if (!uids || uids.length === 0) return [];

  const results: UserProfile[] = [];
  const chunkSize = 30;

  try {
    for (let i = 0; i < uids.length; i += chunkSize) {
      const chunk = uids.slice(i, i + chunkSize);
      const q = query(collection(db, 'users'), where('uid', 'in', chunk));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as UserProfile);
      });
    }
  } catch (error) {
    console.error('[AuthService] Erro ao buscar usuários no Firestore:', error);
  }

  return results;
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
 * Buscar perfil de um usuário pelo username.
 */
export const getUserProfileByUsername = async (username: string) => {
  const normalizedUsername = username.trim().replace(/^@+/, '');
  if (!normalizedUsername) return null;

  const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  return querySnapshot.docs[0].data();
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

/**
 * Deletar conta do usuário.
 * Remove o perfil no Firestore e a conta no Firebase Auth.
 */
export const deleteUserAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');

  // 1. Remover do Firestore
  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch (error) {
    console.error('[AuthService] Erro ao deletar documento no Firestore:', error);
  }

  // 2. Limpar sessão local
  await clearChatSession();
  disconnectChatSocket();

  // 3. Remover do Firebase Auth
  try {
    await deleteUser(user);
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Para deletar sua conta, você precisa fazer login novamente por segurança.');
    }
    throw error;
  }
};
