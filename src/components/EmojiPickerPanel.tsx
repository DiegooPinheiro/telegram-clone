import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';

type EmojiTab = 'emoji' | 'gifs' | 'stickers';

type CategoryKey =
  | 'recent'
  | 'people'
  | 'nature'
  | 'food'
  | 'activity'
  | 'travel'
  | 'objects'
  | 'symbols';

export const DEFAULT_EMOJI_PANEL_HEIGHT = 332;
const RECENTS_KEY = '@emoji/recents_v1';
const MAX_RECENTS = 36;

type EmojiDS = {
  unified?: string;
  non_qualified?: string;
  short_name?: string;
  short_names?: string[];
  name?: string;
  category?: string;
  keywords?: string[];
  obsoleted_by?: string;
  has_img_apple?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EMOJI_DS: EmojiDS[] = require('emoji-datasource/emoji.json');

const unifiedToEmoji = (unified: string) => {
  try {
    const points = String(unified || '')
      .split('-')
      .map((p) => parseInt(p, 16))
      .filter((n) => Number.isFinite(n));
    // @ts-ignore
    return String.fromCodePoint(...points);
  } catch {
    return '';
  }
};

const mapCategory = (value: string | undefined): Exclude<CategoryKey, 'recent'> | null => {
  const v = String(value || '').toLowerCase();
  if (v.includes('people') || v.includes('smileys') || v.includes('body')) return 'people';
  if (v.includes('animals') || v.includes('nature')) return 'nature';
  if (v.includes('food') || v.includes('drink')) return 'food';
  if (v.includes('activity')) return 'activity';
  if (v.includes('travel') || v.includes('places')) return 'travel';
  if (v.includes('objects')) return 'objects';
  if (v.includes('symbols')) return 'symbols';
  return null;
};

const normalize = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const PT_BR_SEARCH_SYNONYMS: Array<[string[], string[]]> = [
  [['smile', 'smiley', 'grin', 'grinning', 'happy', 'joy', 'laugh', 'laughing'], ['sorriso', 'sorrindo', 'feliz', 'alegre', 'risada', 'rindo']],
  [['sad', 'cry', 'crying', 'tears', 'sob'], ['triste', 'chorando', 'choro', 'lagrimas']],
  [['angry', 'mad', 'rage'], ['bravo', 'raiva', 'irritado']],
  [['love', 'heart', 'kiss', 'romance'], ['amor', 'coracao', 'beijo', 'romance', 'apaixonado']],
  [['thumbsup', '+1', 'like', 'approve', 'ok_hand'], ['joinha', 'curtir', 'aprovado', 'ok']],
  [['fire', 'flame'], ['fogo', 'chama']],
  [['party', 'birthday', 'tada', 'celebration'], ['festa', 'aniversario', 'celebracao', 'comemoracao']],
  [['car', 'automobile', 'taxi', 'bus'], ['carro', 'automovel', 'taxi', 'onibus']],
  [['dog', 'cat', 'animal', 'paw'], ['cachorro', 'cao', 'gato', 'animal', 'pata']],
  [['food', 'drink', 'pizza', 'burger', 'coffee'], ['comida', 'bebida', 'pizza', 'hamburguer', 'cafe']],
  [['soccer', 'football', 'sport', 'ball'], ['futebol', 'esporte', 'bola']],
  [['tree', 'flower', 'leaf', 'nature'], ['arvore', 'flor', 'folha', 'natureza']],
  [['phone', 'mobile', 'computer', 'bulb'], ['telefone', 'celular', 'computador', 'lampada']],
  [['flag', 'symbol', 'sign'], ['bandeira', 'simbolo', 'sinal']],
];

const expandPortugueseSynonyms = (tokens: string[]) => {
  const expanded = new Set(tokens);

  for (const [matchers, additions] of PT_BR_SEARCH_SYNONYMS) {
    if (tokens.some((token) => matchers.some((matcher) => token.includes(matcher)))) {
      additions.forEach((addition) => expanded.add(addition));
    }
  }

  return Array.from(expanded);
};

const buildCatalog = () => {
  const byCategory: Record<Exclude<CategoryKey, 'recent'>, string[]> = {
    people: [],
    nature: [],
    food: [],
    activity: [],
    travel: [],
    objects: [],
    symbols: [],
  };

  const searchable = new Map<string, string>();

  for (const row of EMOJI_DS) {
    if (row?.obsoleted_by) continue;
    if (row?.has_img_apple === false) continue;

    const cat = mapCategory(row.category);
    if (!cat) continue;

    const unified = row.unified || row.non_qualified;
    if (!unified) continue;

    const emoji = unifiedToEmoji(unified);
    if (!emoji) continue;

    byCategory[cat].push(emoji);

    const tokens = expandPortugueseSynonyms([
      ...(row.keywords || []),
      ...(row.short_names || []),
      row.short_name || '',
      row.name || '',
    ]
      .map((t) => normalize(String(t || '')))
      .filter(Boolean));

    const categoryHints: Record<Exclude<CategoryKey, 'recent'>, string[]> = {
      people: ['pessoa', 'pessoas', 'rosto', 'emoji'],
      nature: ['natureza', 'animal', 'animais'],
      food: ['comida', 'bebida'],
      activity: ['atividade', 'atividades', 'esporte'],
      travel: ['viagem', 'transporte', 'lugares'],
      objects: ['objeto', 'objetos'],
      symbols: ['simbolo', 'simbolos'],
    };

    categoryHints[cat].forEach((hint) => tokens.push(hint));

    searchable.set(emoji, Array.from(new Set(tokens)).join(' '));
  }

  // Dedup mantendo ordem
  for (const k of Object.keys(byCategory) as Array<Exclude<CategoryKey, 'recent'>>) {
    byCategory[k] = Array.from(new Set(byCategory[k]));
  }

  return { byCategory, searchable };
};

const CATALOG = buildCatalog();

const CATEGORY_META: Array<{ key: CategoryKey; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { key: 'recent', icon: 'time-outline', label: 'Recentes' },
  { key: 'people', icon: 'happy-outline', label: 'Pessoas' },
  { key: 'nature', icon: 'paw-outline', label: 'Natureza' },
  { key: 'food', icon: 'pizza-outline', label: 'Comida' },
  { key: 'activity', icon: 'football-outline', label: 'Atividades' },
  { key: 'travel', icon: 'car-outline', label: 'Viagem' },
  { key: 'objects', icon: 'bulb-outline', label: 'Objetos' },
  { key: 'symbols', icon: 'at-outline', label: 'Símbolos' },
];

const withAlpha = (hex: string, alpha: string) => {
  if (!hex?.startsWith('#')) return hex;
  if (hex.length === 7) return `${hex}${alpha}`;
  return hex;
};

export default function EmojiPickerPanel(props: {
  visible: boolean;
  height?: number;
  fill?: boolean;
  keyboardHeight?: number;
  onSearchFocusChange?: (focused: boolean) => void;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}) {
  const { visible, height, fill, keyboardHeight = 0, onSearchFocusChange, onSelectEmoji, onClose } = props;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colors.background === '#0e1621';

  const heightAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [tab, setTab] = useState<EmojiTab>('emoji');
  const [category, setCategory] = useState<CategoryKey>('recent');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [tabsHidden, setTabsHidden] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecents(parsed.filter((v) => typeof v === 'string').slice(0, MAX_RECENTS));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fill) return;
    Animated.timing(heightAnim, {
      toValue: visible ? (height ?? DEFAULT_EMOJI_PANEL_HEIGHT) : 0,
      duration: visible ? 250 : 220,
      useNativeDriver: false,
    }).start();
  }, [visible, heightAnim, height, fill]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const nextHidden = value > 28;
      setTabsHidden((prev) => (prev === nextHidden ? prev : nextHidden));
    });
    return () => {
      scrollY.removeListener(id);
    };
  }, [scrollY]);

  const emojiPool = useMemo(() => {
    if (category === 'recent') {
      // Telegram-like: "Recentes" + sugestões para não ficar vazio.
      const base = recents.length ? recents : [];
      const filled = Array.from(new Set([...base, ...CATALOG.byCategory.people])).slice(0, 160);
      return filled;
    }
    return CATALOG.byCategory[category];
  }, [category, recents]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return emojiPool;

    const unique = Array.from(
      new Set([
        ...recents,
        ...CATALOG.byCategory.people,
        ...CATALOG.byCategory.nature,
        ...CATALOG.byCategory.food,
        ...CATALOG.byCategory.activity,
        ...CATALOG.byCategory.travel,
        ...CATALOG.byCategory.objects,
        ...CATALOG.byCategory.symbols,
      ])
    );

    return unique.filter((emoji) => {
      const tokens = CATALOG.searchable.get(emoji);
      if (!tokens) return false;
      return tokens.includes(q) || emoji.includes(q);
    });
  }, [emojiPool, search, recents]);

  const handlePick = async (emoji: string) => {
    onSelectEmoji(emoji);

    // Atualiza recents
    try {
      const next = [emoji, ...recents.filter((e) => e !== emoji)].slice(0, MAX_RECENTS);
      setRecents(next);
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const containerStyle = fill
    ? [styles.panelFill, { backgroundColor: colors.surface }]
    : [styles.panel, { height: heightAnim, backgroundColor: colors.surface }];
  useEffect(() => {
    onSearchFocusChange?.(searchFocused);
  }, [onSearchFocusChange, searchFocused]);

  const footerOpacity = scrollY.interpolate({
    inputRange: [0, 18, 32],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const footerTranslate = scrollY.interpolate({
    inputRange: [0, 18, 32],
    outputRange: [0, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={containerStyle}>
      <View style={[styles.topRow, { borderBottomColor: colors.separator }]}>
        <View style={styles.categoryRow}>
          {CATEGORY_META.map((c) => {
            const active = c.key === category;
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.categoryButton,
                  active ? { backgroundColor: colors.badgeUnread } : null,
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  setTab('emoji');
                  setCategory(c.key);
                }}
              >
                <Ionicons name={c.icon} size={20} color={active ? colors.textPrimary : colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar"
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCorrect={false}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </View>

      <View style={styles.content}>
        {tab !== 'emoji' ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              {tab === 'gifs' ? 'GIFs em breve' : 'Stickers em breve'}
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            numColumns={8}
            style={styles.emojiList}
            contentContainerStyle={[styles.emojiGrid, { paddingBottom: 92 + Math.max(0, insets.bottom) }]}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.emojiCell} activeOpacity={0.7} onPress={() => handlePick(item)}>
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        )}
      </View>

      <Animated.View
        pointerEvents={tabsHidden ? 'none' : 'auto'}
        style={[
          styles.floatingFooter,
          {
            bottom: Math.max(-34, (insets.bottom || 0) - 36),
            opacity: footerOpacity,
            transform: [{ translateY: footerTranslate }],
          },
        ]}
      >
        <View style={styles.floatingFooterRow}>
          <View
            style={[
              styles.tabPillsFloating,
              {
                backgroundColor: isDark
                  ? withAlpha(colors.backgroundSecondary, 'D9')
                  : 'rgba(255,255,255,0.86)',
                borderColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabPill,
                tab === 'emoji'
                  ? {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.98)',
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                    }
                  : null,
              ]}
              onPress={() => setTab('emoji')}
            >
              <Text style={[styles.tabText, { color: tab === 'emoji' ? colors.textPrimary : colors.textSecondary }]}>
                Emoji
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabPill,
                tab === 'gifs'
                  ? {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.98)',
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                    }
                  : null,
              ]}
              onPress={() => setTab('gifs')}
            >
              <Text style={[styles.tabText, { color: tab === 'gifs' ? colors.textPrimary : colors.textSecondary }]}>
                GIFs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabPill,
                tab === 'stickers'
                  ? {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.98)',
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                    }
                  : null,
              ]}
              onPress={() => setTab('stickers')}
            >
              <Text style={[styles.tabText, { color: tab === 'stickers' ? colors.textPrimary : colors.textSecondary }]}>
                Stickers
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    overflow: 'hidden',
  },
  panelFill: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 6,
    minHeight: 0,
  },
  emojiList: {
    flex: 1,
    minHeight: 0,
  },
  emojiGrid: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  emojiCell: {
    width: `${100 / 8}%`,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  floatingFooterRow: {
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPillsFloating: {
    height: 42,
    borderRadius: 22,
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    width: 290,
    maxWidth: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  tabPill: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
