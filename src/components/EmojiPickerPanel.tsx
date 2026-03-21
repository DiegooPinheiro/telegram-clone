import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
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

    const tokens = [
      ...(row.keywords || []),
      ...(row.short_names || []),
      row.short_name || '',
      row.name || '',
    ]
      .map((t) => String(t || '').toLowerCase())
      .filter(Boolean)
      .join(' ');

    searchable.set(emoji, tokens);
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

const normalize = (value: string) => (value || '').trim().toLowerCase();

export default function EmojiPickerPanel(props: {
  visible: boolean;
  height?: number;
  fill?: boolean;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}) {
  const { visible, height, fill, onSelectEmoji, onClose } = props;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const heightAnim = useRef(new Animated.Value(0)).current;
  const [tab, setTab] = useState<EmojiTab>('emoji');
  const [category, setCategory] = useState<CategoryKey>('recent');
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>([]);

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
      return tokens.includes(q);
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

        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
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
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            numColumns={8}
            style={styles.emojiList}
            contentContainerStyle={[styles.emojiGrid, { paddingBottom: 8 }]}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.emojiCell} activeOpacity={0.7} onPress={() => handlePick(item)}>
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <View style={[styles.bottomTabs, { borderTopColor: colors.separator, paddingBottom: insets.bottom }]}>
        <View style={[styles.tabPills, { backgroundColor: colors.backgroundSecondary }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabPill, tab === 'emoji' ? { backgroundColor: colors.surface } : null]}
            onPress={() => setTab('emoji')}
          >
            <Text style={[styles.tabText, { color: tab === 'emoji' ? colors.textPrimary : colors.textSecondary }]}>
              Emoji
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabPill, tab === 'gifs' ? { backgroundColor: colors.surface } : null]}
            onPress={() => setTab('gifs')}
          >
            <Text style={[styles.tabText, { color: tab === 'gifs' ? colors.textPrimary : colors.textSecondary }]}>
              GIFs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabPill, tab === 'stickers' ? { backgroundColor: colors.surface } : null]}
            onPress={() => setTab('stickers')}
          >
            <Text style={[styles.tabText, { color: tab === 'stickers' ? colors.textPrimary : colors.textSecondary }]}>
              Stickers
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  closeButton: {
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
  bottomTabs: {
    paddingTop: 8,
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabPills: {
    height: 38,
    borderRadius: 20,
    flexDirection: 'row',
    padding: 4,
    gap: 6,
  },
  tabPill: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
