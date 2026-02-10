import React, { useCallback, useEffect, useState } from 'react';
import { Col, Layout, message, Row, Typography } from 'antd';
import { AppstoreOutlined, HolderOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card, ScoreBadge, StyledScroll } from '../../components';
import OrdemProducaoService from '../../services/ordemProducaoService';
import { statusLabels } from '../../constants/ordemProducaoStatus';
import { colors } from '../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

const KANBAN_STATUSES = ['rascunho', 'sequenciada', 'aguardando_confirmacao', 'confirmada', 'em_producao', 'concluida'];

const COLUMN_BORDER_COLORS = {
  rascunho: '#8c8c8c',
  sequenciada: '#1890ff',
  aguardando_confirmacao: '#faad14',
  confirmada: '#1890ff',
  em_producao: '#fa8c16',
  concluida: '#52c41a',
};

const KanbanProducao = () => {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedOp, setDraggedOp] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const getOPsByStatus = useCallback((status) => ops.filter((op) => op.status === status), [ops]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    OrdemProducaoService.getDadosKanban()
      .then((res) => {
        if (!cancelled && res.success && res.data && res.data.ops) {
          setOps(res.data.ops);
        }
      })
      .catch(() => message.error('Erro ao carregar o Kanban.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDragStart = (e, op) => {
    setDraggedOp(op);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(op.id));
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(status);
  };

  const handleDragLeave = () => {
    setOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setOverColumn(null);
    if (!draggedOp || draggedOp.status === targetStatus) {
      setDraggedOp(null);
      return;
    }
    setOps((prev) =>
      prev.map((op) => (op.id === draggedOp.id ? { ...op, status: targetStatus } : op))
    );
    OrdemProducaoService.alterarStatus(draggedOp.id, targetStatus).catch(() => {});
    message.success(`${draggedOp.codigo} movida para ${statusLabels[targetStatus]}`);
    setDraggedOp(null);
  };

  const handleDragEnd = () => {
    setDraggedOp(null);
    setOverColumn(null);
  };

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Kanban de Produção"
              subtitle="Arraste os cards entre colunas para alterar o status"
              icon={<AppstoreOutlined style={{ color: colors.primary }} />}
              loading={loading}
            >
              <StyledScroll style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: 280 }}>
                {KANBAN_STATUSES.map((status) => {
                  const colOps = getOPsByStatus(status);
                  const isOver = overColumn === status;
                  const borderColor = COLUMN_BORDER_COLORS[status] || colors.borderColor;
                  return (
                    <div
                      key={status}
                      onDragOver={(e) => handleDragOver(e, status)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, status)}
                      style={{
                        flexShrink: 0,
                        width: 260,
                        borderRadius: 8,
                        border: `1px solid ${colors.borderColor}`,
                        borderTopWidth: 3,
                        borderTopColor: borderColor,
                        background: isOver ? 'rgba(24, 144, 255, 0.04)' : '#fafafa',
                        boxShadow: isOver ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : undefined,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${colors.borderColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.text.primary }}>
                          {statusLabels[status]}
                        </Text>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: colors.text.secondary, background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                          {colOps.length}
                        </span>
                      </div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
                        {colOps.map((op, i) => (
                          <KanbanCard
                            key={op.id}
                            op={op}
                            index={i}
                            isDragging={draggedOp?.id === op.id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                        {colOps.length === 0 && isOver && (
                          <div
                            style={{
                              border: '2px dashed rgba(24, 144, 255, 0.3)',
                              borderRadius: 6,
                              height: 80,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>Soltar aqui</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </StyledScroll>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

function KanbanCard({ op, index, isDragging, onDragStart, onDragEnd }) {
  const isLate =
    op.dataEntrega &&
    new Date(op.dataEntrega) < new Date() &&
    op.status !== 'concluida' &&
    op.status !== 'cancelada';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, op)}
      onDragEnd={onDragEnd}
      style={{
        borderRadius: 6,
        border: `1px solid ${colors.borderColor}`,
        borderLeft: isLate ? '3px solid #ff4d4f' : undefined,
        padding: 12,
        background: colors.white,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HolderOutlined style={{ fontSize: 14, color: colors.text.secondary }} />
          <Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{op.codigo || '-'}</Text>
        </div>
        <ScoreBadge score={op.score ?? 0} size="sm" />
      </div>
      <Text ellipsis style={{ fontSize: 12, lineHeight: 1.3, color: colors.text.primary }}>
        {op.produto || '-'}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>{op.cliente || '-'}</Text>
       
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>Liga {op.liga || '-'}</Text>
        <Text type="secondary" style={{ fontSize: 10 }}>•</Text>
        <Text type="secondary" style={{ fontSize: 10 }}>{op.tempera || '-'}</Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: isLate ? '#ff4d4f' : colors.text.secondary,
            fontWeight: isLate ? 600 : 400,
          }}
        >
          {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM/YYYY') : '-'}
        </Text>
      </div>
    </div>
  );
}

export default KanbanProducao;
