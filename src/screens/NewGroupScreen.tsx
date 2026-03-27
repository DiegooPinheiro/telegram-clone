import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';
import useTheme from '../hooks/useTheme';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { chatSyncContacts, chatCreateGroup } from '../services/chatApi';
import { getChatSession } from '../services/chatSession';
import { cloudinaryUpload } from '../services/cloudinaryService';
import type { ChatApiUser } from '../types/chatApi';
import { spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'NewGroup'>;

export default function NewGroupScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Members, 2: Name & Create
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState<ChatApiUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão Necessária', 'Precisamos de acesso às suas fotos para alterar a imagem do grupo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      
      setIsUploading(true);
      try {
        const uploadResult = await cloudinaryUpload({
          uri: asset.uri,
          name: asset.fileName || 'group_avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
        setGroupAvatar(uploadResult.mediaUrl);
      } catch (error) {
        console.error('Erro no upload da imagem do grupo:', error);
        showAlert('Erro', 'Não foi possível fazer o upload da imagem.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const session = await getChatSession();
      if (session?.userId) setMyUserId(session.userId);

      let fetched: ChatApiUser[] = [];
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        const phones: string[] = [];
        data.forEach((contact) => {
          contact.phoneNumbers?.forEach((phone) => {
            if (phone.number) {
              const clean = phone.number.replace(/[^\d+]/g, '');
              if (clean.length < 8) return;
              phones.push(clean);
              if (clean.startsWith('+')) {
                phones.push(clean.substring(1));
              } else {
                if (clean.startsWith('0')) {
                  const noZero = clean.substring(1);
                  phones.push(`+55${noZero}`);
                } else if (!clean.startsWith('55')) {
                  phones.push(`+55${clean}`);
                }
              }
            }
          });
        });

        if (phones.length > 0) {
          const uniquePhones = Array.from(new Set(phones)).filter(p => !!p && p.length >= 8);
          fetched = await chatSyncContacts(uniquePhones);
        }
      }

      // Filtra o próprio usuário da lista de seleção
      setUsers(fetched.filter(u => u._id !== session?.userId));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => 
      (u.nome || '').toLowerCase().includes(q) || 
      (u.username || '').toLowerCase().includes(q)
    );
  }, [search, users]);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showAlert('Aviso', 'Por favor, informe um nome para o grupo.');
      return;
    }

    setCreating(true);
    try {
      const participantIds = Array.from(selectedIds);
      const conversation = await chatCreateGroup({
        groupName: groupName.trim(),
        groupAvatar: groupAvatar || '',
        participantIds,
      });

      // Navega para o chat recém criado
      navigation.replace('Chat', {
        conversationId: conversation._id,
        name: conversation.groupName || 'Grupo',
        avatar: conversation.groupAvatar || null,
        isGroup: true,
      });
    } catch (error: any) {
      let message = 'Não foi possível criar o grupo. Tente novamente.';
      if (error.message) message = error.message;
      showAlert('Erro', message);
    } finally {
      setCreating(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={[styles.searchWrap, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Quem você gostaria de adicionar?"
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item._id);
          return (
            <TouchableOpacity 
              style={styles.userRow} 
              activeOpacity={0.7} 
              onPress={() => toggleSelect(item._id)}
            >
              <Avatar uri={item.foto || null} name={item.nome || item.username} size={48} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>
                  {item.nome || item.username}
                </Text>
                <Text style={[styles.userStatus, { color: colors.textSecondary }]}>
                  visto recentemente
                </Text>
              </View>
              <View style={[
                styles.checkbox, 
                { borderColor: isSelected ? colors.primary : colors.separator },
                isSelected && { backgroundColor: colors.primary }
              ]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={{ color: colors.textSecondary }}>Nenhum contato disponível</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {selectedIds.size > 0 && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]}
          onPress={() => setStep(2)}
        >
          <Ionicons name="arrow-forward" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <View style={styles.step2Container}>
        <View style={styles.groupIconContainer}>
          <TouchableOpacity 
            style={[styles.groupIconPlaceholder, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handlePickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : groupAvatar ? (
              <Avatar uri={groupAvatar} name={groupName || 'G'} size={64} />
            ) : (
              <Ionicons name="camera" size={32} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.nameInputContainer}>
            <TextInput
              style={[styles.nameInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
              placeholder="Nome do grupo"
              placeholderTextColor={colors.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
          </View>
        </View>

        <Text style={[styles.membersCount, { color: colors.textSecondary }]}>
          {selectedIds.size} {selectedIds.size === 1 ? 'membro' : 'membros'} selecionados
        </Text>

        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.primary, opacity: creating ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={creating || isUploading}
        >
          {creating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>CRIAR GRUPO</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep(1)}
          disabled={creating}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Voltar para seleção</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        step === 1 ? renderStep1() : renderStep2()
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchWrap: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  step2Container: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  groupIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  groupIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInputContainer: {
    flex: 1,
    marginLeft: 20,
  },
  nameInput: {
    fontSize: 18,
    borderBottomWidth: 2,
    paddingVertical: 8,
  },
  membersCount: {
    fontSize: 14,
    marginBottom: 40,
  },
  createButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  backButton: {
    padding: 10,
  }
});
