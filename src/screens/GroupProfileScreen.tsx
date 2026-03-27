import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import { chatGetConversationById, chatDeleteConversation } from '../services/chatApi';
import type { ChatApiConversation, ChatApiUser } from '../types/chatApi';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupProfile'>;

const { width } = Dimensions.get('window');

export default function GroupProfileScreen({ navigation, route }: Props) {
  const { conversationId, name, avatar } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [conversation, setConversation] = useState<ChatApiConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Membros');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await chatGetConversationById(conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Erro ao carregar perfil do grupo:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do grupo.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLeaveGroup = () => {
    Alert.alert(
      'Sair do Grupo',
      'Tem certeza de que deseja sair deste grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await chatDeleteConversation(conversationId);
              navigation.popToTop();
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível sair do grupo agora.');
            }
          }
        }
      ]
    );
  };

  const tabs = ['Membros', 'Mídias', 'Arquivos', 'Links', 'Músicas', 'Voz'];

  const renderMember = ({ item }: { item: ChatApiUser }) => (
    <TouchableOpacity style={styles.memberRow} activeOpacity={0.7}>
      <Avatar uri={item.foto || null} name={item.nome || item.username} size={44} />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.textPrimary }]}>
          {item.nome || item.username}
        </Text>
        <Text style={[styles.memberStatus, { color: colors.textSecondary }]}>
          visto recentemente
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <Avatar uri={avatar || null} name={name} size={100} />
          <Text style={[styles.groupName, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {conversation?.participants?.length || 0} membros, {loading ? '...' : '0'} online
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              navigation.navigate('Chat', {
                conversationId,
                name,
                avatar,
                isGroup: true
              });
            }}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubble" size={22} color={colors.textPrimary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Mensagem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Silenciar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleLeaveGroup}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
            </View>
            <Text style={[styles.actionLabel, { color: "#ff3b30" }]}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs Bar */}
        <View style={[styles.tabsWrapper, { backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabItem,
                  activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.textSecondary },
                  activeTab === tab && { fontWeight: '700' }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : activeTab === 'Membros' ? (
            <View style={styles.membersList}>
              {conversation?.participants?.map(user => (
                <View key={user._id}>
                  {renderMember({ item: user })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: colors.textSecondary }}>Nada por aqui ainda.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerIconButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  statsText: {
    fontSize: 15,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 20,
  },
  actionButton: {
    width: (width - 64) / 3,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsWrapper: {
    paddingTop: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    minHeight: 400,
  },
  membersList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberInfo: {
    marginLeft: 14,
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600',
  },
  memberStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  }
});
