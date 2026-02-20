import React from 'react';
import { Collapse, Space, Tag, Typography } from 'antd';
import { DownOutlined, RightOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import StatusBadge from '../../../components/Dashboard/StatusBadge';
import { getUrgencyLevel, urgencyBarColors, urgencyColors } from '../../../helpers/urgency';
import { colors } from '../../../styles/colors';

const { Text } = Typography;

function formatDataEntrega(dataEntrega) {
  if (!dataEntrega) return '-';
  const d = dayjs(dataEntrega);
  return d.isValid() ? d.format('DD/MM') : '-';
}

function FilaProducaoListItem({ item, index, date }) {
  const { op } = item;
  const urgency = getUrgencyLevel(op.dataEntrega, op.status);
  const barStyle = urgencyBarColors[urgency] || {};
  const quantidadeTon = (Number(op.quantidade) || 0) / 1000;

  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '8px 0',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          background: colors.backgroundGray,
          fontSize: 11,
          fontWeight: 600,
          color: colors.text?.secondary || '#666',
        }}
      >
        {index + 1}
      </span>
      <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
        {op.codigo || '-'}
      </Text>
      <Text type="secondary" style={{ fontSize: 12 }}>→</Text>
      <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
        {op.codigoPai || '-'}
      </Text>
      <span style={{ width: 1, height: 14, background: '#e8e8e8' }} />
      <Text ellipsis style={{ maxWidth: 180, fontSize: 12 }}>{op.produto || '-'}</Text>
      <Text type="secondary" ellipsis style={{ maxWidth: 120, fontSize: 12 }}>{op.cliente || '-'}</Text>
      <span style={{ width: 1, height: 14, background: '#e8e8e8' }} />
      <Tag style={{ margin: 0, fontSize: 10 }}>{op.liga || '-'}</Tag>
      <Text type="secondary" style={{ fontSize: 11 }}>{op.tempera || '-'}</Text>
      {op.ferramenta && (
        <>
          <span style={{ width: 1, height: 14, background: '#e8e8e8' }} />
          <Text type="secondary" style={{ fontSize: 11 }}>{op.ferramenta}</Text>
        </>
      )}
      <span style={{ width: 1, height: 14, background: '#e8e8e8' }} />
      <Text strong style={{ fontSize: 11 }}>{quantidadeTon.toFixed(2)}t</Text>
      {op.tipo === 'casa' ? (
        <HomeOutlined style={{ color: colors.primary, fontSize: 14 }} />
      ) : (
        <TeamOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
      )}
      <Text type="secondary" style={{ fontSize: 10 }}>{date}</Text>
      <Text
        style={{
          fontSize: 10,
          color: urgencyColors[urgency] || undefined,
        }}
      >
        {formatDataEntrega(op.dataEntrega)}
      </Text>
      <StatusBadge status={op.status} />
    </div>
  );

  const expandContent = (
    <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 4, marginTop: 4 }}>
      <Space size="middle" wrap style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
        <span>OP Totvs: <Text strong style={{ color: colors.text?.primary }}>{op.codigoPai || '-'}</Text></span>
        <span>Qtd: <Text strong>{(op.quantidade || 0).toLocaleString('pt-BR')} kg</Text></span>
        {op.ferramenta && <span>Ferramenta: <Text strong>{op.ferramenta}</Text></span>}
        {op.recurso && <span>Recurso: <Text strong>{op.recurso}</Text></span>}
        <span>Programada: <Text strong>{date}</Text></span>
      </Space>
      <div style={{ fontSize: 12, color: colors.primary, background: 'rgba(36,59,94,0.08)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(36,59,94,0.2)' }}>
        Sequenciada — aguardando início do processo produtivo
      </div>
    </div>
  );

  return (
    <div
      style={{
        marginBottom: 8,
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        background: '#fff',
        ...barStyle,
      }}
    >
      <Collapse
        ghost
        expandIconPosition="start"
        expandIcon={({ isActive }) => (isActive ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />)}
        items={[
          {
            key: '1',
            label: header,
            children: expandContent,
          },
        ]}
      />
    </div>
  );
}

export default FilaProducaoListItem;
