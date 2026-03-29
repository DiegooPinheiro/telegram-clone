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
import { clearChatSession, getChatSession, setChatSession } from './chatSession';
import { connectChatSocket, disconnectChatSocket } from './chatSocket';

const syncChatUserFromFirebase = async (fallbackEmail: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessão do Firebase ausente. Faça login novamente.');
  }

  let displayName = (user.displayName || '').trim();
  let phone: string | undefined = undefined;
  let phoneVerified = false;

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) {
    const data = snap.data() as any;
    if (!displayName) displayName = String(data?.displayName || '').trim();
    phone = data?.phone || undefined;
    phoneVerified = !!data?.phoneVerified;
  }

  if (!displayName) displayName = 'Usuário';

  const authRes = await chatSyncFirebaseUser({
    email: (user.email || fallbackEmail).trim().toLowerCase(),
    displayName,
    photoURL: user.photoURL || undefined,
    phone,
    phoneVerified,
  } as any);

  // Store phone verification status in local session or context if needed
  // Note: authRes now contains phoneVerified

  await setChatSession({ 
    userId: authRes._id,
    phoneVerified: authRes.phoneVerified 
  });
  await connectChatSocket(authRes._id);
  
  return authRes;
};

export const ensureChatSessionForCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessao do Firebase ausente. Faca login novamente.');
  }

  const snap = await getDoc(doc(db, 'users', user.uid));
  const data = snap.exists() ? (snap.data() as Partial<UserProfile>) : null;
  const fallbackEmail = String(data?.email || user.email || '').trim().toLowerCase();

  return syncChatUserFromFirebase(fallbackEmail);
};

/**
 * Finaliza o cadastro de um novo usuário (Nome e opcionalmente Email).
 * O usuário já deve estar autenticado via telefone no Firebase.
 */
export const signUp = async (displayName: string, email: string = '', phone: string = '', photoURL: string = '') => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado no Firebase.');

  // Atualiza no Firebase Auth
  await updateProfile(user, { displayName, photoURL });

  // Cria ou atualiza o documento no Firestore de forma NÃO DESTRUTIVA
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: email || user.email || null,
    displayName,
    photoURL: photoURL || null,
    status: 'Hey there! I am using Vibe',
    phone: phone || (user.phoneNumber ? user.phoneNumber.replace(/\D/g, '') : ''),
    phoneVerified: true,
    bio: '',
    birthday: '',
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    online: true,
  }, { merge: true });

  try {
    // Sincroniza com a API do Chat
    return await syncChatUserFromFirebase(email);
  } catch (error: any) {
    // Em caso de erro na API, deslogamos o usuário por segurança
    await chatRegisterPushToken('LOGGED_OUT_TOKEN').catch(() => {});
    await clearChatSession();
    disconnectChatSocket();
    await firebaseSignOut(auth);

    const msg = error?.message ? String(error.message) : 'Falha ao sincronizar na Chat API.';
    throw new Error(`Falha ao conectar no Chat API: ${msg}`);
  }
};

/**
 * Login com email e senha.
 * Atualiza status online no Firestore e sincroniza a sessão na Chat API.
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    online: true,
    lastSeen: new Date().toISOString(),
  }, { merge: true });

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
  if (!docSnap.exists()) return null;
  return {
    ...(docSnap.data() as UserProfile),
    uid: (docSnap.data() as UserProfile).uid || docSnap.id,
  } as UserProfile;
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

  const docSnap = querySnapshot.docs[0];
  return {
    ...(docSnap.data() as UserProfile),
    uid: (docSnap.data() as UserProfile).uid || docSnap.id,
  } as UserProfile;
};

/**
 * Normaliza um número de telefone para o formato padrão (com 55 se no Brasil).
 */
export const normalizePhoneNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '').trim();
  console.log('[AuthService] Normalizing phone:', { input: phone, cleaned });
  // Se for um número brasileiro sem o 55, adiciona.
  if (cleaned.length === 10 || cleaned.length === 11) {
    const withDDI = '55' + cleaned;
    console.log('[AuthService] Appended DDI 55:', withDDI);
    return withDDI;
  }
  return cleaned;
};

/**
 * Buscar perfil de um usuário pelo número de telefone.
 */
