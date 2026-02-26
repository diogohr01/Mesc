/**
 * Parse dataEntrega como data local (evita shift de 1 dia em timezones como UTC-3).
 * Aceita "YYYY-MM-DD" ou objeto Date.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const str = String(dateStr).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date(dateStr);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/**
 * Verifica se dataEntrega está atrasada (antes de hoje, em data local).
 * @param {string|Date} dataEntrega - Data de entrega
 * @param {number} [diasToleranciaAtraso=0] - Dias de tolerância após a data de entrega; só após esse período é considerado atrasado
 */
export function isDataEntregaAtrasada(dataEntrega, diasToleranciaAtraso = 0) {
  const entrega = parseLocalDate(dataEntrega);
  if (!entrega || isNaN(entrega.getTime())) return false;
  const dias = Number(diasToleranciaAtraso) || 0;
  const dataEfetiva = new Date(entrega);
  dataEfetiva.setDate(dataEfetiva.getDate() + dias);
  dataEfetiva.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return dataEfetiva < hoje;
}

/**
 * Nível de urgência com base na data de entrega, status e tolerância de atraso.
 * @param {string|Date} dataEntrega - Data de entrega da OP
 * @param {string} status - Status da OP (ex.: em_producao, concluida)
 * @param {number} [diasToleranciaAtraso=0] - Dias de tolerância após a data de entrega; a "data efetiva" é dataEntrega + diasToleranciaAtraso
 * @returns {'critical'|'warning'|'ok'}
 */
export function getUrgencyLevel(dataEntrega, status, diasToleranciaAtraso = 0) {
  if (status === 'concluida' || status === 'cancelada') return 'ok';
  if (!dataEntrega) return 'ok';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const entrega = parseLocalDate(dataEntrega);
  if (!entrega || isNaN(entrega.getTime())) return 'ok';
  const dias = Number(diasToleranciaAtraso) || 0;
  const dataEfetiva = new Date(entrega);
  dataEfetiva.setDate(dataEfetiva.getDate() + dias);
  dataEfetiva.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dataEfetiva - hoje) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'critical';   // atrasada → vermelho
  if (diffDays <= 3) return 'warning';  // 3 dias ou menos → amarelo
  return 'ok';                           // 7+ dias → verde/normal
}

/** Estilos de borda-esquerda por nível de urgência (para linha da tabela) */
export const urgencyBarColors = {
  critical: { borderLeft: '4px solid #ff4d4f' },
  warning: { borderLeft: '4px solid #faad14' },
  ok: { borderLeft: '4px solid transparent' },
};

/** Cores de texto por nível de urgência (ex.: coluna data entrega) */
export const urgencyColors = {
  critical: '#ff4d4f',   // vermelho: atrasada
  warning: '#faad14',   // amarelo: 3 dias ou menos
  ok: '#52c41a',       // verde: 7+ dias
};
