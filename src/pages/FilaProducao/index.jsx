import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Form, Layout, Row, Col, Space, Typography } from 'antd';
import {
  ThunderboltOutlined,
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  InboxOutlined,
  DownOutlined,
  RightOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { AiOutlineClear } from 'react-icons/ai';
import { Card, FilterModalForm } from '../../components';
import { useSequenciamento } from '../../contexts/SequenciamentoContext';
import StatusBadge from '../../components/Dashboard/StatusBadge';
import { getUrgencyLevel, urgencyColors } from '../../helpers/urgency';
import { colors } from '../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

function getDateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}

function formatDateKey(dateKey) {
  if (!dateKey || dateKey.length < 10) return dateKey;
  return `${dateKey.slice(8, 10)}/${dateKey.slice(5, 7)}/${dateKey.slice(0, 4)}`;
}

function formatDataEntrega(dataEntrega) {
  if (!dataEntrega) return '-';
  const d = dayjs(dataEntrega);
  return d.isValid() ? d.format('DD/MM') : '-';
}

/** Extrai texto de valor que pode ser string ou objeto { codigo, descricao } (evita "Objects are not valid as React child") */
function toLabel(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && (value.codigo != null || value.descricao != null)) {
    return value.descricao ?? value.codigo ?? '';
  }
  return String(value);
}

