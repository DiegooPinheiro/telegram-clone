import { CometChat } from '@cometchat/chat-sdk-react-native';

/**
 * Enviar mensagem de texto para um usuário ou grupo.
 */
export const sendTextMessage = async (
  receiverID: string,
  text: string,
  isGroup = false
) => {
  const receiverType = isGroup
    ? CometChat.RECEIVER_TYPE.GROUP
    : CometChat.RECEIVER_TYPE.USER;

  const textMessage = new CometChat.TextMessage(receiverID, text, receiverType);

  try {
    const sentMessage = await CometChat.sendMessage(textMessage);
    console.log('[Message] Enviada com sucesso');
    return sentMessage;
  } catch (error) {
    console.error('[Message] Erro ao enviar:', error);
    throw error;
  }
};

/**
 * Buscar mensagens anteriores de uma conversa.
 */
export const fetchMessages = async (
  uid: string,
  limit = 50,
  isGroup = false
) => {
  let builder = new CometChat.MessagesRequestBuilder().setLimit(limit);

  if (isGroup) {
    builder = builder.setGUID(uid);
  } else {
    builder = builder.setUID(uid);
  }

  const messagesRequest = builder.build();

  try {
    const messages = await messagesRequest.fetchPrevious();
    return messages;
  } catch (error) {
    console.error('[Message] Erro ao buscar mensagens:', error);
    throw error;
  }
};

/**
 * Marcar mensagens como lidas.
 */
export const markAsRead = (message: CometChat.BaseMessage) => {
  CometChat.markAsRead(message);
};

/**
 * Listener de mensagens em tempo real.
 * Retorna as callbacks para texto, mídia e tipagem.
 */
export const addMessageListener = (
  listenerID: string,
  callbacks: {
    onTextMessageReceived?: (message: CometChat.TextMessage) => void;
    onMediaMessageReceived?: (message: CometChat.MediaMessage) => void;
    onTypingStarted?: (typingIndicator: CometChat.TypingIndicator) => void;
    onTypingEnded?: (typingIndicator: CometChat.TypingIndicator) => void;
    onMessagesDelivered?: (receipt: CometChat.MessageReceipt) => void;
    onMessagesRead?: (receipt: CometChat.MessageReceipt) => void;
  }
) => {
  CometChat.addMessageListener(
    listenerID,
    new CometChat.MessageListener({
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        console.log('[Message] Texto recebido de:', message.getSender().getName());
        callbacks.onTextMessageReceived?.(message);
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        console.log('[Message] Mídia recebida de:', message.getSender().getName());
        callbacks.onMediaMessageReceived?.(message);
      },
      onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
        callbacks.onTypingStarted?.(typingIndicator);
      },
      onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
        callbacks.onTypingEnded?.(typingIndicator);
      },
      onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
        callbacks.onMessagesDelivered?.(receipt);
      },
      onMessagesRead: (receipt: CometChat.MessageReceipt) => {
        callbacks.onMessagesRead?.(receipt);
      },
    })
  );
};

/**
 * Remover listener de mensagens.
 */
export const removeMessageListener = (listenerID: string) => {
  CometChat.removeMessageListener(listenerID);
};

/**
 * Enviar indicador de "digitando".
 */
export const startTyping = (receiverID: string, isGroup = false) => {
  const receiverType = isGroup
    ? CometChat.RECEIVER_TYPE.GROUP
    : CometChat.RECEIVER_TYPE.USER;

  const typingIndicator = new CometChat.TypingIndicator(receiverID, receiverType);
  CometChat.startTyping(typingIndicator);
};

/**
 * Parar indicador de "digitando".
 */
export const endTyping = (receiverID: string, isGroup = false) => {
  const receiverType = isGroup
    ? CometChat.RECEIVER_TYPE.GROUP
    : CometChat.RECEIVER_TYPE.USER;

  const typingIndicator = new CometChat.TypingIndicator(receiverID, receiverType);
  CometChat.endTyping(typingIndicator);
};

/**
 * Deletar uma mensagem.
 */
export const deleteMessage = async (messageId: number | string) => {
  try {
    await CometChat.deleteMessage(messageId.toString());
    console.log('[Message] Deletada com sucesso');
  } catch (error) {
    console.error('[Message] Erro ao deletar:', error);
    throw error;
  }
};
