import dayjs from 'dayjs';
import { CONFIG_CAPACIDADE } from '../../../services/excecoesCapacidadeService';

/**
 * Retorna capacidade do dia (casa/cliente ton e %) com base em exceções ou padrão.
 * @param {Array<object>} excecoesList - Lista de exceções de capacidade (ExcecoesCapacidadeService.getAll)
 * @param {string} dateKey - Data no formato 'YYYY-MM-DD'
 * @returns {{ casaPct: number, clientePct: number, casaCap: number, clienteCap: number, capacidadeTotal: number, excecaoDia: object|undefined }}
 */
export function getCapacidadeForDate(excecoesList, dateKey) {
  const capacidadeTotal = CONFIG_CAPACIDADE.capacidadeDiaria ?? 30;
  const excecaoDia = (excecoesList || []).find((e) => e.data === dateKey);
  const casaPct = excecaoDia ? excecaoDia.casaPct : (CONFIG_CAPACIDADE.casaPctPadrao ?? 60);
  const clientePct = excecaoDia ? excecaoDia.clientePct : (CONFIG_CAPACIDADE.clientePctPadrao ?? 40);
  const casaCap = (capacidadeTotal * casaPct) / 100;
  const clienteCap = (capacidadeTotal * clientePct) / 100;
  return { casaPct, clientePct, casaCap, clienteCap, capacidadeTotal, excecaoDia };
}

/**
 * @param {dayjs.Dayjs|Date|string} d - Data
 * @returns {string} 'YYYY-MM-DD'
 */
export function getDateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}

/**
 * Retorna a sequência do dia ou estrutura vazia padrão.
 * @param {object} sequenciasPorDia - Mapa dateKey -> { ops, preview?, casaPct?, confirmada }
 * @param {string} dateKey
 * @returns {{ ops: Array, preview?: Array, casaPct?: number, confirmada: boolean }}
 */
export function getOrCreateSeq(sequenciasPorDia, dateKey) {
  if (!sequenciasPorDia || typeof sequenciasPorDia !== 'object' || !sequenciasPorDia[dateKey]) {
    return { ops: [], preview: [], casaPct: 60, confirmada: false };
  }
  const seq = sequenciasPorDia[dateKey];
  return {
    ops: seq.ops ?? [],
    preview: seq.preview ?? [],
    casaPct: seq.casaPct ?? 60,
    confirmada: !!seq.confirmada,
  };
}

/**
 * Constrói payload para persistência da sequência do dia.
 * @param {string} dateKey
 * @param {object} sequenciasPorDia
 * @param {object} capacidadeForDate - Resultado de getCapacidadeForDate
 * @returns {object} { data, confirmada, capacidade: { casaPct, clientePct, casaCap, clienteCap }, sequencia: Array<{ idOP, ordem, tipo, quantidade, ferramenta }> }
 */
export function buildSequenciamentoPayload(dateKey, sequenciasPorDia, capacidadeForDate) {
  const cap = capacidadeForDate || getCapacidadeForDate([], dateKey);
  const seq = sequenciasPorDia[dateKey];
  if (!seq) {
    return {
      data: dateKey,
      confirmada: false,
      capacidade: { casaPct: cap.casaPct, clientePct: cap.clientePct, casaCap: cap.casaCap, clienteCap: cap.clienteCap },
      sequencia: [],
    };
  }
  const casaPct = seq.casaPct ?? cap.casaPct;
  const clientePct = 100 - casaPct;
  const casaCap = cap.casaCap;
  const clienteCap = cap.clienteCap;
  const ops = seq.ops || [];
  const sequencia = ops.map((op, index) => ({
    idOP: op.id,
    ordem: index + 1,
    tipo: op.tipo || 'cliente',
    quantidade: op.quantidade,
    ferramenta: op.recurso || op.ferramenta || '',
  }));
  return {
    data: dateKey,
    confirmada: !!seq.confirmada,
    capacidade: { casaPct, clientePct, casaCap, clienteCap },
    sequencia,
  };
}

/**
 * Retorna valores distintos de uma lista para uma coluna (para filterDropdown da tabela).
 * @param {Array<object>} list
 * @param {string} columnKey
 * @returns {Promise<Array<{ text: string, value: any }>>}
 */
export function getDistinctFromList(list, columnKey) {
  const values = [...new Set((list || []).map((op) => op[columnKey] ?? ''))];
  return Promise.resolve(
    values
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map((val) => ({
        text: val === '' || val == null ? '-' : String(val),
        value: val === null || val === undefined ? '' : val,
      }))
  );
}

/**
 * Escolhe a melhor ferramenta disponível para uma quantidade (kg): status disponível e saldo de nitretação >= quantidade; ordena por menor saldo que atenda.
 * @param {number} quantidade - Quantidade em kg
 * @param {Array<object>} ferramentasList - Lista de ferramentas (codigo, nitr_limite, nitr_atual, status?)
 * @returns {object|null} Ferramenta ou null se nenhuma atender
 */
export function autoSelectFerramenta(quantidade, ferramentasList) {
  if (!Array.isArray(ferramentasList) || ferramentasList.length === 0) return null;
  const limite = (f) => Number(f.nitr_limite ?? f.nitrLimite ?? 0);
  const atual = (f) => Number(f.nitr_atual ?? f.nitrAtual ?? 0);
  const saldo = (f) => Math.max(0, limite(f) - atual(f));
  const disponivel = (f) => String(f.status || '').toLowerCase() === 'disponivel';
  const available = ferramentasList
    .filter((f) => disponivel(f) && (quantidade <= 0 || saldo(f) >= quantidade))
    .sort((a, b) => saldo(a) - saldo(b));
  if (available.length > 0) return available[0];
  // Fallback: primeira disponível ou primeira da lista, para vir sempre uma ferramenta selecionada no preview
  const firstDisponivel = ferramentasList.find((f) => disponivel(f));
  return firstDisponivel ?? ferramentasList[0] ?? null;
}
