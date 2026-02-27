import React from 'react';
import { Button, Select, Space, Tag, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Lista de itens em preview (Totvs adicionados, ainda não confirmados).
 * Cada item tem dropdown de ferramenta e botão remover; destaque para semFerramenta.
 * Apenas apresentação; callbacks vêm via props.
 */
export default function PreviewList({
  preview,
  dateKey,
  updatePreviewItem,
  removePreviewItem,
  ferramentasOptions,
}) {
  if (!preview || preview.length === 0) return null;

  const totalTon = preview.reduce((s, p) => s + (Number(p.quantidade) || 0) / 1000, 0);

  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 8,
        border: '1px solid #faad14',
        background: 'rgba(250, 173, 20, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(250, 173, 20, 0.2)',
          background: 'rgba(250, 173, 20, 0.08)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <WarningOutlined style={{ color: '#faad14' }} />
          Preview — {preview.length} item(ns) aguardando confirmação
        </span>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {totalTon.toFixed(1)} ton
        </Text>
      </div>
      <div style={{ padding: 8 }}>
        {preview.map((item, i) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              marginBottom: 4,
              borderRadius: 4,
              border: item.semFerramenta ? '1px solid #ff4d4f' : '1px solid #f0f0f0',
              background: item.semFerramenta ? 'rgba(255, 77, 79, 0.05)' : '#fff',
              fontSize: 12,
            }}
          >
            <span style={{ width: 24, fontSize: 11, fontWeight: 600, color: '#faad14' }}>{i + 1}</span>
            <Text strong style={{ fontFamily: 'monospace', width: 80, fontSize: 12 }}>
              {item.opTotvsCodigo || '-'}
            </Text>
            <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
              {item.produto || '-'}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {item.liga || '-'} / {item.tempera || '-'}
            </Text>
            <Text style={{ fontSize: 11 }}>{(Number(item.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {item.cliente || '-'}
            </Text>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Ferramenta"
              value={item.ferramentaManual || item.ferramentaSugerida || undefined}
              onChange={(codigo) => {
                updatePreviewItem(dateKey, item.id, {
                  ferramentaManual: codigo || null,
                  semFerramenta: !(codigo || item.ferramentaSugerida),
                });
              }}
              options={ferramentasOptions}
              style={{ width: 180 }}
            />
            {item.semFerramenta && (
              <Tag color="error" style={{ margin: 0, fontSize: 10 }}>
                SEM FERRAMENTA
              </Tag>
            )}
            <Button
              type="text"
              danger
              size="small"
              onClick={() => removePreviewItem(dateKey, item.id)}
              style={{ padding: '0 4px' }}
            >
              Remover
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
