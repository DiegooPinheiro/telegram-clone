import * as Contacts from 'expo-contacts';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Normaliza o número de telefone removendo caracteres não numéricos.
 * Se tiver um sinal de +, ele é preservado.
 */
export const normalizePhoneNumber = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Sincroniza os contatos locais com o Firebase.
 * Retorna uma lista de UIDs registrados que estão nos contatos.
 */
export const syncContactsWithFirebase = async (): Promise<string[]> => {
  try {
    // 1. Pedir permissão para acessar contatos
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[ContactSync] Permissão de contatos negada');
      return [];
    }

    // 2. Buscar contatos locais
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    if (!data || data.length === 0) {
      return [];
    }

    // 3. Extrair e normalizar números
    const phoneNumbers = new Set<string>();
    data.forEach((contact) => {
      contact.phoneNumbers?.forEach((p) => {
        if (p.number) {
          const normalized = normalizePhoneNumber(p.number);
          if (normalized.length > 5) { // Filtro básico para evitar números curtos
            phoneNumbers.add(normalized);
            
            // Adiciona variação sem o + caso esteja salvo assim no banco
            if (normalized.startsWith('+')) {
              phoneNumbers.add(normalized.substring(1));
            }
          }
        }
      });
    });

    if (phoneNumbers.size === 0) {
      return [];
    }

    const numbersArray = Array.from(phoneNumbers);
    const registeredUIDs: string[] = [];

    // 4. Buscar no Firebase em lotes (Firestore 'in' aceita até 30 itens)
    // Para simplificar, vamos processar os primeiros 100 contatos ou fazer em lotes de 30
    const chunkSize = 30;
    for (let i = 0; i < numbersArray.length; i += chunkSize) {
      const chunk = numbersArray.slice(i, i + chunkSize);
      
      const q = query(
        collection(db, 'users'),
        where('phone', 'in', chunk),
        limit(chunkSize)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.uid) {
          registeredUIDs.push(userData.uid);
        }
      });
    }

    // Remover duplicatas caso o mesmo UID tenha sido encontrado por variações de número
    return Array.from(new Set(registeredUIDs));
  } catch (error) {
    console.error('[ContactSync] Erro ao sincronizar contatos:', error);
    return [];
  }
};
