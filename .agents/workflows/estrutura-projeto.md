---
description: Estrutura padrão de pastas e organização do projeto Telegram Clone
---

# Estrutura do Projeto

Use este workflow como referência para manter o projeto organizado.

## Árvore de Pastas

```
telegram-clone/
├── App.tsx                     # Entry point, inicialização
├── index.ts                    # Registro do app
├── app.json                    # Configuração Expo
├── tsconfig.json               # Configuração TypeScript
├── package.json
│
└── src/
    ├── components/             # Componentes reutilizáveis
    │   ├── Avatar.tsx          # Avatar com indicador online
    │   ├── MessageBubble.tsx   # Bolha de mensagem
    │   ├── MessageInput.tsx    # Input de mensagem
    │   ├── ChatListItem.tsx    # Item da lista de conversas
    │   ├── ContactItem.tsx     # Item da lista de contatos
    │   └── LoadingSpinner.tsx  # Indicador de carregamento
    │
    ├── screens/                # Telas do app
    │   ├── LoginScreen.tsx
    │   ├── RegisterScreen.tsx
    │   ├── ChatListScreen.tsx  # Tela principal (lista de conversas)
    │   ├── ChatScreen.tsx      # Tela de chat individual
    │   ├── ProfileScreen.tsx
    │   ├── SettingsScreen.tsx
    │   ├── ContactsScreen.tsx
    │   └── NewChatScreen.tsx
    │
    ├── navigation/             # Navegação
    │   ├── AppNavigator.tsx    # Stack Navigator principal
    │   ├── AuthNavigator.tsx   # Stack para telas de auth (Login/Register)
    │   └── types.ts            # Tipos das rotas (RootStackParamList)
    │
    ├── services/               # Serviços externos
    │   ├── authService.ts      # Firebase Auth (signIn, signUp, signOut)
    │   ├── cometChatService.ts # CometChat (login, createUser, fetchUsers)
    │   └── messageService.ts   # Mensagens CometChat (send, fetch, listeners)
    │
    ├── config/                 # Configurações
    │   ├── firebaseConfig.ts   # Credenciais Firebase
    │   └── cometChatConfig.ts  # Credenciais CometChat
    │
    ├──/                  # Custom hooks
    │   ├── useAuth.ts          # Hook de autenticação
    │   ├── useMessages.ts      # Hook de mensagens (fetch + listener)
    │   └── useOnlineStatus.ts  # Hook de status online
    │
    ├── types/                  # TypeScript types/interfaces
    │   ├── user.ts             # Interface User
    │   ├── message.ts          # Interface Message
    │   └── chat.ts             # Interface Chat/Conversation
    │
    ├── utils/                  # Funções utilitárias
    │   ├── formatDate.ts       # Formatação de datas
    │   ├── formatPhone.ts      # Formatação de telefone
    │   └── validators.ts       # Validações (email, senha, etc.)
    │
    └── theme/                  # Design system
        ├── colors.ts           # Paleta de cores
        ├── typography.ts       # Estilos de texto
        └── spacing.ts          # Espaçamento e border radius
```

## Regras de Organização

### Componentes (`src/components/`)

- Um componente por arquivo
- Nome do arquivo = nome do componente (PascalCase)
- Props devem ser tipadas com interface
- Estilos via `StyleSheet.create()` no final do arquivo

### Telas (`src/screens/`)

- Sufixo `Screen` no nome: `ChatScreen.tsx`, `LoginScreen.tsx`
- Usar `SafeAreaView` como container principal
- Lógica complexa extraída para hooks

### Serviços (`src/services/`)

- Funções puras (sem estado)
- Retornar Promises
- Tratar erros com try/catch
- Logar erros no console

### Hooks (`src/hooks/`)

- Prefixo `use`: `useAuth`, `useMessages`
- Gerenciar estado e side effects
- Limpar listeners no cleanup

### Types (`src/types/`)

- Interfaces para dados do backend
- Export nomeado (não default)

### Config (`src/config/`)

- Nunca commitar credenciais reais no git
- Usar variáveis de ambiente em produção

## Ao criar um novo arquivo

1. Identificar em qual pasta o arquivo deve ficar
2. Seguir o padrão de nomenclatura da pasta
3. Adicionar imports/exports necessários
4. Atualizar a navegação se for uma tela nova (ver workflow `/criar-tela`)