---
description: Criar uma nova tela (Screen) com React Navigation no Telegram Clone
---

# Criar Nova Tela

Use este workflow sempre que precisar criar uma nova tela no app.

## Passos

### 1. Criar o arquivo da tela

Criar em `src/screens/NomeDaTela.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NomeDaTela'>;

export default function NomeDaTela({ navigation, route }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Nome Da Tela</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});
```

### 2. Definir os tipos de navegação

Em `src/navigation/types.ts`, adicionar a rota:

```typescript
export type RootStackParamList = {
  // Telas existentes...
  NomeDaTela: undefined; // ou { paramName: string } se receber params
};
```

### 3. Registrar no Navigator

Em `src/navigation/AppNavigator.tsx`, adicionar o Screen:

```typescript
import NomeDaTela from '../screens/NomeDaTela';

// Dentro do Stack.Navigator:
<Stack.Screen
  name="NomeDaTela"
  component={NomeDaTela}
  options={{
    title: 'Título da Tela',
    headerStyle: { backgroundColor: '#0088cc' },
    headerTintColor: '#fff',
  }}
/>
```

### 4. Navegar para a tela

De qualquer outra tela:

```typescript
// Navegação simples
navigation.navigate("NomeDaTela");

// Com parâmetros
navigation.navigate("NomeDaTela", { paramName: "valor" });

// Substituir tela atual
navigation.replace("NomeDaTela");

// Voltar
navigation.goBack();
```

## Telas comuns do Telegram Clone

Referência das telas que normalmente serão criadas:

| Tela     | Rota       | Descrição                           |
| -------- | ---------- | ----------------------------------- |
| Login    | `Login`    | Tela de login com email/senha       |
| Register | `Register` | Tela de cadastro                    |
| ChatList | `ChatList` | Lista de conversas (tela principal) |
| Chat     | `Chat`     | Conversa individual                 |
| Profile  | `Profile`  | Perfil do usuário                   |
| Settings | `Settings` | Configurações                       |
| Contacts | `Contacts` | Lista de contatos                   |
| NewChat  | `NewChat`  | Iniciar nova conversa               |

## Padrões obrigatórios

1. **Sempre** usar `SafeAreaView` como container principal
2. **Sempre** tipar os props com `NativeStackScreenProps`
3. **Sempre** adicionar a rota em `RootStackParamList`
4. **Sempre** usar `StyleSheet.create()` para estilos
5. **Nome do arquivo** = nome da função = nome da rota
