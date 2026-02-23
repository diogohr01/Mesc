/**
 * Infere etapas do pipeline (prensa, corte, forno, embalagem) a partir do status da OP.
 * Usado na Fila de Produção quando op.etapas não vem do backend.
 */

const ETAPA_KEYS = ['prensa', 'corte', 'forno', 'embalagem'];
const STATUS_TO_ETAPA = {
  na_prensa: 'prensa',
  no_corte: 'corte',
  no_forno: 'forno',
  na_embalagem: 'embalagem',
};

/**
 * Retorna etapa em que a OP está em processo (ou null se não houver).
 * Prioriza statusDetalhado para no_corte (que pode não estar em status).
 */
function getEtapaEmProcesso(status, statusDetalhado) {
  const s = statusDetalhado || status;
  return STATUS_TO_ETAPA[s] || null;
}

/**
 * Infere etapas do pipeline a partir do status da OP.
 * @param {Object} op - OP com status e statusDetalhado
 * @returns {{ prensa: string, corte: string, forno: string, embalagem: string }} etapas em formato EtapaPill
 */
export function getEtapasFromStatus(op) {
  if (!op) return null;
  const etapas = op.etapas;
  if (etapas && typeof etapas === 'object') return etapas;

  const status = op.status || op.situacao;
  const statusDetalhado = op.statusDetalhado;
  const etapaAtual = getEtapaEmProcesso(status, statusDetalhado);

  if (status === 'concluida') {
    return {
      prensa: 'concluido',
      corte: 'concluido',
      forno: 'concluido',
      embalagem: 'concluido',
    };
  }

  const idxAtual = etapaAtual ? ETAPA_KEYS.indexOf(etapaAtual) : -1;
  const result = {};
  ETAPA_KEYS.forEach((key, i) => {
    if (idxAtual < 0) result[key] = 'aguardando';
    else if (i < idxAtual) result[key] = 'concluido';
    else if (i === idxAtual) result[key] = 'em_processo';
    else result[key] = 'aguardando';
  });
  return result;
}
