const mongoose = require('c:/Users/diego/OneDrive/Área de Trabalho/chat-api_v2_tested/node_modules/mongoose');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/chat-api';

async function fix() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado!');

    const collection = mongoose.connection.collection('users');
    
    console.log('Tentando remover o índice problemático (username_1)...');
    try {
      await collection.dropIndex('username_1');
      console.log('Índice username_1 removido com sucesso!');
    } catch (err) {
      if (err.code === 27) {
        console.log('O índice username_1 não existe ou já foi removido.');
      } else {
        throw err;
      }
    }

    console.log('Tentando remover o índice firebaseUid_1 por segurança...');
    try {
      await collection.dropIndex('firebaseUid_1');
      console.log('Índice firebaseUid_1 removido com sucesso!');
    } catch (err) {
      if (err.code === 27) {
        console.log('O índice firebaseUid_1 não existe ou já foi removido.');
      }
    }

    console.log('Pronto! Agora o Mongoose irá recriar os índices como SPARSE ao reiniciar a API.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao processar:', error);
    process.exit(1);
  }
}

fix();
