const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'src/screens/ChatScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

const emptyOriginal = `            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.datePill}>
                  <Text style={[styles.datePillText, { color: colors.textOnPrimary }]}>Sem mensagens ainda</Text>
                </View>
              </View>
            }`;

const emptyNew = `            ListEmptyComponent={
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
            }`;

content = content.replace(emptyOriginal, emptyNew);
content = content.replace(emptyOriginal.replace(/\n/g, '\r\n'), emptyNew);

const menuOriginal = `      <Modal transparent visible={headerMenuVisible} animationType="fade" onRequestClose={() => setHeaderMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setHeaderMenuVisible(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.separator }]}
              activeOpacity={0.75}
              onPress={() => {
                setHeaderMenuVisible(false);
                handleDeleteConversation();
              }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Excluir conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.75}
              onPress={() => setHeaderMenuVisible(false)}
            >
              <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>`;

const menuNew = `      <Modal transparent visible={headerMenuVisible} animationType="fade" onRequestClose={() => setHeaderMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setHeaderMenuVisible(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
            
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
      </Modal>`;

content = content.replace(menuOriginal, menuNew);
content = content.replace(menuOriginal.replace(/\n/g, '\r\n'), menuNew);

const styleOriginal = `  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  datePill: {`;

const styleNew = `  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  emptyContainerCenter: {
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
  datePill: {`;

content = content.replace(styleOriginal, styleNew);
content = content.replace(styleOriginal.replace(/\n/g, '\r\n'), styleNew);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ChatScreen.tsx');
