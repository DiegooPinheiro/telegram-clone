import { useAuthContext } from '../context/AuthContext';

/**
 * Hook de autenticação.
 * Retorna o estado global de autenticação do AuthContext.
 */
export default function useAuth() {
  return useAuthContext();
}
