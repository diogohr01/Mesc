import React, { memo } from 'react';
import { Card, Statistic, Tag, Typography } from 'antd';
import { colors } from '../../styles/colors';

const { Text } = Typography;

const variantStyles = {
  default: { borderLeft: `4px solid ${colors.primary}`, backgroundColor: '#fff' },
  copper: { borderLeft: '4px solid #d46b08', backgroundColor: '#fff7e6' },
  destructive: { borderLeft: '4px solid #ff4d4f', backgroundColor: '#fff2f0' },
};

const valueColors = {
  default: colors.primary,
  copper: '#d46b08',
  destructive: '#ff4d4f',
};

/**
 * Card de KPI com título, valor, ícone opcional, subtítulo e tendência.
 * @param {string} title - Título do KPI
 * @param {number|string} value - Valor exibido
 * @param {React.Component} icon - Componente de ícone (@ant-design/icons)
 * @param {string} [subtitle] - Subtítulo
 * @param {'default'|'copper'|'destructive'} [variant] - Variante visual
 * @param {{ value: string, positive: boolean }} [trend] - Tendência (ex.: { value: '+12%', positive: true })
 */
const KpiCard = memo(({ title, value, icon: Icon, subtitle, variant = 'default', trend }) => {
  const cardStyle = {
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    ...variantStyles[variant],
  };

  return (
    <Card size="small" style={cardStyle}>
      <Statistic
        title={title}
        value={value}
        valueStyle={{ color: valueColors[variant] }}
        prefix={Icon ? <Icon style={{ marginRight: 8, color: valueColors[variant] }} /> : undefined}
      />
      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {subtitle}
            </Text>
          )}
          {trend && (
            <Tag color={trend.positive ? 'green' : 'red'} style={{ margin: 0 }}>{trend.value}</Tag>
          )}
        </div>
      )}
    </Card>
  );
});

KpiCard.displayName = 'KpiCard';

export default KpiCard;
