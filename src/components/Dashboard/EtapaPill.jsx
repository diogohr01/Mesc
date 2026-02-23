import React, { memo } from 'react';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { colors } from '../../styles/colors';

const STATUS_STYLES = {
  aguardando: {
    background: colors.backgroundGray,
    color: colors.text?.secondary ?? '#8c8c8c',
    borderColor: colors.borderColor,
  },
  em_processo: {
    background: 'rgba(36, 59, 94, 0.08)',
    color: colors.primary,
    borderColor: 'rgba(36, 59, 94, 0.3)',
  },
  concluido: {
    background: 'rgba(82, 196, 26, 0.08)',
    color: colors.secondary,
    borderColor: 'rgba(82, 196, 26, 0.3)',
  },
  problema: {
    background: 'rgba(255, 77, 79, 0.08)',
    color: '#ff4d4f',
    borderColor: 'rgba(255, 77, 79, 0.3)',
  },
};

function EtapaIcon({ status }) {
  const iconStyle = { fontSize: 12, marginRight: 4 };
  if (status === 'concluido') return <CheckCircleOutlined style={{ ...iconStyle, color: colors.secondary }} />;
  if (status === 'em_processo') return <PlayCircleOutlined style={{ ...iconStyle, color: colors.primary }} />;
  if (status === 'problema') return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
  if (status === 'aguardando') {
    return (
      <LoadingOutlined
        spin
        style={{ ...iconStyle, color: colors.text?.secondary ?? '#8c8c8c', opacity: 0.8 }}
      />
    );
  }
  return <ClockCircleOutlined style={{ ...iconStyle, color: colors.text?.secondary ?? '#8c8c8c', opacity: 0.6 }} />;
}

/**
 * Pill com label, status e horário opcional para uma etapa do pipeline.
 * @param {string} label - Nome da etapa (ex.: Prensa, Corte, Forno, Embalagem)
 * @param {string} status - Chave do status: aguardando | em_processo | concluido | problema
 * @param {object} horario - Opcional: { inicio?: string, fim?: string } para tooltip
 */
const EtapaPill = memo(({ label, status, horario }) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.aguardando;
  const title =
    horario && (horario.inicio || horario.fim)
      ? [horario.inicio && `Início: ${horario.inicio}`, horario.fim && `Fim: ${horario.fim}`].filter(Boolean).join(' | ')
      : status === 'aguardando'
        ? 'Aguardando esta etapa'
        : undefined;

  return (
    <div
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${style.borderColor}`,
        fontSize: 10,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: style.background,
        color: style.color,
      }}
    >
      <EtapaIcon status={status} />
      {label}
    </div>
  );
});

EtapaPill.displayName = 'EtapaPill';

export default EtapaPill;
