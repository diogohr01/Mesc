/**
 * Retorna o percentual de perda para um item (liga + têmpera) e quantidade.
 * Usa faixas de perda (perdaRanges) se existirem, senão percentual_perda/percentualPerda do item.
 *
 * @param {Array<object>} items - Lista de itens (ex.: resposta getAll do itensService)
 * @param {string} liga
 * @param {string} tempera
 * @param {number} quantidade
 * @returns {number} Percentual de perda (0 se item não encontrado)
 */
export function getPerdaPercentual(items, liga, tempera, quantidade) {
  if (!Array.isArray(items)) return 0;
  const item = items.find(
    (i) =>
      String(i.liga || '').toLowerCase() === String(liga || '').toLowerCase() &&
      String(i.tempera || '').toLowerCase() === String(tempera || '').toLowerCase()
  );
  if (!item) return 0;
  const ranges = item.perdaRanges || item.perda_ranges;
  if (Array.isArray(ranges) && ranges.length > 0) {
    const range = ranges.find(
      (r) =>
        quantidade >= (r.faixaMin ?? r.faixa_min ?? 0) &&
        (r.faixaMax == null || r.faixa_max == null || quantidade <= (r.faixaMax ?? r.faixa_max))
    );
    if (range) return Number(range.percentualPerda ?? range.percentual_perda ?? 0);
  }
  return Number(item.percentual_perda ?? item.percentualPerda ?? 0);
}

/**
 * Retorna o saldo disponível da ferramenta (nitretação), descontando quantidade programada em OPs não concluídas/canceladas.
 * Ferramenta: { codigo, nitr_limite, nitr_atual } (ou nitrLimite/nitrAtual).
 * OP: { ferramenta: { codigo }, status, numeroPecasOP ou itens[].quantidadePecas }.
 *
 * @param {object} ferramenta - { codigo, nitr_limite, nitr_atual } (ou nitrLimite/nitrAtual)
 * @param {Array<object>} opsFilhas - Lista de OPs filhas (tipoOp === 'FILHA' ou equivalente)
 * @returns {number} Saldo disponível (>= 0)
 */
export function getSaldoDisponivel(ferramenta, opsFilhas) {
  if (!ferramenta) return 0;
  const codigo = ferramenta.codigo || '';
  const limite = Number(ferramenta.nitr_limite ?? ferramenta.nitrLimite ?? 0);
  const atual = Number(ferramenta.nitr_atual ?? ferramenta.nitrAtual ?? 0);
  const saldoNitretacao = Math.max(0, limite - atual);

  if (!Array.isArray(opsFilhas)) return saldoNitretacao;
  const statusFinalizados = ['concluida', 'concluído', 'cancelada', 'cancelado'];
  const programado = opsFilhas
    .filter(
      (op) =>
        (op.ferramenta?.codigo || op.ferramentaCodigo || '') === codigo &&
        !statusFinalizados.includes(String(op.status || '').toLowerCase())
    )
    .reduce((sum, op) => {
      const qtd = op.numeroPecasOP ?? (op.itens || []).reduce((s, i) => s + (Number(i.quantidadePecas) || 0), 0) ?? op.quantidade ?? 0;
      return sum + Number(qtd || 0);
    }, 0);

  return Math.max(0, saldoNitretacao - programado);
}

/**
 * Retorna a exceção ativa para uma ferramenta, se existir.
 *
 * @param {Array<object>} excecoesFerramentas - Lista de exceções por ferramenta (ex.: [{ ferramentaCodigo, ativo }])
 * @param {string} ferramentaCodigo
 * @returns {object|undefined} Exceção ativa ou undefined
 */
export function getExcecaoAtiva(excecoesFerramentas, ferramentaCodigo) {
  if (!Array.isArray(excecoesFerramentas) || !ferramentaCodigo) return undefined;
  return excecoesFerramentas.find(
    (e) =>
      (e.ferramentaCodigo ?? e.ferramenta_codigo) === ferramentaCodigo &&
      (e.ativo === true || e.ativo === 'true')
  );
}
