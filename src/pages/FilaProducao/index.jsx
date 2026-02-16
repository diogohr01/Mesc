import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Layout, message, Row, Slider, Space, Table, Tag, Typography } from 'antd';
import { ThunderboltOutlined, UnorderedListOutlined, LockOutlined, LeftOutlined, RightOutlined, HolderOutlined, DeleteOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { AiOutlineClear } from 'react-icons/ai';
import { CapacidadeIndicator, Card, FilterModalForm, LoadingSpinner } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import { useFilaGanttFilterContext } from '../../contexts/FilaGanttFilterContext';
import { getUrgencyLevel, urgencyBarColors, urgencyColors } from '../../helpers/urgency';
import OrdemProducaoService from '../../services/ordemProducaoService';
import SequenciamentoService from '../../services/sequenciamentoService';
import { colors } from '../../styles/colors';
import ModalSequenciarOP from './Modals/ModalSequenciarOP';
import ModalConfirmarOP from './Modals/ModalConfirmarOP';
import ModalGerarOPs from './Modals/ModalGerarOPs';

dayjs.locale('pt-br');

const CAPACIDADE_TON = 30;
const FILA_PAGE_SIZE = 500;

const { Content } = Layout;
const { Text } = Typography;

function getDateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}

function getOrCreateSeq(sequenciasPorDia, dateKey) {
  if (!sequenciasPorDia[dateKey]) {
    return { ops: [], casaPct: 70, confirmada: false };
  }
  return sequenciasPorDia[dateKey];
}

