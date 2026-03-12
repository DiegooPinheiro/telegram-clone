import { CometChat } from '@cometchat/chat-sdk-react-native';
import { COMETCHAT_CONSTANTS } from '../config/cometChatConfig';

let initPromise: Promise<boolean> | null = null;
let loginPromise: Promise<CometChat.User> | null = null;
let loginUidInFlight: string | null = null;

/**
 * Inicializar o CometChat SDK.
 * Deve ser chamado uma vez no App.tsx antes de qualquer outra operaÃ§Ã£o.
 */
export const initCometChat = async () => {
  if (initPromise) {
    return initPromise;
  }

  const appSetting = new CometChat.AppSettingsBuilder()
    .subscribePresenceForAllUsers()
    .setRegion(COMETCHAT_CONSTANTS.REGION.trim().toLowerCase())
    .autoEstablishSocketConnection(true)
    .build();

  initPromise = (async () => {
    try {
      await CometChat.init(
        COMETCHAT_CONSTANTS.APP_ID.trim(),
        appSetting
      );
      console.log('[CometChat] Inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('[CometChat] Erro ao inicializar:', error);
      return false;
    }
  })();

  return initPromise;
};

/**
 * Atualizar nome do usuário no CometChat via REST API.
 */
export const updateCometChatUserName = async (uid: string, name: string) => {
  const region = COMETCHAT_CONSTANTS.REGION.trim().toLowerCase();
  const appId = COMETCHAT_CONSTANTS.APP_ID.trim();
  const restApiKey = COMETCHAT_CONSTANTS.REST_API_KEY.trim();

  try {
    const response = await fetch(`https://api-${region}.cometchat.io/v3/users/${uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': restApiKey,
        'appId': appId,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('[CometChat] Falha ao atualizar nome:', response.status, errorData);
    } else {
      console.log('[CometChat] Nome atualizado para:', name);
    }
  } catch (error) {
    console.warn('[CometChat] Erro ao atualizar nome:', error);
  }
};

/**
 * Login no CometChat.
 * Usar o UID do Firebase como UID do CometChat para manter sincronia.
 */
export const loginCometChat = async (uid: string, name?: string) => {
  if (!uid) {
    throw new Error('UID obrigatorio para login no CometChat');
  }

  const loggedInUser = await CometChat.getLoggedinUser();
  if (loggedInUser && loggedInUser.getUid() === uid) {
    // Mesmo já logado, atualiza o nome se estiver errado
    if (name && loggedInUser.getName() !== name) {
      await updateCometChatUserName(uid, name);
    }
    return loggedInUser;
  }

  if (loginPromise && loginUidInFlight === uid) {
    return loginPromise;
  }

  try {
    loginUidInFlight = uid;
    loginPromise = (async () => {
      if (loggedInUser && loggedInUser.getUid() !== uid) {
        await CometChat.logout();
      }

      const user = await CometChat.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
      console.log('[CometChat] Login sucesso:', user.getName());

      // Corrige o nome no CometChat se estiver errado (ex: criado como "Usuario")
      if (name && user.getName() !== name) {
        await updateCometChatUserName(uid, name);
      }

      return user;
    })();

    return await loginPromise;
  } catch (error: any) {
    // Se o usuário não existe no CometChat mas existe no Firebase (acontece se o app falhou antes)
    if (error.code === 'ERR_UID_NOT_FOUND' && name) {
      console.log('[CometChat] Usuário não encontrado, tentando criar...');
      await createCometChatUser(uid, name);
      return await CometChat.login(uid, COMETCHAT_CONSTANTS.AUTH_KEY);
    }
    console.error('[CometChat] Erro no login:', error);
    throw error;
  } finally {
    loginPromise = null;
    loginUidInFlight = null;
  }
};

/**
 * Logout do CometChat.
 */
export const logoutCometChat = async () => {
  try {
    await CometChat.logout();
    console.log('[CometChat] Logout sucesso');
  } catch (error) {
    console.error('[CometChat] Erro no logout:', error);
    throw error;
  }
};

/**
 * Criar um novo usuário no CometChat via REST API.
 * Usar REST API Key garante funcionamento independente das config do dashboard.
 */
export const createCometChatUser = async (uid: string, name: string) => {
  const region = COMETCHAT_CONSTANTS.REGION.trim().toLowerCase();
  const appId = COMETCHAT_CONSTANTS.APP_ID.trim();
  const restApiKey = COMETCHAT_CONSTANTS.REST_API_KEY.trim();

  try {
    const response = await fetch(`https://api-${region}.cometchat.io/v3/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': restApiKey,
        'appId': appId,
      },
      body: JSON.stringify({ uid, name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Usuário já existe — pode ignorar
      if (response.status === 409) {
        console.log('[CometChat] Usuário já existe:', uid);
        return;
      }
      throw new Error(`[CometChat] Erro ao criar usuário: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[CometChat] Usuário criado:', name);
    return data;
  } catch (error) {
    console.error('[CometChat] Erro ao criar usuário:', error);
    throw error;
  }
};

/**
 * Buscar lista de todos os usuÃ¡rios.
 */
export const fetchUsers = async (limit = 30) => {
  const usersRequest = new CometChat.UsersRequestBuilder()
    .setLimit(limit)
    .build();

  try {
    const users = await usersRequest.fetchNext();
    return users;
  } catch (error) {
    console.error('[CometChat] Erro ao buscar usuÃ¡rios:', error);
    throw error;
  }
};

/**
 * Buscar lista de conversas recentes.
 */
export const fetchConversations = async (limit = 30) => {
  const conversationsRequest = new CometChat.ConversationsRequestBuilder()
    .setLimit(limit)
    .build();

  try {
    const conversations = await conversationsRequest.fetchNext();
    return conversations;
  } catch (error) {
    console.error('[CometChat] Erro ao buscar conversas:', error);
    throw error;
  }
};

/**
 * Criar grupo no CometChat.
 */
export const createGroup = async (
  name: string,
  type: 'public' | 'private' | 'password' = 'public',
  password?: string
) => {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error('Nome do grupo obrigatorio');
  }

  const guid = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const groupType =
    type === 'private'
      ? CometChat.GROUP_TYPE.PRIVATE
      : type === 'password'
      ? CometChat.GROUP_TYPE.PASSWORD
      : CometChat.GROUP_TYPE.PUBLIC;

  const group = new CometChat.Group(guid, normalizedName, groupType, password);

  try {
    const created = await CometChat.createGroup(group);
    return created;
  } catch (error) {
    console.error('[CometChat] Erro ao criar grupo:', error);
    throw error;
  }
};

/**
 * Buscar informaÃ§Ãµes de um usuÃ¡rio especÃ­fico.
 */
export const getUser = async (uid: string) => {
  try {
    const user = await CometChat.getUser(uid);
    return user;
  } catch (error) {
    console.error('[CometChat] Erro ao buscar usuÃ¡rio:', error);
    throw error;
  }
};

/**
 * Listener de status de presenÃ§a (online/offline).
 */
export const addUserPresenceListener = (
  listenerID: string,
  onUserOnline: (user: CometChat.User) => void,
  onUserOffline: (user: CometChat.User) => void
) => {
  CometChat.addUserListener(
    listenerID,
    new CometChat.UserListener({
      onUserOnline: (onlineUser: CometChat.User) => {
        console.log('[CometChat] UsuÃ¡rio online:', onlineUser.getName());
        onUserOnline(onlineUser);
      },
      onUserOffline: (offlineUser: CometChat.User) => {
        console.log('[CometChat] UsuÃ¡rio offline:', offlineUser.getName());
        onUserOffline(offlineUser);
      },
    })
  );
};

/**
 * Remover listener de presenÃ§a.
 */
export const removeUserPresenceListener = (listenerID: string) => {
  CometChat.removeUserListener(listenerID);
};
