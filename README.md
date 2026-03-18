# 📱 Telegram Clone (Expo + Firebase + Custom Chat API)

Um clone moderno e funcional do Telegram, construído com **React Native (Expo)**. Este projeto utiliza uma arquitetura híbrida de alto desempenho, combinando o poder do **Firebase** para autenticação e perfis com uma **API de Chat Customizada** em Node.js para mensagens em tempo real via WebSockets.

---

## 🚀 Novidades da Versão 2.0

- **Remoção do CometChat**: Migração completa para uma infraestrutura própria e independente.
- **Sincronização de Agenda**: O app lê os contatos do seu celular e identifica automaticamente quem já tem o app instalado via Firestore.
- **Notificações Estilo Telegram**: Novo sistema de *Toasts* in-app com foto do remetente, nome e prévia da mensagem, permitindo navegação direta para o chat.
- **Resiliência de Sessão**: Correção de condições de corrida (race conditions) no login para garantir que o chat conecte instantaneamente ao abrir o app.

---

## 🛠️ Tecnologias e Arquitetura

### Frontend (Mobile)
- **Expo / React Native**: Base do aplicativo.
- **React Navigation**: Navegação por abas e pilhas (Stack & Tabs).
- **Socket.IO Client**: Comunicação bidirecional e instantânea.
- **Expo Contacts**: Integração com a agenda nativa do dispositivo.
- **TypeScript**: Tipagem estática para maior segurança no desenvolvimento.

### Backend & Serviços
- **Firebase Auth**: Autenticação segura por E-mail/Senha.
- **Firebase Firestore**: Armazenamento de perfis, bio, status online e busca rápida de UIDs por telefone.
- **Custom Chat API (Node.js/Express)**: Gerenciamento de conversas, histórico de mensagens e tokens JWT.
- **MongoDB**: Banco de dados persistente para as mensagens da Chat API.
- **Socket.IO Server**: Engine de tempo real hospedada no Render.com.

---

## 📁 Estrutura de Pastas (Principais)

```bash
src/
 ├── components/       # Componentes reutilizáveis (Avatar, MessageToast, ChatItem)
 ├── screens/          # Telas principais (Chats, Contatos, Configurações)
 ├── services/         # Integrações (chatApi, chatSocket, authService, contactSync)
 ├── config/           # Configurações de Firebase e Chat API
 ├── hooks/            # Hooks customizados (useTheme, useAuth)
 ├── navigation/       # Configuração de rotas e navigators
 └── types/            # Definições de tipos TypeScript
```

---

## ⚙️ Configuração do Ambiente

### 1. Clonar e Instalar
```bash
npm install
```

### 2. Variáveis de Ambiente (.env)
Crie um arquivo `.env` na raiz (baseado no `.env.example`) com as seguintes chaves:

#### Firebase Config
Obtenha estas chaves no Console do Firebase:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

#### Chat API Config
- `EXPO_PUBLIC_CHAT_API_URL`: URL do seu servidor backend (ex: `https://sua-api.onrender.com/api`)

---

## 🔄 Fluxo de Funcionamento

1. **Autenticação Dupla**: Ao fazer login no Firebase, o app autentica automaticamente na Chat API usando as mesmas credenciais, gerando um token JWT persistente.
2. **Sincronização de Contatos**: O app solicita permissão para ler a agenda. Ele normaliza os números de telefone e consulta no Firestore quais usuários correspondem àqueles números, os adicionando à lista de contatos.
3. **Tempo Real**: O Socket.io conecta assim que a sessão é validada. Se uma mensagem chega e o usuário não está no chat aberto, um **MessageToast** customizado aparece no topo.

---

## ⚠️ Dúvidas Comuns e Troubleshooting

- **"Sessão Ausente" ou Loading Infinito**: O app agora possui um mecanismo de *retry* que aguarda o token ser salvo no dispositivo antes de liberar a tela principal. Se persistir, tente sair e entrar novamente na conta.
- **ERRO 404 na API**: Certifique-se de que a `EXPO_PUBLIC_CHAT_API_URL` contenha o sufixo `/api` caso o seu backend utilize este prefixo de rotas.
- **Delay no Render**: Como o backend gratuito do Render "dorme", a primeira mensagem ou o primeiro login do dia pode demorar até 50 segundos para responder.

---

## 📄 Licença
Projeto desenvolvido para fins educacionais e portfólio. Inspirado na interface oficial do Telegram.