const FilaProducao = () => {
  const navigate = useNavigate();
  const { sequenciasPorDia } = useSequenciamento();
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [appliedDateKey, setAppliedDateKey] = useState(() => getDateKey(dayjs()));
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFiltroTipo, setAppliedFiltroTipo] = useState('todos');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [filterForm] = Form.useForm();

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 3,
        questions: [
          { type: 'date', id: 'dia', required: false, label: 'Dia', size: 'middle', format: 'DD/MM/YYYY' },
          { type: 'text', id: 'searchTerm', required: false, placeholder: 'OP, produto, cliente, OP Totvs...', label: 'Buscar', size: 'middle' },
          {
            type: 'select',
            id: 'filtroTipo',
            required: false,
            label: 'Tipo',
            size: 'middle',
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'casa', label: 'Casa' },
              { value: 'cliente', label: 'Cliente' },
            ],
          },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    if (modalFiltrosOpen) {
      filterForm.setFieldsValue({
        dia: appliedDateKey ? dayjs(appliedDateKey) : dayjs(),
        searchTerm: appliedSearchTerm,
        filtroTipo: appliedFiltroTipo,
      });
    }
  }, [modalFiltrosOpen, appliedDateKey, appliedSearchTerm, appliedFiltroTipo, filterForm]);

  // Só OPs do dia selecionado que estejam confirmadas
  const confirmedOPsDoDia = useMemo(() => {
    const seq = sequenciasPorDia[appliedDateKey];
    if (!seq || !seq.confirmada || !(seq.ops || []).length) return [];
    const dateLabel = formatDateKey(appliedDateKey);
    return (seq.ops || []).map((op) => ({ op, date: dateLabel }));
  }, [sequenciasPorDia, appliedDateKey]);

  const filtered = useMemo(() => {
    return confirmedOPsDoDia
      .filter(({ op }) => appliedFiltroTipo === 'todos' || (op.tipo || 'cliente') === appliedFiltroTipo)
      .filter(({ op }) => {
        if (!appliedSearchTerm || !appliedSearchTerm.trim()) return true;
        const term = appliedSearchTerm.trim().toLowerCase();
        return (
          toLabel(op.codigo).toLowerCase().includes(term) ||
          toLabel(op.produto).toLowerCase().includes(term) ||
          toLabel(op.cliente).toLowerCase().includes(term) ||
          toLabel(op.codigoPai).toLowerCase().includes(term)
        );
      });
  }, [confirmedOPsDoDia, appliedFiltroTipo, appliedSearchTerm]);

  const hasAnyConfirmedForDay = useMemo(() => {
    const seq = sequenciasPorDia[appliedDateKey];
    return !!(seq && seq.confirmada && (seq.ops || []).length > 0);
  }, [sequenciasPorDia, appliedDateKey]);

  const handleFilter = useCallback(() => {
    const values = filterForm.getFieldsValue();
    if (values?.dia) setAppliedDateKey(getDateKey(dayjs(values.dia)));
    setAppliedSearchTerm(values.searchTerm ?? '');
    setAppliedFiltroTipo(values.filtroTipo ?? 'todos');
    setModalFiltrosOpen(false);
  }, [filterForm]);

  const handleLimparFiltros = useCallback(() => {
    filterForm.resetFields();
    setAppliedDateKey(getDateKey(dayjs()));
    setAppliedSearchTerm('');
    setAppliedFiltroTipo('todos');
    setModalFiltrosOpen(false);
  }, [filterForm]);

  const toggleExpand = useCallback((key) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Fila de Produção"
              subtitle="Apenas ordens sequenciadas e confirmadas pelo PCP (por dia)"
              icon={<ThunderboltOutlined style={{ color: colors.primary }} />}
              extra={
                <FilterModalForm
                  open={modalFiltrosOpen}
                  onOpenChange={setModalFiltrosOpen}
                  formConfig={filterFormConfig}
                  formInstance={filterForm}
                  onSubmit={() => {
                    handleFilter();
                    setModalFiltrosOpen(false);
                  }}
                  secondaryButton={
                    <Button icon={<AiOutlineClear />} onClick={handleLimparFiltros} size="middle">
                      Limpar
                    </Button>
                  }
                />
              }
            >
              {!hasAnyConfirmedForDay && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 48,
                    textAlign: 'center',
                  }}
                >
                  <CalendarOutlined style={{ fontSize: 40, color: colors.text?.secondary || '#8c8c8c', marginBottom: 12, opacity: 0.5 }} />
                  <Text strong style={{ color: colors.text?.secondary, marginBottom: 4 }}>
                    Nenhuma sequência confirmada para este dia
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                    Acesse Sequenciamento, confirme a sequência do dia e escolha o dia no filtro para ver as OPs aqui.
                  </Text>
                  <Button type="primary" onClick={() => navigate('/sequenciamento')}>
                    Ir para Sequenciamento
                  </Button>
                </div>
              )}

              {hasAnyConfirmedForDay && filtered.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 32,
                    textAlign: 'center',
                  }}
                >
                  <InboxOutlined style={{ fontSize: 32, color: colors.text?.secondary || '#8c8c8c', marginBottom: 8, opacity: 0.5 }} />
                  <Text type="secondary">Nenhuma OP encontrada com os filtros atuais.</Text>
                </div>
              )}

              {hasAnyConfirmedForDay && filtered.length > 0 && (
                <Space direction="vertical" size={8} style={{ width: '100%', paddingTop: 8 }}>
                  {filtered.map(({ op, date }, idx) => {
                    const urgency = getUrgencyLevel(op.dataEntrega, op.status);
                    const rowKey = `${op.id}-${date}`;
                    const isExpanded = expandedIds.has(rowKey);
                    const borderLeftColor =
                      urgency === 'critical' ? '#ff4d4f' : urgency === 'warning' ? '#faad14' : '#52c41a';
                    const bgStyle =
                      urgency === 'critical'
                        ? { background: 'rgba(255,77,79,0.03)' }
                        : urgency === 'warning'
                          ? { background: 'rgba(250,173,20,0.03)' }
                          : {};

                    return (
                      <div
                        key={rowKey}
                        style={{
                          borderRadius: 8,
                          border: '1px solid #f0f0f0',
                          borderLeftWidth: 4,
                          borderLeftColor,
                          background: '#fff',
                          transition: 'all 0.2s',
                          ...bgStyle,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            flexWrap: 'wrap',
                          }}
                          onClick={() => toggleExpand(rowKey)}
                          onKeyDown={(e) => e.key === 'Enter' && toggleExpand(rowKey)}
                          role="button"
                          tabIndex={0}
                        >
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                              background: colors.backgroundGray,
                              fontSize: 9,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              color: colors.text?.secondary ?? '#666',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </span>
                          {isExpanded ? (
                            <DownOutlined style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }} />
                          ) : (
                            <RightOutlined style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }} />
                          )}
                          <Space size={6} wrap style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ fontFamily: 'monospace', fontSize: 11 }}>
                              {toLabel(op.codigo) || '-'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>→</Text>
                            <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                              {toLabel(op.codigoPai) || '-'}
                            </Text>
                            <span style={{ width: 1, height: 12, background: '#e8e8e8' }} />
                            <Text ellipsis style={{ maxWidth: 180, fontSize: 10 }}>{toLabel(op.produto) || '-'}</Text>
                            <Text type="secondary" ellipsis style={{ maxWidth: 120, fontSize: 10 }}>{toLabel(op.cliente) || '-'}</Text>
                            <span style={{ width: 1, height: 12, background: '#e8e8e8' }} />
                            <span
                              style={{
                                fontSize: 9,
                                fontFamily: 'monospace',
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: colors.backgroundGray,
                                border: '1px solid #e8e8e8',
                                color: colors.text?.primary,
                              }}
                            >
                              {toLabel(op.liga) || '-'}
                            </span>
                            <Text type="secondary" style={{ fontSize: 9, fontFamily: 'monospace' }}>{op.tempera || '-'}</Text>
                            {toLabel(op.ferramenta) && (
                              <>
                                <span style={{ width: 1, height: 12, background: '#e8e8e8' }} />
                                <Text type="secondary" style={{ fontSize: 9, fontFamily: 'monospace' }}>{toLabel(op.ferramenta)}</Text>
                              </>
                            )}
                            <span style={{ width: 1, height: 12, background: '#e8e8e8' }} />
                            <Text strong style={{ fontSize: 9, fontFamily: 'monospace' }}>
                              {((Number(op.quantidade) || 0) / 1000).toFixed(2)}t
                            </Text>
                            {(op.tipo || 'cliente') === 'casa' ? (
                              <HomeOutlined style={{ color: colors.primary, fontSize: 12 }} />
                            ) : (
                              <TeamOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                            )}
                          </Space>
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: 'monospace',
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: colors.backgroundGray,
                              border: '1px solid #e8e8e8',
                              color: colors.text?.secondary,
                              flexShrink: 0,
                            }}
                          >
                            {date}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontFamily: 'monospace',
                              padding: '1px 5px',
                              borderRadius: 4,
                              flexShrink: 0,
                              color: urgencyColors[urgency] || undefined,
                            }}
                          >
                            {formatDataEntrega(op.dataEntrega)}
                          </span>
                          <StatusBadge status={op.status} />
                        </div>

                        {isExpanded && (
                          <div
                            style={{
                              borderTop: '1px solid #f0f0f0',
                              padding: '8px 12px',
                              background: 'rgba(0,0,0,0.02)',
                            }}
                          >
                            <Space size="middle" wrap style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>
                              <span>OP Totvs: <Text strong style={{ fontFamily: 'monospace', fontSize: 10 }}>{toLabel(op.codigoPai) || '-'}</Text></span>
                              <span>Qtd: <Text strong style={{ fontFamily: 'monospace', fontSize: 10 }}>{(op.quantidade || 0).toLocaleString('pt-BR')} kg</Text></span>
                              {toLabel(op.ferramenta) && <span>Ferramenta: <Text strong style={{ fontFamily: 'monospace', fontSize: 10 }}>{toLabel(op.ferramenta)}</Text></span>}
                              {toLabel(op.recurso) && <span>Recurso: <Text strong style={{ fontSize: 10 }}>{toLabel(op.recurso)}</Text></span>}
                              <span>Programada: <Text strong style={{ fontSize: 10 }}>{date}</Text></span>
                            </Space>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 10,
                                color: colors.primary,
                                background: 'rgba(36,59,94,0.08)',
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(36,59,94,0.2)',
                              }}
                            >
                              <PlayCircleOutlined style={{ fontSize: 12 }} />
                              <span>Sequenciada — aguardando início do processo produtivo</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default FilaProducao;
