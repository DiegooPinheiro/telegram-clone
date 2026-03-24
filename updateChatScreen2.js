const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/screens/ChatScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Replace Empty State ListEmptyComponent block
// Safely replace from "ListEmptyComponent={" up to "} />"
content = content.replace(
  /ListEmptyComponent=\{[\s\S]*?\}\s*\/>/,
  `ListEmptyComponent={
              !loading && messages.length === 0 ? (
                <View style={styles.emptyContainerCenter}>
                  <View style={[styles.emptyChatCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                    <Text style={[styles.emptyChatTitle, { color: colors.textPrimary }]}>Ainda não há mensagens aqui...</Text>
                    <Text style={[styles.emptyChatSubtitle, { color: colors.textSecondary }]}>
                      Envie uma mensagem ou toque no aceno abaixo.
                    </Text>
                    <Text style={styles.emptyChatSticker}>👋🐻</Text>
                  </View>
                </View>
              ) : null
            }
          />`
);

// 2. Replace the 3 Dots Menu Modal internals
// Safely replace from "<View style={[styles.menuCard" to the end of that Modal
content = content.replace(
  /<View style={\[styles\.menuCard[\s\S]*?<\/View>\s*<\/Pressable>\s*<\/Modal>/,
  `<View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); Alert.alert('Ativar som', 'Em breve.'); }}>
              <Ionicons name="volume-mute-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Ativar som</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); Alert.alert('Videochamada', 'Em breve.'); }}>
              <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Videochamada</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); Alert.alert('Buscar', 'Em breve.'); }}>
              <Ionicons name="search-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Buscar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); Alert.alert('Papel de Parede', 'Em breve.'); }}>
              <Ionicons name="image-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Trocar Papel de Parede</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); Alert.alert('Limpar Histórico', 'Em breve.'); }}>
              <Ionicons name="brush-outline" size={24} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Limpar Histórico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setHeaderMenuVisible(false); handleDeleteConversation(); }}>
              <Ionicons name="trash-outline" size={24} color="#ff3b30" />
              <Text style={[styles.menuText, { color: '#ff3b30' }]}>Apagar Chat</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      </Modal>`
);

// 3. Inject new styles before datePill
content = content.replace(
  /datePill:\s*\{/,
  `emptyContainerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '65%',
  },
  emptyChatCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyChatSticker: {
    fontSize: 72,
    textAlign: 'center',
  },
  datePill: {`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ChatScreen.tsx via REGEX');
