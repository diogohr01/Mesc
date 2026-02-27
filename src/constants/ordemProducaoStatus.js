/**
 * Labels e cores de status para Ordem de Produção (OPStatus e OPStatusDetalhado).
 * Usado por Dashboard, Gantt, StatusBadge e demais componentes.
 */

/** OPStatus — status principal da OP MESC */
export const statusLabels = {
  nao_programada: 'Não Programada',
  parcial: 'Parcial',
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
  parcial: 'warning',
  programada: 'processing',
  na_prensa: 'blue',
  no_forno: 'orange',
  na_embalagem: 'cyan',
  concluida: 'success',
  cancelada: 'default',
  aguardando_ferramenta: 'error',
};

/** Cor de fundo e borda suave por status (linha da tabela), alinhado ao StatusBadge */
export const statusRowTint = {
  nao_programada: { backgroundColor: 'rgba(0,0,0,0.04)', borderLeft: '4px solid #d9d9d9' },
  parcial: { backgroundColor: 'rgba(250,173,20,0.08)', borderLeft: '4px solid #faad14' },
  programada: { backgroundColor: 'rgba(22,119,255,0.08)', borderLeft: '4px solid #1890ff' },
  na_prensa: { backgroundColor: 'rgba(24,144,255,0.08)', borderLeft: '4px solid #1890ff' },
  no_forno: { backgroundColor: 'rgba(250,173,20,0.12)', borderLeft: '4px solid #faad14' },
  na_embalagem: { backgroundColor: 'rgba(19,194,194,0.08)', borderLeft: '4px solid #13c2c2' },
  concluida: { backgroundColor: 'rgba(82,196,26,0.06)', borderLeft: '4px solid #52c41a' },
  cancelada: { backgroundColor: 'rgba(0,0,0,0.02)', borderLeft: '4px solid transparent' },
  aguardando_ferramenta: { backgroundColor: 'rgba(255,77,79,0.08)', borderLeft: '4px solid #ff4d4f' },
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
