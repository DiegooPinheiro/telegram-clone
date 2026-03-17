import { useState, useEffect, useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import useAuth from './useAuth';
import {
  fetchMessages,
  sendTextMessage,
  addMessageListener,
  removeMessageListener,
  startTyping,
  endTyping,
} from '../services/messageService';

/**
 * Hook de mensagens para uma conversa específica.
 * Gerencia busca, envio, listener em tempo real e indicador de digitação.
 */
export default function useMessages(receiverUID: string, isGroup = false) {
  const { uid: myUID } = useAuth();
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listenerID = `msg_listener_${receiverUID}`;

  // Buscar mensagens anteriores
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetched = await fetchMessages(receiverUID, 50, isGroup);
        setMessages(fetched);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar mensagens');
        console.error('[useMessages] Erro ao buscar:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [receiverUID, isGroup]);

  // Listener de mensagens em tempo real
  useEffect(() => {
    addMessageListener(listenerID, {
      onTextMessageReceived: (message) => {
        const senderUID = message.getSender().getUid();
        const receiverID = message.getReceiverId();
        
        // Só adicionar se for da conversa atual e não for minha (já adicionada no send)
        if ((senderUID === receiverUID || receiverID === receiverUID) && senderUID !== myUID) {
          setMessages((prev) => {
            // Evitar duplicatas
            if (prev.find(m => m.getId() === message.getId())) return prev;
            return [...prev, message];
          });
        }
      },
      onMediaMessageReceived: (message) => {
        const senderUID = message.getSender().getUid();
        const receiverID = message.getReceiverId();

        if ((senderUID === receiverUID || receiverID === receiverUID) && senderUID !== myUID) {
          setMessages((prev) => {
            if (prev.find(m => m.getId() === message.getId())) return prev;
            return [...prev, message];
          });
        }
      },
      onTypingStarted: (indicator) => {
        const receiverId = indicator.getReceiverId();
        const senderId = indicator.getSender().getUid();
        
        if (isGroup) {
          if (receiverId === receiverUID && senderId !== myUID) {
            setIsTyping(true);
          }
        } else {
          if (senderId === receiverUID) {
            setIsTyping(true);
          }
        }
      },
      onTypingEnded: (indicator) => {
        const receiverId = indicator.getReceiverId();
        const senderId = indicator.getSender().getUid();

        if (isGroup) {
          if (receiverId === receiverUID) {
            setIsTyping(false);
          }
        } else {
          if (senderId === receiverUID) {
            setIsTyping(false);
          }
        }
      },
    });

    return () => {
      removeMessageListener(listenerID);
    };
  }, [receiverUID, listenerID, myUID]);

  // Enviar mensagem
  const send = useCallback(
    async (text: string) => {
      setSending(true);
      try {
        const sentMessage = await sendTextMessage(receiverUID, text, isGroup);
        setMessages((prev) => [...prev, sentMessage]);
        return sentMessage;
      } catch (err: any) {
        setError(err.message || 'Erro ao enviar mensagem');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [receiverUID, isGroup]
  );

  // Indicar que está digitando
  const onTyping = useCallback(() => {
    startTyping(receiverUID, isGroup);
  }, [receiverUID, isGroup]);

  // Indicar que parou de digitar
  const onStopTyping = useCallback(() => {
    endTyping(receiverUID, isGroup);
  }, [receiverUID, isGroup]);

  return {
    messages,
    loading,
    sending,
    error,
    isTyping,
    send,
    onTyping,
    onStopTyping,
  };
}
