/**
 * Nível de urgência com base na data de entrega e status.
 * @param {string|Date} dataEntrega - Data de entrega da OP
 * @param {string} status - Status da OP (ex.: na_prensa, concluida)
 * @returns {'critical'|'warning'|'ok'}
 */
export function getUrgencyLevel(dataEntrega, status) {
  if (status === 'concluida' || status === 'cancelada') return 'ok';
  if (!dataEntrega) return 'ok';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const entrega = new Date(dataEntrega);
  entrega.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'critical'; // atrasada
  if (diffDays <= 3) return 'critical'; // entrega muito próxima
  if (diffDays <= 7) return 'warning';  // próxima
  return 'ok';
}

/** Estilos de borda-esquerda por nível de urgência (para linha da tabela) */
export const urgencyBarColors = {
  critical: { borderLeft: '4px solid #ff4d4f' },
  warning: { borderLeft: '4px solid #faad14' },
  ok: { borderLeft: '4px solid transparent' },
};

/** Cores de texto por nível de urgência (ex.: coluna data entrega) */
export const urgencyColors = {
  critical: '#ff4d4f',
  warning: '#faad14',
  ok: undefined,
};
