// Configurações do Firebase
// Preencha com as credenciais do seu projeto Firebase

import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCja6pSE30bY-odFDnh1BcwJNVHvrJSDKI',
  authDomain: 'telegram-clone-32b5c.firebaseapp.com',
  projectId: 'telegram-clone-32b5c',
  storageBucket: 'telegram-clone-32b5c.firebasestorage.app',
  messagingSenderId: '578124025434',
  appId: '1:578124025434:web:77c6cc0ead7dfd63071263',
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export default app;
