import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
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
import { chatSyncFirebaseUser, chatRegisterPushToken, chatDeleteMe } from './chatApi';
import { clearChatSession, setChatSession } from './chatSession';
import { connectChatSocket, disconnectChatSocket } from './chatSocket';

const syncChatUserFromFirebase = async (fallbackEmail: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  }

  let displayName = (user.displayName || '').trim();
  let phone: string | undefined = undefined;

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) {
    const data = snap.data() as any;
    if (!displayName) displayName = String(data?.displayName || '').trim();
    phone = data?.phone || undefined;
  }

  if (!displayName) displayName = 'Usuário';

  const authRes = await chatSyncFirebaseUser({
    email: (user.email || fallbackEmail).trim().toLowerCase(),
    displayName,
    photoURL: user.photoURL || undefined,
    phone,
  });

  // Store phone verification status in local session or context if needed
  // Note: authRes now contains phoneVerified

  await setChatSession({ 
    userId: authRes._id,
    phoneVerified: authRes.phoneVerified 
  });
  await connectChatSocket(authRes._id);
  
  return authRes;
};

/**
 * Registrar novo usuário com email e senha.
 * Cria o perfil no Firestore e sincroniza o usuário na Chat API.
 */
export const signUp = async (email: string, password: string, displayName: string, phone: string = '') => {
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
    phone,
    bio: '',
    birthday: '',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: true,
  });

  try {
    return await syncChatUserFromFirebase(email);
  } catch (error: any) {
    await chatRegisterPushToken('LOGGED_OUT_TOKEN').catch(() => {});
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
    return await syncChatUserFromFirebase(email);
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

  await chatRegisterPushToken('LOGGED_OUT_TOKEN').catch(() => {});
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
  if (user && (data.displayName || data.photoURL !== undefined)) {
    await updateProfile(user, {
      displayName: data.displayName || user.displayName || undefined,
      photoURL: data.photoURL !== undefined ? data.photoURL : (user.photoURL || null),
    });
  }

  // Push the profile updates to the Node.js API (MongoDB) so other users can see them
  if (user) {
    const freshDoc = await getDoc(doc(db, 'users', uid));
    const freshData = freshDoc.data() || {};
    
    await chatSyncFirebaseUser({
      email: (user.email || '').trim().toLowerCase(),
      displayName: data.displayName || user.displayName || 'Usuário',
      photoURL: data.photoURL !== undefined ? data.photoURL : (user.photoURL || undefined),
      phone: data.phone !== undefined ? data.phone : (freshData.phone || undefined),
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
export const deleteUserAccount = async (password: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Usuário não autenticado.');

  // 1. Reautenticar para poder deletar conta sensivel
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      throw new Error('Senha incorreta. Tente novamente.');
    }
    throw new Error('Erro na reautenticação: ' + error.message);
  }

  // 2. Remover do Backend (MongoDB)
  try {
    await chatDeleteMe();
  } catch (error) {
    console.error('[AuthService] Erro ao deletar no Backend:', error);
  }

  // 3. Remover do Firestore
  try {
    await deleteDoc(doc(db, 'users', user.uid));
  } catch (error) {
    console.error('[AuthService] Erro ao deletar documento no Firestore:', error);
  }

  // 4. Limpar sessão local
  await clearChatSession();
  disconnectChatSocket();

  // 5. Remover do Firebase Auth
  try {
    await deleteUser(user);
  } catch (error: any) {
    throw new Error('Erro ao deletar conta no Firebase: ' + error.message);
  }
};

/**
 * Enviar e-mail de redefinição de senha do Firebase.
 */
export const resetPassword = async (email: string) => {
  if (!email || !email.trim()) throw new Error('E-mail é obrigatório para redefinir a senha.');
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

/**
 * Atualiza o status de verificação do telefone no Firestore e Backend.
 */
export const setPhoneVerified = async (uid: string, phone: string) => {
  await updateDoc(doc(db, 'users', uid), {
    phone,
    phoneVerified: true,
  });

  const user = auth.currentUser;
  if (user) {
    await chatSyncFirebaseUser({
      email: (user.email || '').trim().toLowerCase(),
      displayName: user.displayName || 'Usuário',
      photoURL: user.photoURL || undefined,
      phone,
    });
  }
};
