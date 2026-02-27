import React from 'react';
import { Progress, Tag, Typography } from 'antd';
import { HomeOutlined, LockOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { colors } from '../../../styles/colors';

const { Text } = Typography;

/**
 * Três linhas de capacidade (Total, Casa, Cliente) com barra de progresso e percentual.
 * Cores por faixa: ≤70% verde, ≤90% amarelo, ≤100% laranja, >100% vermelho.
 * Recebe apenas props; sem lógica de negócio.
 */
function getBarColor(pct) {
  if (pct <= 70) return '#52c41a';
  if (pct <= 90) return '#faad14';
  if (pct <= 100) return '#fa8c16';
  return '#ff4d4f';
}

function getPctTextColor(pct) {
  if (pct > 100) return '#ff4d4f';
  if (pct > 90) return '#faad14';
  if (pct > 70) return '#faad14';
  return '#52c41a';
}

const ICONS = {
  todos: <PlusOutlined style={{ marginRight: 4, fontSize: 11 }} />,
  casa: <HomeOutlined style={{ marginRight: 4, fontSize: 11 }} />,
  cliente: <TeamOutlined style={{ marginRight: 4, fontSize: 11 }} />,
};

export default function CapacidadeBarras({
  filtroTipo,
  setFiltroTipo,
  viewMode,
  casaTon,
  clienteTon,
  casaCap,
  clienteCap,
  capacidadeTotal,
  casaTonSemana,
  clienteTonSemana,
  CAPACIDADE_CASA_SEMANA,
  CAPACIDADE_CLIENTE_SEMANA,
  CAPACIDADE_TOTAL_SEMANA,
  confirmada,
  excecaoDia,
  capacityForDate,
}) {
  const rows = [
    {
      key: 'todos',
      label: 'Total',
      icon: ICONS.todos,
      ton: viewMode === 'semana' ? casaTonSemana + clienteTonSemana : casaTon + clienteTon,
      cap: viewMode === 'semana' ? CAPACIDADE_TOTAL_SEMANA : capacidadeTotal,
    },
    {
      key: 'casa',
      label: 'Casa',
      icon: ICONS.casa,
      ton: viewMode === 'semana' ? casaTonSemana : casaTon,
      cap: viewMode === 'semana' ? CAPACIDADE_CASA_SEMANA : casaCap,
    },
    {
      key: 'cliente',
      label: 'Cliente',
      icon: ICONS.cliente,
      ton: viewMode === 'semana' ? clienteTonSemana : clienteTon,
      cap: viewMode === 'semana' ? CAPACIDADE_CLIENTE_SEMANA : clienteCap,
    },
  ];

  return (
    <div
      style={{
        marginBottom: 8,
        padding: 8,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
      }}
    >
      {rows.map(({ key, label, icon, ton, cap }) => {
        const currentTon = Number(ton) || 0;
        const capacity = Number(cap) || 1;
        const pct = Math.min(Math.round((currentTon / capacity) * 100), 999);
        const isSelected = filtroTipo === key;
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => setFiltroTipo(key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFiltroTipo(key);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              marginBottom: 2,
              borderRadius: 6,
              cursor: 'pointer',
              background: isSelected ? (colors.primary ? `${colors.primary}14` : '#e6f7ff') : 'transparent',
              borderLeft: isSelected ? `3px solid ${colors.primary || '#1890ff'}` : '3px solid transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', minWidth: 72, fontSize: 11 }}>
              {icon}
              {label}
            </span>
            <Text style={{ fontSize: 11, fontFamily: 'monospace', minWidth: 76 }}>
              {currentTon.toFixed(1)} / {capacity} ton
            </Text>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Progress
                percent={Math.min(pct, 100)}
                showInfo={false}
                strokeColor={getBarColor(pct)}
                trailColor="#f0f0f0"
                size="small"
              />
            </div>
            <Text style={{ fontSize: 11, minWidth: 28, color: getPctTextColor(pct) }}>{pct}%</Text>
          </div>
        );
      })}
      {confirmada && (
        <div style={{ marginBottom: 8 }}>
          <Tag icon={<LockOutlined />} color="default">
            Confirmada
          </Tag>
        </div>
      )}
      {excecaoDia && capacityForDate && (
        <div style={{ marginTop: 4 }}>
          <Tag color="orange" title={excecaoDia.motivo || undefined}>
            Exceção: {capacityForDate.casaPct}/{capacityForDate.clientePct}
          </Tag>
        </div>
      )}
    </div>
  );
}