export const getUserByPhone = async (phone: string) => {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return null;

  console.log('[AuthService] Searching for account with phone:', normalizedPhone);
  
  const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    console.log('[AuthService] Account found!');
    const docSnap = querySnapshot.docs[0];
    return {
      ...(docSnap.data() as UserProfile),
      uid: (docSnap.data() as UserProfile).uid || docSnap.id,
    } as UserProfile;
  }

  // FALLBACK: Se o número for brasileiro e a busca com '55' falhou, tenta sem o '55'
  // por seguranca caso o usuario tenha cadastrado antes da normalizacao.
  if (normalizedPhone.startsWith('55')) {
    const withoutDDI = normalizedPhone.substring(2);
    console.log('[AuthService] No match with 55. Trying fallback search without DDI:', withoutDDI);
    const qFallback = query(collection(db, 'users'), where('phone', '==', withoutDDI));
    const fallbackSnapshot = await getDocs(qFallback);
    
    if (!fallbackSnapshot.empty) {
      console.log('[AuthService] Account found with fallback search!');
      const docSnap = fallbackSnapshot.docs[0];
      return {
        ...(docSnap.data() as UserProfile),
        uid: (docSnap.data() as UserProfile).uid || docSnap.id,
      } as UserProfile;
    }
  }

  console.log('[AuthService] No account found for this phone.');
  return null;
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
    await setDoc(doc(db, 'users', uid), data, { merge: true });

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
      username: data.username !== undefined ? data.username : (freshData.username || undefined),
      phoneVerified: freshData.phoneVerified || false,
    } as any);
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

export const setPhoneVerified = async (uid: string, phone: string) => {
  console.log('[AuthService] Marking phone as verified for:', uid);
  // 1. Atualiza no Firestore
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { 
    phoneVerified: true,
    phone: phone.replace(/\D/g, '')
  });

  // 2. Sincroniza com a API do Chat (Backend)
  const user = auth.currentUser;
  let chatUserId: string | null = null;
  if (user) {
    const freshProfile = await getDoc(userRef);
    const profileData = (freshProfile.exists() ? freshProfile.data() : null) as UserProfile | null;

    const authRes = await chatSyncFirebaseUser({
        email: String(profileData?.email || user.email || '').trim().toLowerCase(),
        displayName: user.displayName || 'Usuário',
        photoURL: profileData?.photoURL || user.photoURL || undefined,
        phone: phone.replace(/\D/g, ''),
        phoneVerified: true,
      } as any);
      chatUserId = authRes?._id ? String(authRes._id) : null;
  }

  // 3. Atualiza a sessão local para o AuthContext detectar a mudança
  if (!chatUserId && !user) {
    const existingSession = await getChatSession();
    chatUserId = existingSession?.userId || null;
  }

  if (!chatUserId) {
    throw new Error('NÃ£o foi possÃ­vel concluir a sessÃ£o do chat apÃ³s validar o telefone.');
  }

  await setChatSession({ userId: chatUserId, phoneVerified: true });
  console.log('[AuthService] Phone verification completed and saved.');
};

export const completePhoneVerificationLogin = async (uid: string, phone: string) => {
  console.log('[AuthService] Completing phone verification login for:', uid);
  const normalizedPhone = phone.replace(/\D/g, '');

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    phoneVerified: true,
    phone: normalizedPhone,
  });

  const user = auth.currentUser;
  if (!user) {
    await clearChatSession();
    throw new Error('Sessao do Firebase ausente. Faca login novamente.');
  }

  const freshProfile = await getDoc(userRef);
  const profileData = (freshProfile.exists() ? freshProfile.data() : null) as UserProfile | null;

  const authRes = await chatSyncFirebaseUser({
    email: String(profileData?.email || user.email || '').trim().toLowerCase(),
    displayName: String(profileData?.displayName || user.displayName || 'Usuario').trim(),
    photoURL: profileData?.photoURL || user.photoURL || undefined,
    phone: normalizedPhone,
    phoneVerified: true,
  } as any);

  const chatUserId = authRes?._id ? String(authRes._id) : null;
  if (!chatUserId) {
    await clearChatSession();
    throw new Error('Nao foi possivel sincronizar sua sessao com o chat apos validar o telefone.');
  }

  await setChatSession({ userId: chatUserId, phoneVerified: true });
  await connectChatSocket(chatUserId);
  console.log('[AuthService] Phone verification login completed.');
};

/**
 * Atualiza o status e detalhes da Verificação em Duas Etapas (2FA).
 */
export const updateTwoStepAuth = async (data: { password?: string; email?: string; enabled: boolean }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');

  const docRef = doc(db, 'users', user.uid);
  const updateData: any = {
    twoStepEnabled: data.enabled,
  };
  
  if (data.password !== undefined) updateData.twoStepPassword = data.password;
  if (data.email !== undefined) updateData.twoStepEmail = data.email;

  await updateDoc(docRef, updateData);
};

/**
 * Desativa a Verificação em Duas Etapas (2FA).
 */
export const disableTwoStepAuth = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');

  const docRef = doc(db, 'users', user.uid);
  await updateDoc(docRef, {
    twoStepEnabled: false,
    twoStepPassword: null,
    twoStepEmail: null,
  });
};
