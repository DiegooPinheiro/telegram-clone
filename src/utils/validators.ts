/**
 * Funções de validação para formulários.
 */

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'A senha deve ter no mínimo 6 caracteres';
  }
  return null;
};

export const validateDisplayName = (name: string): string | null => {
  if (name.trim().length < 2) {
    return 'O nome deve ter no mínimo 2 caracteres';
  }
  if (name.trim().length > 30) {
    return 'O nome deve ter no máximo 30 caracteres';
  }
  return null;
};
