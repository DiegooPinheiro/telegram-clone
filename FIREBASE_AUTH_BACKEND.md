# Firebase Auth Migration for Chat API

O app agora assume um modelo mais seguro:

- O login/cadastro acontece no Firebase.
- A API de chat não recebe mais senha do usuário.
- A API valida o `Firebase ID Token` enviado no header `Authorization: Bearer <token>`.
- A API cria ou sincroniza o usuário do Mongo a partir do token validado.

## Endpoint esperado pelo app

`POST /api/auth/firebase`

Header:

```http
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

Body:

```json
{
  "email": "user@example.com",
  "displayName": "Diego",
  "photoURL": "https://..."
}
```

Resposta esperada:

```json
{
  "_id": "mongo_user_id",
  "username": "user@example.com",
  "nome": "Diego",
  "foto": "https://..."
}
```

## Backend flow

1. Ler o token Bearer.
2. Validar com `firebase-admin`.
3. Extrair `uid`, `email`, `name`, `picture`.
4. Buscar usuário no Mongo por `firebaseUid` ou `email`.
5. Criar se não existir.
6. Retornar o usuário do chat.

## Exemplo de validação

```ts
import admin from 'firebase-admin';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token Firebase inválido.' });
  }
}
```

## Exemplo de rota

```ts
app.post('/api/auth/firebase', verifyFirebaseToken, async (req, res) => {
  const { uid, email, name, picture } = req.firebaseUser;
  const { displayName, photoURL } = req.body || {};

  let user = await User.findOne({
    $or: [{ firebaseUid: uid }, { username: email?.toLowerCase() }],
  });

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      username: String(email || '').trim().toLowerCase(),
      nome: String(displayName || name || 'Usuário').trim(),
      foto: photoURL || picture || '',
    });
  } else {
    user.username = String(email || user.username).trim().toLowerCase();
    user.nome = String(displayName || name || user.nome || 'Usuário').trim();
    user.foto = photoURL || picture || user.foto || '';
    await user.save();
  }

  res.json({
    _id: String(user._id),
    username: user.username,
    nome: user.nome,
    foto: user.foto,
  });
});
```

## Protegendo as outras rotas

Todas as rotas autenticadas devem usar o middleware `verifyFirebaseToken`.

Exemplos:

- `GET /api/users`
- `POST /api/conversations`
- `GET /api/conversations/:userId`
- `GET /api/messages/:conversationId`
- `POST /api/messages`
- `POST /api/media/upload`

Idealmente, a API deve usar `req.firebaseUser.uid` para descobrir quem é o usuário atual e só então mapear para o `_id` do Mongo.

## Socket.IO

O app agora envia o token do Firebase no handshake:

```ts
io(url, {
  auth: {
    token: firebaseToken
  }
})
```

No backend:

1. Ler `socket.handshake.auth.token`.
2. Validar com `firebase-admin`.
3. Anexar `firebaseUser` e `mongoUser` ao `socket`.
4. Não confiar apenas no `connect_user` enviado pelo cliente.

## O que remover do backend antigo

- Login por senha em `/api/users/login`
- Cadastro por senha em `/api/users`
- JWT próprio só para substituir o Firebase sem necessidade
- Qualquer confiança em `userId` vindo cru do cliente

## Modelo recomendado de usuário no Mongo

```ts
{
  firebaseUid: String,
  username: String,
  nome: String,
  foto: String
}
```

Crie índice único em `firebaseUid` e, se fizer sentido no seu projeto, também em `username`.
