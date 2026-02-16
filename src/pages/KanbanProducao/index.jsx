import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Layout, message, Row, Space, Typography } from 'antd';
import { AppstoreOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/pt-br';

dayjs.extend(isoWeek);
dayjs.locale('pt-br');
import { AiOutlineClear } from 'react-icons/ai';
import { Card, FilterModalForm, ScoreBadge, StyledScroll } from '../../components';
import { getUrgencyLevel, urgencyColors } from '../../helpers/urgency';
import OrdemProducaoService from '../../services/ordemProducaoService';
import { statusLabels } from '../../constants/ordemProducaoStatus';
import { colors } from '../../styles/colors';

const filterFormConfig = [
  {
    columns: 4,
    questions: [
      { type: 'text', id: 'numeroOPERP', required: false, placeholder: 'OP ERP...', label: 'OP ERP', size: 'middle' },
      { type: 'text', id: 'cliente', required: false, placeholder: 'Cliente...', label: 'Cliente', size: 'middle' },
      { type: 'select', id: 'filtroTipo', required: false, label: 'Tipo', size: 'middle', options: [{ value: 'todos', label: 'Todos' }, { value: 'casa', label: 'Casa' }, { value: 'cliente', label: 'Cliente' }] },
      { type: 'text', id: 'situacao', required: false, placeholder: 'Situação...', label: 'Situação', size: 'middle' },
      { type: 'date', id: 'dataOP', required: false, placeholder: 'Data...', label: 'Data', size: 'middle' },
    ],
  },
];

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

const getSemanaAtual = () => [
  dayjs().startOf('isoWeek'),
  dayjs().endOf('isoWeek'),
];

const KanbanProducao = () => {
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const [weekRange, setWeekRange] = useState(() => getSemanaAtual());

  const getOPsByStatus = useCallback((status) => ops.filter((op) => op.status === status), [ops]);

  const loadKanban = useCallback((filtros = {}) => {
    setLoading(true);
    const params = { ...filtros };
   
    if (params.dataOP && (params.dataOP.toISOString || dayjs.isDayjs(params.dataOP))) {
      params.dataOP = dayjs(params.dataOP).format('YYYY-MM-DD');
    }
    OrdemProducaoService.getDadosKanban(params)
      .then((res) => {
        if (res.success && res.data && res.data.ops) setOps(res.data.ops);
      })
      .catch(() => message.error('Erro ao carregar o Kanban.'))
      .finally(() => setLoading(false));
  }, [weekRange]);

  useEffect(() => {
    loadKanban(filterForm.getFieldsValue());
  }, [loadKanban]);

  const handleFilter = useCallback(() => {
    loadKanban(filterForm.getFieldsValue());
    setModalFiltrosOpen(false);
  }, [filterForm, loadKanban]);

  const handleLimparFiltros = useCallback(() => {
    filterForm.resetFields();
    loadKanban({});
    setModalFiltrosOpen(false);
  }, [filterForm, loadKanban]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Kanban de Produção"
              subtitle="Visão por status (apenas visual)"
              icon={<AppstoreOutlined style={{ color: colors.primary }} />}
              extra={
                <Space size="middle" wrap>
                  <DatePicker.RangePicker
                    value={weekRange}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) setWeekRange([dates[0], dates[1]]);
                    }}
                    format="DD/MM/YYYY"
                    placeholder={['Início', 'Fim']}
                    style={{ width: 240 }}
                  />
                  <FilterModalForm
                    open={modalFiltrosOpen}
                    onOpenChange={setModalFiltrosOpen}
                    formConfig={filterFormConfig}
                    formInstance={filterForm}
                    onSubmit={handleFilter}
                    secondaryButton={
                      <Button icon={<AiOutlineClear />} onClick={handleLimparFiltros} size="middle">
                        Limpar
                      </Button>
                    }
                  />
                </Space>
              }
              loading={loading}
            >
              <StyledScroll
                style={{
                  display: 'flex',
                  width: '100%',
                  gap: 16,
                  overflowX: 'auto',
                  paddingBottom: 16,
                  minHeight: 280,
                  flexWrap: 'nowrap',
                }}
                className="kanban-board-scroll"
              >
                {KANBAN_STATUSES.map((status) => {
                  const colOps = getOPsByStatus(status);
                  const borderColor = COLUMN_BORDER_COLORS[status] || colors.borderColor;
                  return (
                    <div
                      key={status}
                      className="kanban-column"
                      style={{
                        flex: '1 1 0',
                        minWidth: 240,
                        maxWidth: 380,
                        borderRadius: 8,
                        border: `1px solid ${colors.borderColor}`,
                        borderTopWidth: 3,
                        borderTopColor: borderColor,
                        background: '#fafafa',
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
                        <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.text.primary }}>
                          {statusLabels[status]}
                        </Text>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: colors.text.secondary, background: '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                          {colOps.length}
                        </span>
                      </div>
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
                        {colOps.map((op, i) => (
                          <KanbanCard
                            key={op.id}
                            op={op}
                            index={i}
                            isDragging={false}
                            onDragStart={() => {}}
                            onDragEnd={() => {}}
                          />
                        ))}
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
  const urgencyLevel = getUrgencyLevel(op.dataEntrega, op.status);
  const urgencyColor = urgencyColors[urgencyLevel];
  const borderLeft = urgencyLevel === 'critical' ? '3px solid #ff4d4f' : urgencyLevel === 'warning' ? '3px solid #faad14' : undefined;

  return (
    <div
      style={{
        borderRadius: 6,
        border: `1px solid ${colors.borderColor}`,
        borderLeft: borderLeft,
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
        <Text strong style={{ fontSize: 11, fontFamily: 'monospace' }}>{op.codigo || '-'}</Text>
        <ScoreBadge score={op.score ?? 0} size="sm" />
      </div>
      <Text ellipsis style={{ fontSize: 11, lineHeight: 1.3, color: colors.text.primary }}>
        {op.produto || '-'}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text type="secondary" style={{ fontSize: 9 }}>{op.cliente || '-'}</Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 9 }}>Liga {op.liga || '-'}</Text>
        <Text type="secondary" style={{ fontSize: 9 }}>•</Text>
        <Text type="secondary" style={{ fontSize: 9 }}>{op.tempera || '-'}</Text>
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            color: urgencyColor || colors.text.secondary,
            fontWeight: urgencyLevel === 'critical' ? 600 : 400,
          }}
        >
          {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM/YYYY') : '-'}
        </Text>
      </div>
      <Button
        type="text"
        size="small"
        icon={<EditOutlined />}
        onClick={(e) => { e.stopPropagation(); }}
        style={{ alignSelf: 'flex-start', padding: 0, height: 'auto', fontSize: 11 }}
      >
        Editar
      </Button>
    </div>
  );
}

export default KanbanProducao;
