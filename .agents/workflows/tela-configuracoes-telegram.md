---
description: Como criar a tela de Configurações (Settings Screen) estilo Telegram
---

# Criar a Tela de Configurações do Telegram Clone

Este workflow descreve como implementar a interface de Configurações (SettingsScreen) exatamente igual à do Telegram, com o cabeçalho de perfil centralizado, grupos de configuração bem definidos, ícones coloridos com bordas arredondadas e divisores corretos.

## 1. Instalar dependências de ícones

Certifique-se de que o `@expo/vector-icons` está instalado (já incluso por padrão no Expo).

## 2. Implementar o `SettingsScreen.tsx`

Crie ou substitua o arquivo `src/screens/SettingsScreen.tsx` pelo código abaixo. Ele já inclui a lógica de logout (via Firebase e CometChat) e a estilização em Dark Mode nativa do Telegram.

```tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { spacing } from "../theme/spacing";
import useAuth from "../hooks/useAuth";
import { signOut } from "../services/authService";
import { logoutCometChat } from "../services/cometChatService";
import Avatar from "../components/Avatar";
import { useSettings } from "../context/SettingsContext";
import useTheme from "../hooks/useTheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { displayName, email, photoURL } = useAuth();
  const { theme, toggleTheme, language } = useSettings();
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutCometChat();
            await signOut();
          } catch (error: any) {
            Alert.alert("Erro", error.message || "Erro ao sair");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: "#000000" }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Perfil Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={styles.avatarContainer}>
            <Avatar uri={photoURL} name={displayName || "User"} size={80} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerName}>{displayName || "Usuário"}</Text>
          <Text style={styles.headerPhone}>
            +55 (XX) XXXXX-XXXX • @username
          </Text>
        </View>

        {/* Grupo 1: Configurações Principais */}
        <View style={styles.section}>
          <SettingRow
            iconName="person"
            iconBgColor="#2A85FF"
            label="Conta"
            subtitle="Número, Nome de Usuário, Bio"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingRow
            iconName="chatbubble"
            iconBgColor="#F7931A"
            label="Configurações de Chat"
            subtitle="Papel de Parede, Modo Noturno, Animações"
            onPress={() => {}}
          />
          <SettingRow
            iconName="lock-closed"
            iconBgColor="#34C759"
            label="Privacidade e Segurança"
            subtitle="Visto por Último, Dispositivos, Chaves de Acesso"
            onPress={() => navigation.navigate("Privacy")}
          />
          <SettingRow
            iconName="notifications"
            iconBgColor="#FF3B30"
            label="Notificações"
            subtitle="Sons, Chamadas, Contadores"
            onPress={() => navigation.navigate("Notifications")}
          />
          <SettingRow
            iconName="pie-chart"
            iconBgColor="#5856D6"
            label="Dados e Armazenamento"
            subtitle="Opções de download de mídia"
            onPress={() => navigation.navigate("DataStorage")}
          />
          <SettingRow
            iconName="folder"
            iconBgColor="#007AFF"
            label="Pastas de Chat"
            subtitle="Organizar chats em pastas"
            onPress={() => {}}
          />
          <SettingRow
            iconName="laptop-outline"
            iconBgColor="#64D2FF"
            label="Dispositivos"
            subtitle="Gerenciar dispositivos conectados"
            onPress={() => {}}
          />
          <SettingRow
            iconName="battery-half"
            iconBgColor="#FF9500"
            label="Economia de Energia"
            subtitle="Reduz uso de energia quando a carga está baixa"
            onPress={() => {}}
          />
          <SettingRow
            iconName="globe-outline"
            iconBgColor="#AF52DE"
            label="Idioma"
            subtitle={language === "pt" ? "Português (Brasil)" : "English"}
            onPress={() => {}}
            isLast
          />
        </View>

        {/* Grupo 2: Serviços Extras */}
        <View style={styles.section}>
          <SettingRow
            iconName="star"
            iconBgColor="#AF52DE"
            label="Telegram Premium"
            onPress={() => {}}
          />
          <SettingRow
            iconName="star"
            iconBgColor="#FF9500"
            label="Estrelas do Telegram"
            rightBadge="1"
            onPress={() => {}}
          />
          <SettingRow
            iconName="wallet"
            iconBgColor="#007AFF"
            label="Carteira"
            onPress={() => {}}
          />
          <SettingRow
            iconType="MaterialCommunityIcons"
            iconName="storefront"
            iconBgColor="#FF3B30"
            label="Telegram Business"
            onPress={() => {}}
          />
          <SettingRow
            iconName="exit-outline"
            iconBgColor="#FF3B30"
            label="Sair da Conta"
            onPress={handleLogout}
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  iconName,
  iconType = "Ionicons",
  iconBgColor,
  label,
  subtitle,
  rightBadge,
  onPress,
  isLast = false,
}: {
  iconName: string;
  iconType?: "Ionicons" | "MaterialCommunityIcons";
  iconBgColor: string;
  label: string;
  subtitle?: string;
  rightBadge?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={settingStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={settingStyles.row}>
        <View
          style={[
            settingStyles.iconContainer,
            { backgroundColor: iconBgColor },
          ]}
        >
          {iconType === "Ionicons" ? (
            <Ionicons name={iconName as any} size={18} color="#FFF" />
          ) : (
            <MaterialCommunityIcons
              name={iconName as any}
              size={18}
              color="#FFF"
            />
          )}
        </View>
        <View style={settingStyles.content}>
          <Text style={settingStyles.label}>{label}</Text>
          {subtitle && (
            <Text style={settingStyles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightBadge && (
          <Text style={settingStyles.badgeText}>{rightBadge}</Text>
        )}
      </View>
      {!isLast && <View style={settingStyles.divider} />}
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1C1C1D",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  badgeText: {
    color: "#0A84FF",
    fontSize: 16,
    paddingHorizontal: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
    marginLeft: 62,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#5E5CE6",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  headerName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerPhone: {
    fontSize: 14,
    color: "#8E8E93",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1C1C1D",
  },
});
```

A estrutura chave aqui é o `SettingRow` customizado que simula com exatidão as abas de item dentro do Telegram (ícone esquerdo com cor de fundo, título, subtítulo em cinza, sem divisória no último item, bordas arredondadas no container).
