import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import useMessages from '../hooks/useMessages';
import useOnlineStatus from '../hooks/useOnlineStatus';
import useAuth from '../hooks/useAuth';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import LoadingSpinner from '../components/LoadingSpinner';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { uid: receiverUID, name } = route.params;
  const { uid: myUID } = useAuth();
  const { messages, loading, send, isTyping } = useMessages(receiverUID);
  const { statusText } = useOnlineStatus(receiverUID);
  const flatListRef = useRef<FlatList>(null);

  // Configurar header com nome e status online
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerStatus}>
            {isTyping ? 'digitando...' : statusText}
          </Text>
        </View>
      ),
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
    });
  }, [navigation, name, statusText, isTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await send(text);
      } catch (error) {
        console.error('Erro ao enviar:', error);
      }
    },
    [send]
  );

  const renderMessage = useCallback(
    ({ item }: { item: CometChat.BaseMessage }) => {
      const isMine = item.getSender().getUid() === myUID;
      const text =
        item instanceof CometChat.TextMessage ? item.getText() : '[Mídia]';

      return (
        <MessageBubble
          message={text}
          timestamp={item.getSentAt()}
          isMine={isMine}
          senderName={!isMine ? item.getSender().getName() : undefined}
        />
      );
    },
    [myUID]
  );

  if (loading) {
    return <LoadingSpinner message="Carregando mensagens..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.getId().toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👋</Text>
              <Text style={styles.emptyText}>
                Diga oi para {name}!
              </Text>
            </View>
          }
        />

        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundChat,
  },
  flex: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  messagesList: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
