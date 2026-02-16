import React from 'react';
import { Progress, Space, Typography } from 'antd';
import { colors } from '../../styles/colors';

const { Text } = Typography;

const CAPACIDADE_DEFAULT = 30;

/**
 * Cores por faixa de utilização: verde (0–70%), amarelo (70–90%), laranja (90–100%), vermelho (>100%).
 * Apenas indicativo, nunca bloqueia.
 */
function getColorByPercent(percent) {
  if (percent <= 70) return '#52c41a';
  if (percent <= 90) return '#faad14';
  if (percent <= 100) return '#fa8c16';
  return '#ff4d4f';
}

const CapacidadeIndicator = ({
  utilizadoTon = 0,
  capacidadeTon = CAPACIDADE_DEFAULT,
  casaTon = 0,
  clienteTon = 0,
  showProgress = true,
}) => {
  const total = Number(utilizadoTon) || 0;
  const capacidade = Number(capacidadeTon) || CAPACIDADE_DEFAULT;
  const casa = Number(casaTon) || 0;
  const cliente = Number(clienteTon) || 0;
  const percent = capacidade > 0 ? Math.min(Math.round((total / capacidade) * 100), 999) : 0;
  const barPercent = Math.min(percent, 100);
  const color = getColorByPercent(percent);

  return (
    <Space size="middle" wrap style={{ alignItems: 'center' }}>
      <Text strong style={{ fontSize: 15, fontFamily: 'monospace' }}>
        {total.toFixed(1)} / {capacidade} ton
      </Text>
      <Text type="secondary" style={{ fontSize: 13 }}>
        {percent}% utilizada
      </Text>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Casa: {casa.toFixed(1)} | Cliente: {cliente.toFixed(1)}
      </Text>
      {showProgress && (
        <div style={{ minWidth: 120, maxWidth: 200 }}>
          <Progress
            percent={barPercent}
            showInfo={false}
            strokeColor={color}
            trailColor={colors.backgroundGray || '#f0f0f0'}
            size="small"
          />
        </div>
      )}
    </Space>
  );
};

export default CapacidadeIndicator;
