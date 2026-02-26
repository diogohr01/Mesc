/**
 * Infere etapas do pipeline (prensa, serra, forno, esticadeira, embalagem) a partir do status da OP.
 * Usado na Fila de Produção quando op.etapas não vem do backend.
 */

const ETAPA_KEYS = ['prensa', 'serra', 'forno', 'esticadeira', 'embalagem'];
const STATUS_TO_ETAPA = {
  na_prensa: 'prensa',
  no_corte: 'serra',
  no_serra: 'serra',
  no_forno: 'forno',
  na_esticadeira: 'esticadeira',
  na_embalagem: 'embalagem',
};

/**
 * Retorna etapa em que a OP está em processo (ou null se não houver).
 * Prioriza statusDetalhado para no_serra/no_corte (que pode não estar em status).
 */
function getEtapaEmProcesso(status, statusDetalhado) {
  const s = statusDetalhado || status;
  return STATUS_TO_ETAPA[s] || null;
}

/**
 * Infere etapas do pipeline a partir do status da OP.
 * @param {Object} op - OP com status e statusDetalhado
 * @returns {{ prensa: string, serra: string, forno: string, esticadeira: string, embalagem: string }} etapas em formato EtapaPill
 */
/** Normaliza objeto etapas do backend para o pipeline de 5 etapas (Serra + Esticadeira). */
function normalizeEtapas(etapas) {
  if (!etapas || typeof etapas !== 'object') return null;
  return {
    prensa: etapas.prensa ?? 'aguardando',
    serra: etapas.serra ?? etapas.corte ?? 'aguardando',
    forno: etapas.forno ?? 'aguardando',
    esticadeira: etapas.esticadeira ?? 'aguardando',
    embalagem: etapas.embalagem ?? 'aguardando',
  };
}

export function getEtapasFromStatus(op) {
  if (!op) return null;
  const etapas = op.etapas;
  if (etapas && typeof etapas === 'object') return normalizeEtapas(etapas);

  const status = op.status || op.situacao;
  const statusDetalhado = op.statusDetalhado;
  const etapaAtual = getEtapaEmProcesso(status, statusDetalhado);

  if (status === 'concluida') {
    return {
      prensa: 'concluido',
      serra: 'concluido',
      forno: 'concluido',
      esticadeira: 'concluido',
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
