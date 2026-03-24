const fs = require('fs');
const path = require('path');

// 1. Update ChatScreen.tsx
const chatScreenPath = path.join(process.cwd(), 'src/screens/ChatScreen.tsx');
let chatScreenContent = fs.readFileSync(chatScreenPath, 'utf8');

const loadingOriginalRegex = /if \(!conversationId\) \{\s*if \(active\) setMessages\(\[\]\);\s*return;\s*\}/;
const loadingNewReplacement = `if (!conversationId) {
          if (active) {
            setMessages([]);
            setLoading(false);
          }
          return;
        }`;
chatScreenContent = chatScreenContent.replace(loadingOriginalRegex, loadingNewReplacement);

const onReceiveMessageRegex = /const normalized: LocalChatMessage = \{\s*\.\.\.message,\s*\/\/ socket pode enviar senderId como string \(sem populate\)\s*senderId: message\.senderId,\s*clientMessageId: message\.clientMessageId \|\| null,\s*createdAt: message\.createdAt \|\| new Date\(\)\.toISOString\(\),\s*updatedAt: message\.updatedAt \|\| message\.createdAt \|\| new Date\(\)\.toISOString\(\),\s*localStatus: message\.read \? 'read' : 'delivered',\s*\};/;
const onReceiveMessageNew = `      const isMine = !!myUserId && extractUserId(message.senderId) === myUserId;
      const normalized: LocalChatMessage = {
        ...message,
        // socket pode enviar senderId como string (sem populate)
        senderId: message.senderId,
        clientMessageId: message.clientMessageId || null,
        createdAt: message.createdAt || new Date().toISOString(),
        updatedAt: message.updatedAt || message.createdAt || new Date().toISOString(),
        localStatus: message.read ? 'read' : (message.localStatus ? message.localStatus : (isMine ? 'sent' : 'delivered')),
      };`;
chatScreenContent = chatScreenContent.replace(onReceiveMessageRegex, onReceiveMessageNew);


const optimisticIndexUpdateRegex = /const next = \[\.\.\.prev\];\s*next\[optimisticIndex\] = \{\s*\.\.\.normalized,\s*localStatus: normalized\.read \? 'read' : 'delivered',\s*localOnly: false,\s*\};/;
const optimisticIndexUpdateNew = `const next = [...prev];
          next[optimisticIndex] = {
            ...normalized,
            localStatus: normalized.read ? 'read' : (normalized.localStatus ? normalized.localStatus : 'sent'),
            localOnly: false,
          };`;
chatScreenContent = chatScreenContent.replace(optimisticIndexUpdateRegex, optimisticIndexUpdateNew);

// Also fix the load messages mapping from API
const mapFetchedMessagesRegex = /const mapped = fetched\.map\(\(message\) => \(\{\s*\.\.\.message,\s*localStatus: message\.read \? 'read' : 'delivered',\s*\}\)\) as LocalChatMessage\[\];/;
const mapFetchedMessagesNew = `const mapped = fetched.map((message) => {
            const isMine = extractUserId(message.senderId) === session.userId;
            return {
              ...message,
              localStatus: message.read ? 'read' : (message.localStatus ? message.localStatus : (isMine ? 'sent' : 'delivered')),
            };
          }) as LocalChatMessage[];`;
chatScreenContent = chatScreenContent.replace(mapFetchedMessagesRegex, mapFetchedMessagesNew);

fs.writeFileSync(chatScreenPath, chatScreenContent, 'utf8');
console.log('Updated ChatScreen.tsx');


// 2. Update chatSocket.js in backend
const socketPath = path.join(process.cwd(), '../chat-api_v2_tested/src/sockets/chatSocket.js');
let socketContent = fs.readFileSync(socketPath, 'utf8');

const emitReceiveRegex = /socket\.emit\('receive_message', outgoingPayload\);\s*const isOnline = emitToUser\(receiverId, 'receive_message', outgoingPayload\);/;
const emitReceiveNew = `const isOnline = emitToUser(receiverId, 'receive_message', outgoingPayload);
        socket.emit('receive_message', { ...outgoingPayload, localStatus: isOnline ? 'delivered' : 'sent' });`;
socketContent = socketContent.replace(emitReceiveRegex, emitReceiveNew);

fs.writeFileSync(socketPath, socketContent, 'utf8');
console.log('Updated chatSocket.js');
