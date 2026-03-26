# 📱 Vibe (Expo + Firebase + Custom Chat API)

Um aplicativo de mensagens moderno e funcional, construído com **React Native (Expo)**. Este projeto utiliza uma arquitetura híbrida de alto desempenho, combinando o poder do **Firebase** para autenticação e perfis com uma **API de Chat Customizada** em Node.js para mensagens em tempo real via WebSockets.

---

## 🚀 Novidades da Versão 2.1 (Segurança & UX)

- **Criptografia AES-256**: Todas as mensagens são criptografadas em repouso no banco de dados.
- **Sanitização de Conteúdo**: Filtro automático contra scripts maliciosos (XSS) em todas as mensagens.
- **Recuperação de Conta**: Nova funcionalidade "Esqueci minha senha" na tela de login via Firebase.
- **Auditoria de Segurança**: Logs detalhados de ações importantes (deletar para todos, logins, edições).
- **Mídia Segura**: Configuração do Cloudinary migrada 100% para variáveis de ambiente.
- **Remoção do CometChat**: Migração completa para uma infraestrutura própria e independente.
- **Sincronização de Agenda**: Identificação automática de contatos que possuem o app.
- **Notificações Estilo Telegram**: Sistema de *Toasts* in-app com navegação direta para o chat.

---

## 🛠️ Tecnologias e Arquitetura

### Frontend (Mobile)
- **Expo / React Native**: Base do aplicativo.
- **Firebase SDK**: Autenticação e Firestore.
- **Socket.IO Client**: Comunicação em tempo real.
- **TypeScript**: Segurança e produtividade.

### Backend & Segurança
- **Node.js / Express**: Custom Chat API.
- **Firebase Admin**: Autenticação segura no servidor.
- **MongoDB**: Armazenamento persistente com criptografia.
- **Cloudinary**: Armazenamento de mídia (Imagens, Vídeos, Documentos).

---

## ⚙️ Configuração do Ambiente

### 1. Clonar e Instalar
```bash
npm install
```

### 2. Variáveis de Ambiente (.env)
Baseado no `.env.example`, preencha as chaves:

#### Firebase & Cloudinary
- `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, etc.
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`: Seu Cloud Name.
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Seu Preset (unsigned).

#### Chat API
- `EXPO_PUBLIC_CHAT_API_URL`: URL do backend (ex: `https://sua-api.onrender.com/`).

---

## 🔒 Segurança e Privacidade

- **Controle de Acesso**: Apenas participantes do chat podem ver ou apagar mensagens.
- **Privilégios de Deleção**: Apenas o autor original pode deletar uma mensagem "para todos".
- **Logs de Auditoria**: O backend registra tentativas de acesso não autorizado e ações críticas.

---

## 📄 Licença
Inspirado na interface oficial do Telegram. Desenvolvido para fins de portfólio.
