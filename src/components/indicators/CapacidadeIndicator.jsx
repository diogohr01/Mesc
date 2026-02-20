import React from 'react';
import { Progress, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
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
  filtroTipo = 'casa',
  casaTon = 0,
  clienteTon = 0,
  casaCap = 18,
  clienteCap = 12,
  showProgress = true,
}) => {
  const casa = Number(casaTon) || 0;
  const cliente = Number(clienteTon) || 0;
  const capCasa = Number(casaCap) || 18;
  const capCliente = Number(clienteCap) || 12;

  const isTodos = filtroTipo === 'todos';

  const mainTon = isTodos ? casa + cliente : (filtroTipo === 'casa' ? casa : cliente);
  const mainCap = isTodos ? capCasa + capCliente : (filtroTipo === 'casa' ? capCasa : capCliente);
  const mainLabel = isTodos ? 'Total' : (filtroTipo === 'casa' ? 'Casa' : 'Cliente');

  const otherTon = filtroTipo === 'casa' ? cliente : casa;
  const otherCap = filtroTipo === 'casa' ? capCliente : capCasa;
  const otherLabel = filtroTipo === 'casa' ? 'Cliente' : 'Casa';

  const mainPercent = mainCap > 0 ? Math.min(Math.round((mainTon / mainCap) * 100), 999) : 0;
  const otherPercent = otherCap > 0 ? Math.min(Math.round((otherTon / otherCap) * 100), 999) : 0;
  const barPercent = Math.min(mainPercent, 100);
  const color = getColorByPercent(mainPercent);

  const casaPercent = capCasa > 0 ? Math.min(Math.round((casa / capCasa) * 100), 999) : 0;
  const clientePercent = capCliente > 0 ? Math.min(Math.round((cliente / capCliente) * 100), 999) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Text strong style={{ fontSize: 13, fontFamily: 'monospace' }}>
        {mainLabel}: {mainTon.toFixed(1)} / {mainCap} ton
      </Text>
      {showProgress && (
        <>
          <div style={{ flex: 1 }}>
            <Progress
              percent={barPercent}
              showInfo={false}
              strokeColor={color}
              trailColor={colors.backgroundGray || '#f0f0f0'}
              size="small"
            />
          </div>
          <Text style={{ fontSize: 13, minWidth: 36 }}>{mainPercent}%</Text>
        </>
      )}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: colors.backgroundGray || '#f0f0f0',
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        <InfoCircleOutlined style={{ color: colors.text.secondary }} />
        <Text type="secondary" style={{ fontSize: 12, margin: 0 }}>
          {isTodos
            ? `Casa: ${casa.toFixed(1)}/${capCasa} ton (${casaPercent}%) · Cliente: ${cliente.toFixed(1)}/${capCliente} ton (${clientePercent}%)`
            : `${otherLabel}: ${otherTon.toFixed(1)}/${otherCap} ton (${otherPercent}%)`}
        </Text>
      </div>
    </div>
  );
};

export default CapacidadeIndicator;
