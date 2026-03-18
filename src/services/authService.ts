import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
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
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { UserProfile } from '../types/user';
import { chatLogin, chatRegister } from './chatApi';
import { clearChatSession, setChatSession } from './chatSession';
import { connectChatSocket, disconnectChatSocket } from './chatSocket';

/**
 * Registrar novo usuário com email e senha.
 * Cria o perfil no Firestore e registra na sua Chat API.
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

  try {
    const authRes = await chatRegister({
      username: (user.email || email).trim().toLowerCase(),
      nome: displayName.trim(),
      password,
      foto: user.photoURL || undefined,
    });

    await setChatSession({ token: authRes.token, userId: authRes._id });
    connectChatSocket(authRes._id);
  } catch (error: any) {
    // Se falhar, desfaz login do Firebase para não deixar o app sem chat
    await clearChatSession();
    disconnectChatSocket();
    await firebaseSignOut(auth);

    const msg = error?.message ? String(error.message) : 'Falha ao registrar na Chat API.';
    throw new Error(`Falha ao conectar no Chat API: ${msg}`);
  }

  return user;
};

/**
 * Login com email e senha.
 * Atualiza status online no Firestore e faz login na sua Chat API.
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Marcar como online
  await updateDoc(doc(db, 'users', user.uid), {
    online: true,
    lastSeen: new Date().toISOString(),
  });

  const username = (user.email || email).trim().toLowerCase();

  try {
    const authRes = await chatLogin({ username, password });
    console.log('[AuthService] ChatLogin Sucesso:', authRes);
    console.log('[AuthService] ChatRegister Sucesso:', authRes);
    await setChatSession({ token: authRes.token, userId: authRes._id });
    connectChatSocket(authRes._id);
  } catch (loginError: any) {
    console.warn('[AuthService] ChatLogin Falhou (tentando registrar):', loginError.message);
    // Se o usuário ainda não existe na Chat API (migração), tenta criar automaticamente.
    try {
      let nome = (user.displayName || '').trim();

      if (!nome) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        nome = (snap.exists() ? String((snap.data() as any)?.displayName || '') : '').trim();
      }

      if (!nome) nome = 'Usuário';

      const authRes = await chatRegister({
        username,
        nome,
        password,
        foto: user.photoURL || undefined,
      });

      console.log('[AuthService] ChatRegister (auto) Sucesso:', authRes);
      console.log('[AuthService] ChatRegister (auto) Sucesso:', authRes);
      await setChatSession({ token: authRes.token, userId: authRes._id });
      connectChatSocket(authRes._id);
    } catch (registerError: any) {
      console.error('[AuthService] ChatRegister (auto) Erro:', registerError);
      await clearChatSession();
      disconnectChatSocket();
      await firebaseSignOut(auth);

      const registerMsg = registerError?.message ? String(registerError.message) : '';
      const loginMsg = loginError?.message ? String(loginError.message) : '';

      if (registerMsg.toLowerCase().includes('usuário já existe')) {
        throw new Error(
          'Você já tem conta na Chat API, mas a senha não confere. Faça login com a senha correta do chat (ou recrie o usuário no backend).'
        );
      }

      const msg = `[Registro]: ${registerMsg}` || `[Login]: ${loginMsg}` || 'Falha ao autenticar na Chat API.';
      throw new Error(`Falha ao conectar no Chat API: ${msg}`);
    }
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
  const chunkSize = 30; // Firestore limit for 'in' operator

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

