---
description: Criar componentes de chat (mensagens, input, real-time) usando CometChat
---

# Criar Componente de Chat

Use este workflow para criar funcionalidades de chat no Telegram Clone.

## Componentes Essenciais

### 1. Bolha de Mensagem

Criar `src/components/MessageBubble.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  message: string;
  timestamp: number;
  isMine: boolean;
  senderName?: string;
}

export default function MessageBubble({ message, timestamp, isMine, senderName }: MessageBubbleProps) {
  const time = new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      {!isMine && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <Text style={[styles.messageText, isMine && styles.myText]}>{message}</Text>
      <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 16,
    marginVertical: 2,
    marginHorizontal: 12,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: '#EFFDDE',
    borderBottomRightRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0088cc',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  myText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimestamp: {
    color: '#6dab4f',
  },
});
```

### 2. Input de Mensagem

Criar `src/components/MessageInput.tsx`:

```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native';

interface MessageInputProps {
  onSend: (text: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Mensagem"
        placeholderTextColor="#999"
        multiline
        maxLength={4096}
      />
      <TouchableOpacity
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim()}
      >
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0088cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  },
});
```

### 3. Enviar e Receber Mensagens via CometChat

Criar `src/services/messageService.ts`:

```typescript
import { CometChat } from "@cometchat/chat-sdk-react-native";

// Enviar mensagem de texto
export const sendTextMessage = async (
  receiverUID: string,
  text: string,
  isGroup = false,
) => {
  const receiverType = isGroup
    ? CometChat.RECEIVER_TYPE.GROUP
    : CometChat.RECEIVER_TYPE.USER;

  const textMessage = new CometChat.TextMessage(
    receiverUID,
    text,
    receiverType,
  );

  try {
    const sentMessage = await CometChat.sendMessage(textMessage);
    return sentMessage;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

// Buscar mensagens anteriores
export const fetchMessages = async (
  uid: string,
  limit = 50,
  isGroup = false,
) => {
  let messagesRequest;

  if (isGroup) {
    messagesRequest = new CometChat.MessagesRequestBuilder()
      .setGUID(uid)
      .setLimit(limit)
      .build();
  } else {
    messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(uid)
      .setLimit(limit)
      .build();
  }

  try {
    const messages = await messagesRequest.fetchPrevious();
    return messages;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    throw error;
  }
};

// Listener de mensagens em tempo real
export const addMessageListener = (
  listenerID: string,
  onMessageReceived: (message: CometChat.BaseMessage) => void,
) => {
  CometChat.addMessageListener(
    listenerID,
    new CometChat.MessageListener({
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        onMessageReceived(message);
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        onMessageReceived(message);
      },
    }),
  );
};

// Remover listener
export const removeMessageListener = (listenerID: string) => {
  CometChat.removeMessageListener(listenerID);
};
```

### 4. Usar na tela de Chat

Na tela `Chat.tsx`, usar os componentes e serviços:

```typescript
// Padrão de uso:
// 1. useEffect para buscar mensagens: fetchMessages(uid)
// 2. useEffect para registrar listener: addMessageListener(...)
// 3. FlatList inverted={true} para exibir mensagens (mais recentes embaixo)
// 4. MessageInput com onSend chamando sendTextMessage()
// 5. Limpar listener no cleanup do useEffect

// Estrutura do return:
// <KeyboardAvoidingView>
//   <FlatList inverted data={messages} renderItem={MessageBubble} />
//   <MessageInput onSend={handleSend} />
// </KeyboardAvoidingView>
```

## Padrões obrigatórios

1. **Sempre** usar `FlatList` com `inverted={true}` para lista de mensagens
2. **Sempre** usar `KeyboardAvoidingView` para não esconder o input
3. **Sempre** registrar e remover listeners no `useEffect`
4. **Sempre** identificar se a mensagem é minha comparando com o UID logado
5. **Sempre** tratar erros de envio com try/catch