const FilaProducao = () => {
  const [cenarios, setCenarios] = useState([]);
  const [cenarioAtivo, setCenarioAtivo] = useState(null);
  const [loadingCenarios, setLoadingCenarios] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroLiga, setFiltroLiga] = useState(undefined);
  const [filtroTempera, setFiltroTempera] = useState(undefined);
  const [allFilaData, setAllFilaData] = useState([]);
  const [loadingFila, setLoadingFila] = useState(false);
  const [sequenciasPorDia, setSequenciasPorDia] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [diaSequenciamento, setDiaSequenciamento] = useState(() => dayjs());
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [modalSequenciarOpen, setModalSequenciarOpen] = useState(false);
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);
  const [modalGerarOPsOpen, setModalGerarOPsOpen] = useState(false);
  const { searchTerm } = useFilterSearchContext();
  const { setCenarioId: setContextCenarioId, setFiltroTipo: setContextFiltroTipo } = useFilaGanttFilterContext();
  const [filterForm] = Form.useForm();

  const cenarioAtivoId = cenarioAtivo ?? (cenarios[0]?.id ?? null);
  const dateKey = getDateKey(diaSequenciamento);
  const currentSeq = getOrCreateSeq(sequenciasPorDia, dateKey);
  const casaPct = currentSeq.casaPct;
  const confirmada = currentSeq.confirmada;

  useEffect(() => {
    filterForm.setFieldsValue({
      diaSequenciamento: diaSequenciamento,
      filtroTipo,
      filtroLiga: filtroLiga ?? undefined,
      filtroTempera: filtroTempera ?? undefined,
    });
  }, [diaSequenciamento, filtroTipo, filtroLiga, filtroTempera, filterForm]);

  useEffect(() => {
    setContextCenarioId(cenarioAtivoId);
  }, [cenarioAtivoId, setContextCenarioId]);

  useEffect(() => {
    setContextFiltroTipo(filtroTipo);
  }, [filtroTipo, setContextFiltroTipo]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCenarios(true);
    SequenciamentoService.getAll({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled && res.success && res.data?.data) {
          const list = res.data.data;
          setCenarios(list);
          if (list.length && cenarioAtivo == null) setCenarioAtivo(list[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) message.error('Erro ao carregar cenários.');
      })
      .finally(() => {
        if (!cancelled) setLoadingCenarios(false);
      });
    return () => { cancelled = true; };
  }, []);

  const loadAllFila = useCallback(async () => {
    setLoadingFila(true);
    try {
      const response = await OrdemProducaoService.getFilaProducao({
        page: 1,
        pageSize: FILA_PAGE_SIZE,
        search: searchTerm?.trim() || undefined,
        cenarioId: cenarioAtivoId ?? undefined,
        filtroTipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
      });
      const data = response.data?.data || [];
      setAllFilaData(data);
    } catch (error) {
      message.error('Erro ao carregar a fila de produção.');
      console.error(error);
      setAllFilaData([]);
    } finally {
      setLoadingFila(false);
    }
  }, [searchTerm, cenarioAtivoId, filtroTipo]);

  useEffect(() => {
    loadAllFila();
  }, [loadAllFila]);

  const idsEmQualquerSequencia = useMemo(() => {
    const ids = new Set();
    Object.values(sequenciasPorDia).forEach((seq) => {
      (seq.ops || []).forEach((op) => ids.add(op.id));
    });
    return ids;
  }, [sequenciasPorDia]);

  const opsDisponiveis = useMemo(() => {
    let list = allFilaData.filter((op) => !idsEmQualquerSequencia.has(op.id));
    if (filtroLiga != null && filtroLiga !== '') {
      list = list.filter((op) => String(op.liga || '').toLowerCase() === String(filtroLiga).toLowerCase());
    }
    if (filtroTempera != null && filtroTempera !== '') {
      list = list.filter((op) => String(op.tempera || '').toLowerCase() === String(filtroTempera).toLowerCase());
    }
    if (searchTerm?.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (op) =>
          op.codigo?.toLowerCase().includes(term) ||
          op.produto?.toLowerCase().includes(term) ||
          op.cliente?.toLowerCase().includes(term)
      );
    }
    list.sort((a, b) => new Date(a.dataEntrega || 0) - new Date(b.dataEntrega || 0));
    return list;
  }, [allFilaData, idsEmQualquerSequencia, filtroLiga, filtroTempera, searchTerm]);

  const opcoesLiga = useMemo(() => {
    const set = new Set();
    allFilaData.forEach((op) => {
      if (op.liga != null && String(op.liga).trim()) set.add(String(op.liga).trim());
    });
    return Array.from(set).sort().map((v) => ({ value: v, label: v }));
  }, [allFilaData]);

  const opcoesTempera = useMemo(() => {
    const set = new Set();
    allFilaData.forEach((op) => {
      if (op.tempera != null && String(op.tempera).trim()) set.add(String(op.tempera).trim());
    });
    return Array.from(set).sort().map((v) => ({ value: v, label: v }));
  }, [allFilaData]);

  const handleAdicionarAoDia = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.info('Selecione pelo menos uma OP.');
      return;
    }
    const toAdd = opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id));
    if (toAdd.length === 0) return;
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      const newOps = [...(seq.ops || []), ...toAdd];
      return { ...prev, [dateKey]: { ...seq, ops: newOps } };
    });
    setSelectedRowKeys([]);
  }, [selectedRowKeys, opsDisponiveis, dateKey]);

  const handleRemoverDoDia = useCallback(
    (opId) => {
      setSequenciasPorDia((prev) => {
        const seq = getOrCreateSeq(prev, dateKey);
        const newOps = (seq.ops || []).filter((op) => op.id !== opId);
        return { ...prev, [dateKey]: { ...seq, ops: newOps } };
      });
    },
    [dateKey]
  );

  const handleReorderDia = useCallback(
    (result) => {
      if (!result.destination) return;
      const ops = [...currentSeq.ops];
      const [removed] = ops.splice(result.source.index, 1);
      ops.splice(result.destination.index, 0, removed);
      setSequenciasPorDia((prev) => ({ ...prev, [dateKey]: { ...currentSeq, ops } }));
    },
    [currentSeq, dateKey]
  );

  const handleConfirmarSequencia = useCallback(() => {
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      const totalTon = (seq.ops || []).reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      message.success(
        `Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} confirmada. ${(seq.ops || []).length} OPs, ${totalTon.toFixed(1)} ton.`
      );
      return { ...prev, [dateKey]: { ...seq, confirmada: true } };
    });
  }, [dateKey, diaSequenciamento]);

  const handlePrevDay = useCallback(() => {
    const next = dayjs(diaSequenciamento).subtract(1, 'day');
    setDiaSequenciamento(next);
  }, [diaSequenciamento]);

  const handleNextDay = useCallback(() => {
    const next = dayjs(diaSequenciamento).add(1, 'day');
    setDiaSequenciamento(next);
  }, [diaSequenciamento]);

  const handleSliderChange = useCallback(
    (value) => {
      const v = Array.isArray(value) ? value[0] : value;
      setSequenciasPorDia((prev) => {
        const seq = getOrCreateSeq(prev, dateKey);
        return { ...prev, [dateKey]: { ...seq, casaPct: v } };
      });
      if (v < 20 || v > 90) {
        message.warning(`Proporção extrema: ${v}% Casa / ${100 - v}% Cliente`);
      }
    },
    [dateKey]
  );

  const utilizadoTon = useMemo(() => {
    const ops = currentSeq.ops || [];
    return ops.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
  }, [currentSeq.ops]);

  const casaTon = useMemo(() => {
    const ops = (currentSeq.ops || []).filter((op) => op.tipo === 'casa');
    return ops.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
  }, [currentSeq.ops]);

  const clienteTon = useMemo(() => {
    const ops = (currentSeq.ops || []).filter((op) => op.tipo !== 'casa');
    return ops.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
  }, [currentSeq.ops]);

  const filterFormConfig = useMemo(
    () => [
      { columns: 1, questions: [{ type: 'period', id: 'period', noLabel: false, label: 'Período', size: 'middle' }] },
      {
        columns: 4,
        questions: [
          { type: 'date', id: 'diaSequenciamento', required: false, label: 'Dia do sequenciamento', size: 'middle', format: 'DD/MM/YYYY' },
          { type: 'select', id: 'filtroTipo', required: false, label: 'Tipo', size: 'middle', options: [{ value: 'todos', label: 'Todos' }, { value: 'casa', label: 'Casa' }, { value: 'cliente', label: 'Cliente' }] },
          { type: 'select', id: 'filtroLiga', required: false, label: 'Liga', size: 'middle', options: [{ value: '', label: 'Todos' }, ...(opcoesLiga || [])] },
          { type: 'select', id: 'filtroTempera', required: false, label: 'Têmpera', size: 'middle', options: [{ value: '', label: 'Todos' }, ...(opcoesTempera || [])] },
        ],
      },
    ],
    [opcoesLiga, opcoesTempera]
  );

  const handleFilter = useCallback(
    (values) => {
      if (values.diaSequenciamento) setDiaSequenciamento(dayjs(values.diaSequenciamento));
      if (values.filtroTipo !== undefined) setFiltroTipo(values.filtroTipo);
      if (values.filtroLiga !== undefined) setFiltroLiga(values.filtroLiga === '' ? undefined : values.filtroLiga);
      if (values.filtroTempera !== undefined) setFiltroTempera(values.filtroTempera === '' ? undefined : values.filtroTempera);
      loadAllFila();
    },
    [loadAllFila]
  );

  const columnsDisponiveis = useMemo(
    () => [
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 90, render: (v) => <Text strong style={{ fontFamily: 'monospace' }}>{v || '-'}</Text> },
      { title: 'Produto', dataIndex: 'produto', key: 'produto', width: 200, ellipsis: true },
      { title: 'Liga', dataIndex: 'liga', key: 'liga', width: 80, ellipsis: true },
      { title: 'Têmpera', dataIndex: 'tempera', key: 'tempera', width: 80, ellipsis: true },
      { title: 'Recurso', dataIndex: 'recurso', key: 'recurso', width: 100, ellipsis: true },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        width: 80,
        render: (tipo) => {
          const t = tipo || 'cliente';
          return t === 'casa' ? <Tag color="blue">CASA</Tag> : <Tag color="default">CLIENTE</Tag>;
        },
      },
      {
        title: 'Qtd (kg)',
        dataIndex: 'quantidade',
        key: 'quantidade',
        width: 90,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
      },
      {
        title: 'Necessário | Produzir',
        key: 'necessarioProduzir',
        width: 160,
        align: 'right',
        render: (_, record) => {
          const qtd = record.quantidade != null ? Number(record.quantidade) : 0;
          const perdaPct = record.percentualPerda != null ? Number(record.percentualPerda) : record.item?.percentualPerda;
          if (perdaPct == null || perdaPct === 0) return qtd > 0 ? <Text type="secondary">{qtd.toLocaleString('pt-BR')}</Text> : '-';
          const necessario = qtd;
          const produzir = Math.ceil(necessario / (1 - perdaPct / 100));
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Necessário: {necessario.toLocaleString('pt-BR')} | Produzir: {produzir.toLocaleString('pt-BR')} ({perdaPct}% perda)
            </Text>
          );
        },
      },
      {
        title: 'Entrega',
        dataIndex: 'dataEntrega',
        key: 'dataEntrega',
        width: 110,
        render: (v, record) => {
          const level = getUrgencyLevel(v, record.status);
          const color = urgencyColors[level];
          return <span style={{ color: color || undefined }}>{v ? dayjs(v).format('DD/MM/YYYY') : '-'}</span>;
        },
      },
    ],
    []
  );

  const selectedOPsComPerda = useMemo(() => {
    return opsDisponiveis.filter((op) => {
      if (!selectedRowKeys.includes(op.id)) return false;
      const perdaPct = op.percentualPerda != null ? Number(op.percentualPerda) : op.item?.percentualPerda;
      return perdaPct != null && perdaPct > 0;
    });
  }, [opsDisponiveis, selectedRowKeys]);

  const onRowDisponiveis = useCallback((record) => ({
    style: urgencyBarColors[getUrgencyLevel(record.dataEntrega, record.status)],
  }), []);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const filtrosNaTitulo = (
    <Space wrap size="small">
      <Space>
        <Button type="text" icon={<LeftOutlined />} onClick={handlePrevDay} />
        <Text strong style={{ minWidth: 220 }}>
          {diaSequenciamento.format('dddd DD/MM/YYYY')}
        </Text>
        <Button type="text" icon={<RightOutlined />} onClick={handleNextDay} />
      </Space>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Casa {casaPct}%</Text>
        <Slider
          min={0}
          max={100}
          step={5}
          value={casaPct}
          onChange={handleSliderChange}
          disabled={confirmada}
          style={{ width: 160, margin: 0 }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>Cliente {100 - casaPct}%</Text>
        {confirmada && (
          <Tag icon={<LockOutlined />} color="default">
            Confirmada
          </Tag>
        )}
      </div>
      {/*<Button icon={<UnorderedListOutlined />} onClick={() => setModalSequenciarOpen(true)}>
        Sequenciar OP
      </Button>*/}
     
      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={handleConfirmarSequencia}
        disabled={confirmada || (currentSeq.ops || []).length === 0}
      >
        Confirmar Sequência
      </Button>
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
          <Button
            icon={<AiOutlineClear />}
            onClick={() => {
              setFiltroTipo('todos');
              setFiltroLiga(undefined);
              setFiltroTempera(undefined);
              filterForm.resetFields();
              loadAllFila();
              setModalFiltrosOpen(false);
            }}
            size="middle"
          >
            Limpar
          </Button>
        }
      />
    </Space>
  );

  const opsDoDia = currentSeq.ops || [];

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Sequenciamento"
              subtitle="Ordenação por cenário de prioridade"
              icon={<ThunderboltOutlined style={{ color: colors.primary }} />}
              extra={filtrosNaTitulo}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <CapacidadeIndicator
                      utilizadoTon={utilizadoTon}
                      capacidadeTon={CAPACIDADE_TON}
                      casaTon={casaTon}
                      clienteTon={clienteTon}
                    />
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Card title="OPs Disponíveis" size="small" >
                      <Table
                        size="small"
                        rowKey="id"
                        loading={loadingFila}
                        dataSource={opsDisponiveis}
                        columns={columnsDisponiveis}
                        rowSelection={rowSelection}
                        onRow={onRowDisponiveis}
                        scroll={{ x: 'max-content' }}
                        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button type="primary" onClick={handleAdicionarAoDia} disabled={selectedRowKeys.length === 0}>
                          Adicionar ao Dia
                        </Button>
                      </div>
                      {selectedOPsComPerda.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                          {selectedOPsComPerda.map((op) => {
                            const qtd = Number(op.quantidade) || 0;
                            const perdaPct = op.percentualPerda != null ? Number(op.percentualPerda) : op.item?.percentualPerda || 0;
                            const produzir = Math.ceil(qtd / (1 - perdaPct / 100));
                            return (
                              <div key={op.id}>
                                {op.codigo}: Necessário: {qtd.toLocaleString('pt-BR')} | Produzir: {produzir.toLocaleString('pt-BR')} ({perdaPct}% perda)
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title={`Sequência do Dia — ${diaSequenciamento.format('DD/MM/YYYY')}`}
                      size="small"
                      extra={confirmada && <Tag icon={<LockOutlined />}>Confirmada</Tag>}
                    >
                      {opsDoDia.length === 0 ? (
                        <Text type="secondary">Nenhuma OP no dia. Selecione à esquerda e use "Adicionar ao Dia".</Text>
                      ) : (
                        <DragDropContext onDragEnd={handleReorderDia}>
                          <Droppable droppableId="sequencia-dia" isDropDisabled={confirmada}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 120 }}>
                                {opsDoDia.map((op, index) => (
                                  <Draggable key={op.id} draggableId={String(op.id)} index={index} isDragDisabled={confirmada}>
                                    {(prov, snap) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          padding: '6px 8px',
                                          marginBottom: 4,
                                          borderRadius: 6,
                                          border: '1px solid #f0f0f0',
                                          backgroundColor: snap.isDragging ? '#fafafa' : '#fff',
                                          ...prov.draggableProps.style,
                                        }}
                                      >
                                        <span {...prov.dragHandleProps} style={{ cursor: confirmada ? 'default' : 'grab' }}>
                                          <HolderOutlined style={{ color: '#999' }} />
                                        </span>
                                        <span style={{ width: 24, fontSize: 12, color: '#666' }}>{index + 1}.</span>
                                        <Text strong style={{ fontFamily: 'monospace', width: 80 }}>{op.codigo || '-'}</Text>
                                        <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{op.produto || '-'}</Text>
                                        <Tag color={op.tipo === 'casa' ? 'blue' : 'default'} style={{ margin: 0 }}>
                                          {op.tipo === 'casa' ? 'CASA' : 'CLIENTE'}
                                        </Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{op.liga || '-'} / {op.tempera || '-'}</Text>
                                        <Text style={{ fontSize: 12 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                                        <span style={{ color: urgencyColors[getUrgencyLevel(op.dataEntrega, op.status)] }}>
                                          {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM') : '-'}
                                        </span>
                                        {!confirmada && (
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoverDoDia(op.id)}
                                          />
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      )}
                      <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Follow-up: </Text>
                        <Space size="small">
                          <Tag>Prensa</Tag>
                          <Tag>Corte</Tag>
                          <Tag>Forno</Tag>
                          <Tag>Embalagem</Tag>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>
        <ModalSequenciarOP
          open={modalSequenciarOpen}
          onClose={() => setModalSequenciarOpen(false)}
          cenarios={cenarios}
          cenarioAtivoId={cenarioAtivoId}
          setCenarioAtivo={setCenarioAtivo}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          casaPct={casaPct}
          setCasaPct={(v) => handleSliderChange(v)}
          columns={columnsDisponiveis}
          fetchDataForSequenciarModal={async (page, pageSize) => {
            const res = await OrdemProducaoService.getFilaProducao({
              page,
              pageSize,
              cenarioId: cenarioAtivoId ?? undefined,
              filtroTipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
            });
            return { data: res.data?.data || [], total: res.data?.pagination?.totalRecords || 0 };
          }}
          onRow={onRowDisponiveis}
        />
        <ModalConfirmarOP open={modalConfirmarOpen} onClose={() => setModalConfirmarOpen(false)} />
        <ModalGerarOPs open={modalGerarOPsOpen} onClose={() => setModalGerarOPsOpen(false)} />
      </Content>
    </Layout>
  );
};

export default FilaProducao;
