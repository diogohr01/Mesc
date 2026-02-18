import React, { memo } from 'react';
import { Tag } from 'antd';
import { statusLabels, statusColors } from '../../constants/ordemProducaoStatus';

/**
 * Badge de status da OP com label e cor consistentes.
 * @param {string} status - Chave do status (OPStatus: nao_programada, programada, na_prensa, no_forno, na_embalagem, concluida, cancelada, aguardando_ferramenta)
 */
const StatusBadge = memo(({ status }) => {
  const label = statusLabels[status] ?? status;
  const color = statusColors[status] ?? 'default';

  return <Tag color={color}>{label}</Tag>;
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
