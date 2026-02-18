/**
 * Labels e cores de status para Ordem de Produção (OPStatus e OPStatusDetalhado).
 * Usado por Dashboard, Gantt, StatusBadge e demais componentes.
 */

/** OPStatus — status principal da OP MESC */
export const statusLabels = {
  nao_programada: 'Não Programada',
  programada: 'Programada',
  na_prensa: 'Na Prensa',
  no_forno: 'No Forno',
  na_embalagem: 'Na Embalagem',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  aguardando_ferramenta: 'Aguard. Ferramenta',
};

/** Cores para Tag do Ant Design (success, processing, warning, error, default) */
export const statusColors = {
  nao_programada: 'default',
  programada: 'processing',
  na_prensa: 'blue',
  no_forno: 'orange',
  na_embalagem: 'cyan',
  concluida: 'success',
  cancelada: 'default',
  aguardando_ferramenta: 'error',
};

/** OPStatusDetalhado — etapa detalhada (opcional) */
export const statusDetalhadoLabels = {
  programada: 'Programada',
  na_prensa: 'Na Prensa',
  no_corte: 'No Corte',
  no_forno: 'No Forno',
  esfriando: 'Esfriando',
  na_embalagem: 'Na Embalagem',
  concluida: 'Concluída',
  falha: 'Falha',
};
