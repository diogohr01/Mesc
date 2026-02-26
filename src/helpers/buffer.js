/**
 * Calcula dias entre hoje (data local) e data de entrega.
 * Retorna nível para estilo: urgente (atrasado), atencao (poucos dias), ok.
 *
 * @param {string|Date} dataEntrega - Data de entrega
 * @param {string} [status] - Status da OP (ex.: concluida → ok)
 * @returns {{ days: number, level: 'ok' | 'atencao' | 'urgente' }}
 */
export function getBufferDays(dataEntrega, status) {
  if (status === 'concluida' || status === 'cancelada') {
    return { days: 0, level: 'ok' };
  }
  if (!dataEntrega) return { days: 0, level: 'ok' };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const entrega = typeof dataEntrega === 'string' ? new Date(dataEntrega.replace(/-/g, '/')) : new Date(dataEntrega);
  entrega.setHours(0, 0, 0, 0);
  if (isNaN(entrega.getTime())) return { days: 0, level: 'ok' };

  const days = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));

  if (days < 0) return { days, level: 'urgente' };
  if (days <= 3) return { days, level: 'atencao' };
  return { days, level: 'ok' };
}

/** Cores/estilos por nível de buffer (para Tag ou span) */
export const bufferColors = {
  ok: '#52c41a',
  atencao: '#faad14',
  urgente: '#ff4d4f',
};

/** Classes CSS por nível (se usar className) */
export const bufferColorClass = {
  ok: 'buffer-ok',
  atencao: 'buffer-atencao',
  urgente: 'buffer-urgente',
};
