import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSettings } from '../context/SettingsContext';
import useTheme from '../hooks/useTheme';
import MessageBubble from '../components/MessageBubble';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatSettings'>;

export default function ChatSettingsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const {
    textSize, setTextSize,
    bubbleRadius, setBubbleRadius,
    chatListView, setChatListView,
    animationsEnabled, setAnimationsEnabled,
    internalBrowser, setInternalBrowser,
    raiseToListen, setRaiseToListen,
    pauseOnRecording, setPauseOnRecording,
    sendWithEnter, setSendWithEnter,
    distanceUnit, setDistanceUnit,
    toggleTheme,
  } = useSettings();

  const [activeThemeId, setActiveThemeId] = useState('default');

  const THEMES = [
    { id: 'cyan', color: '#0088cc', label: 'Cyan' },
    { id: 'purple', color: '#8e85ee', label: 'Purple' },
    { id: 'mint', color: '#4fdca5', label: 'Mint' },
    { id: 'orange', color: '#f27a21', label: 'Orange' },
    { id: 'dark', color: '#1e1e1e', label: 'Dark' },
    { id: 'pink', color: '#e0549c', label: 'Pink' },
  ];

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Configurações de Chats</Text>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* CHAT PREVIEW - AGORA NO TOPO */}
      <View style={[styles.previewContainer, { backgroundColor: isDark ? '#1c2431' : '#d6e8c4' }]}>
        <Image 
          source={require('../../assets/chat_bg_doodle.png')} 
          style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.9 : 1.0 }]} 
          resizeMode="repeat"
        />
        <View style={[styles.previewMessageWrap, { padding: 16 }]}>
          <MessageBubble
            message={"Bom dia! 👋\nVocê sabe que horas são?"}
            timestamp={Date.now() / 1000 - 3600}
            isMine={false}
            senderName="D H"
          />
          <MessageBubble
            message="É manhã em Tóquio 😎"
            timestamp={Date.now() / 1000}
            isMine={true}
            status="read"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
        {/* TEXT SIZE SECTION */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {renderSectionHeader('Tamanho do texto das mensagens')}
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={30}
              step={1}
              value={textSize}
              onValueChange={setTextSize}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.separator}
              thumbTintColor={colors.primary}
            />
            <Text style={[styles.sliderValue, { color: colors.textPrimary }]}>{textSize}</Text>
          </View>

          <View style={styles.actionRows}>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Alterar Papel de Parede</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
              <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Trocar Cor do Nome</Text>
              <View style={[styles.colorBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.colorBadgeText}>D</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* THEMES SECTION */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {renderSectionHeader('Tema de cores')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themesList}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.themeItem,
                  { backgroundColor: t.color },
                  activeThemeId === t.id && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setActiveThemeId(t.id)}
              >
                {/* Mini bubbles inside theme card to match the requested model */}
                <View style={styles.miniBubbleTheirs} />
                <View style={styles.miniBubbleMine} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actionRows}>
             <TouchableOpacity style={styles.actionRow} onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                Trocar para Modo {isDark ? 'Claro' : 'Escuro'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <TouchableOpacity style={styles.actionRow}>
              <Ionicons name="brush-outline" size={22} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Explorar Temas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCE SECTION */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <PreferenceRow 
            icon="moon-outline" 
            label="Modo Noturno Automático" 
            value={false} 
            subtitle="Desativado"
          />
          <PreferenceRow 
            icon="globe-outline" 
            label="Navegador Interno" 
            value={internalBrowser} 
            subtitle="Abrir links externos dentro do app"
            onToggle={setInternalBrowser}
          />
          <PreferenceRow 
            icon="play-circle-outline" 
            label="Animações" 
            value={animationsEnabled} 
            subtitle="Ajuste efeitos para economizar energia"
            onToggle={setAnimationsEnabled}
          />
          <TouchableOpacity style={styles.actionRowFull}>
             <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
             <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabelMain, { color: colors.textPrimary }]}>Stickers e Emojis</Text>
                <Text style={styles.actionSublabel}>Gerencie stickers, emojis e reações</Text>
             </View>
          </TouchableOpacity>
        </View>

        {/* MEDIA AND SOUNDS SECTION */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
           <Text style={[styles.sectionTitleSmall, { color: colors.primary }]}>Mídias e Sons</Text>
           <PreferenceRow label="Toque para ver a próxima mídia" value={true} isSubtle subtitle="Toque perto da borda para navegar" />
           <PreferenceRow label="Levantar Para Ouvir" value={raiseToListen} onToggle={setRaiseToListen} isSubtle subtitle="O som muda para o auricular ao levar ao ouvido" />
           <PreferenceRow label="Levantar para Falar" value={false} isSubtle subtitle="Grava mensagens de voz ao levar o telefone ao ouvido" />
           <PreferenceRow label="Pausar música durante a gravação" value={pauseOnRecording} onToggle={setPauseOnRecording} isSubtle subtitle="Pausa música ao iniciar gravação" />
        </View>

        {/* OTHER SETTINGS */}
        <View style={[styles.card, { backgroundColor: colors.surface, marginBottom: 40 }]}>
           <Text style={[styles.sectionTitleSmall, { color: colors.primary }]}>Outras Configurações</Text>
           <PreferenceRow label="Compartilhamento Direto" value={true} isSubtle subtitle="Mostra chats recentes no menu compartilhar" />
           <PreferenceRow label="Mostrar Conteúdo +18" value={false} isSubtle subtitle="Não ocultar mídias (+18)" />
           <PreferenceRow label="Enviar com Enter" value={sendWithEnter} onToggle={setSendWithEnter} isSubtle />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({ 
  icon, 
  label, 
  subtitle, 
  value, 
  onToggle, 
  isSubtle = false,
  isLink = false,
  valueLabel = ''
}: any) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.prefRow}>
       <View style={styles.prefLeft}>
          {icon && <Ionicons name={icon} size={22} color={colors.textSecondary} style={styles.prefIcon} />}
          <View style={styles.prefTextWrap}>
             <Text style={[isSubtle ? styles.prefLabelSubtle : styles.actionLabelMain, { color: colors.textPrimary }]}>{label}</Text>
             {subtitle && <Text style={styles.actionSublabel}>{subtitle}</Text>}
          </View>
       </View>
       {isLink ? (
         <Text style={[styles.prefValueLink, { color: colors.primary }]}>{valueLabel}</Text>
       ) : (
         <Switch 
           value={value} 
           onValueChange={onToggle}
           thumbColor={Platform.OS === 'android' ? (value ? colors.primary : '#ccc') : undefined}
           trackColor={{ true: colors.primary + '80', false: '#ccc' }}
         />
       )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 56,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  menuBtn: {
    padding: 8,
  },
  scrollInside: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    width: '100%',
    padding: 0,
    minHeight: 180,
    justifyContent: 'center',
    position: 'relative',
  },
  previewMessageWrap: {
    paddingVertical: 10,
  },
  actionRows: {
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    marginLeft: 40,
  },
  colorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themesList: {
    paddingVertical: 8,
  },
  themeItem: {
    width: 65,
    height: 95,
    borderRadius: 10,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 10,
    justifyContent: 'flex-start',
  },
  miniBubbleTheirs: {
    width: 28,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  miniBubbleMine: {
    width: 28,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 'auto',
    marginBottom: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  prefLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  prefIcon: {
    marginRight: 16,
  },
  prefTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  actionLabelMain: {
    fontSize: 16,
    fontWeight: '500',
  },
  prefLabelSubtle: {
    fontSize: 16,
    fontWeight: '400',
  },
  actionSublabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  actionTextWrap: {
    marginLeft: 16,
    flex: 1,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  prefValueLink: {
    fontSize: 16,
    fontWeight: '500',
  }
});
