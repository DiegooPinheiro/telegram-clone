/**
 * Funções utilitárias para formatação de datas.
 */

/**
 * Formata um timestamp Unix para horário legível (HH:MM).
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formata um timestamp para exibição na lista de chats.
 * Mostra horário se for hoje, dia da semana se for esta semana, ou data completa.
 */
export const formatChatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return formatTime(timestamp);
  }

  if (diff < 7 * oneDay) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};
