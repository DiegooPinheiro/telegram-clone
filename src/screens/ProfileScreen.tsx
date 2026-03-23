import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from "../navigation/types";
import { getUserProfile } from "../services/authService";
import Avatar from "../components/Avatar";
import LoadingSpinner from "../components/LoadingSpinner";
import { UserProfile } from "../types/user";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";
import { useSettings } from "../context/SettingsContext";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { uid: currentUserId, displayName: authName, photoURL: authPhoto } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { setMenuVisible } = useSettings();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadProfile = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserProfile(currentUserId);
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  const displayName = profile?.displayName?.trim() || authName || "Sem Nome";
  const photo = profile?.photoURL || authPhoto || null;
  const username = profile?.username?.trim() ? `@${profile.username}` : "@username";
  const phone = profile?.phone?.trim() || "Adicionar Celular";
  const birthday = profile?.birthday?.trim() || "Adicionar Aniversário";

  const surfaceColor = isDark ? "#1C1C1D" : colors.surface;
  const backgroundColor = isDark ? "#000000" : colors.background;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.topBarButton}>
          <Ionicons name="qr-code-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.profileHeader}>
          <Avatar
            uri={photo}
            name={displayName}
            size={90}
            online={false}
          />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.status, { color: colors.textSecondary }]}>online</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: surfaceColor }]} 
            onPress={() => navigation.navigate("EditProfile")}
          >
            <MaterialIcons name="add-a-photo" size={22} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Definir Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: surfaceColor }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <MaterialIcons name="edit" size={22} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Editar Informações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: surfaceColor }]}
            onPress={() => navigation.navigate("Settings")}
          >
            <MaterialIcons name="settings" size={22} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Configurações</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{phone}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Celular</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{username}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nome de Usuário</Text>
          </View>

          <View style={[styles.infoBlock, { marginBottom: 0 }]}>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{birthday}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Aniversário</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tabsBackground, { backgroundColor: surfaceColor }]}>
            <TouchableOpacity style={[styles.tab, { backgroundColor: isDark ? "#33435C" : "#E5E5EA" }]}>
              <Text style={[styles.tabTextActive, { color: isDark ? "#8aa4ff" : colors.primary }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={[styles.tabTextInactive, { color: colors.textSecondary }]}>Posts Arquivados</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhum post ainda...</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Publique fotos e vídeos para mostrar na sua página de perfil
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.fabContainer, { bottom: insets.bottom + 82 }]}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Ionicons
            name="camera"
            size={20}
            color="#FFF"
            style={styles.fabIcon}
          />
          <Text style={styles.fabText}>Adicione um post</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 16,
  },
  topBarButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  infoCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoBlock: {
    marginBottom: 16,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  tabsContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  tabsBackground: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextInactive: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 24,
  },
  fab: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabIcon: {
    marginRight: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
