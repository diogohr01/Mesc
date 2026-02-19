import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, Input, Layout, message, Modal, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { ThunderboltOutlined, LockOutlined, LeftOutlined, RightOutlined, HolderOutlined, DeleteOutlined, InfoCircleOutlined, HomeOutlined, TeamOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { AiOutlineClear } from 'react-icons/ai';
import { CapacidadeIndicator, Card, FilterModalForm, LoadingSpinner, PaginatedTable } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import { useFilaGanttFilterContext } from '../../contexts/FilaGanttFilterContext';
import { getUrgencyLevel, urgencyBarColors, urgencyColors } from '../../helpers/urgency';
import StatusBadge from '../../components/Dashboard/StatusBadge';
import { statusRowTint } from '../../constants/ordemProducaoStatus';
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

function buildSequenciamentoPayload(dateKey, sequenciasPorDia, capacidadeTon = 30) {
  const seq = sequenciasPorDia[dateKey];
  if (!seq) {
    return { data: dateKey, confirmada: false, capacidade: { casaPct: 70, clientePct: 30, casaCap: capacidadeTon * 0.7, clienteCap: capacidadeTon * 0.3 }, sequencia: [] };
  }
  const casaPct = seq.casaPct ?? 70;
  const clientePct = 100 - casaPct;
  const casaCap = (capacidadeTon * casaPct) / 100;
  const clienteCap = (capacidadeTon * clientePct) / 100;
  const ops = seq.ops || [];
  const sequencia = ops.map((op, index) => ({
    idOP: op.id,
    ordem: index + 1,
    tipo: op.tipo || 'cliente',
    quantidade: op.quantidade,
    ferramenta: op.recurso || op.ferramenta || '',
  }));
  return {
    data: dateKey,
    confirmada: !!seq.confirmada,
    capacidade: { casaPct, clientePct, casaCap, clienteCap },
    sequencia,
  };
}

const FilaProducao = () => {
  const [cenarios, setCenarios] = useState([]);
  const [cenarioAtivo, setCenarioAtivo] = useState(null);
  const [loadingCenarios, setLoadingCenarios] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('casa');
  const [filtroListaOPs, setFiltroListaOPs] = useState('disponiveis'); // 'disponiveis' | 'selecionadas'
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
  const [justificativaModal, setJustificativaModal] = useState(null);
  const [justificativaTexto, setJustificativaTexto] = useState('');
  const tableDisponiveisRef = useRef(null);
  const { searchTerm } = useFilterSearchContext();
  const { setCenarioId: setContextCenarioId, setFiltroTipo: setContextFiltroTipo } = useFilaGanttFilterContext();
  const [filterForm] = Form.useForm();

  const cenarioAtivoId = cenarioAtivo ?? (cenarios[0]?.id ?? null);
  const dateKey = getDateKey(diaSequenciamento);
  const currentSeq = getOrCreateSeq(sequenciasPorDia, dateKey);
  const casaPct = currentSeq.casaPct;
  const confirmada = currentSeq.confirmada; // pós-confirmação: só visualização (sem adicionar, reordenar, remover ou editar)

  useEffect(() => {
    filterForm.setFieldsValue({
      diaSequenciamento: diaSequenciamento,
      filtroLiga: filtroLiga ?? undefined,
      filtroTempera: filtroTempera ?? undefined,
    });
  }, [diaSequenciamento, filtroLiga, filtroTempera, filterForm]);

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
        filtroTipo: filtroTipo === 'casa' || filtroTipo === 'cliente' ? filtroTipo : undefined,
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
    const toAddWithFlag = toAdd.map((op) => ({ ...op, jaSequenciada: true }));
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      const newOps = [...(seq.ops || []), ...toAddWithFlag];
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

  const handleRemoverTodos = useCallback(() => {
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      return { ...prev, [dateKey]: { ...seq, ops: [] } };
    });
  }, [dateKey]);

  const handleReorderDia = useCallback(
    (result) => {
      if (!result.destination) return;
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;
      const ops = [...currentSeq.ops];
      const [removed] = ops.splice(sourceIndex, 1);
      ops.splice(destIndex, 0, removed);
      const movedDataEntrega = removed.dataEntrega ? new Date(removed.dataEntrega).getTime() : 0;
      let precisaJustificativa = false;
      if (destIndex > sourceIndex) {
        for (let j = 0; j < destIndex; j++) {
          const otherDataEntrega = ops[j].dataEntrega ? new Date(ops[j].dataEntrega).getTime() : 0;
          if (otherDataEntrega > movedDataEntrega) {
            precisaJustificativa = true;
            break;
          }
        }
      }
      if (precisaJustificativa) {
        setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
        setJustificativaTexto('');
      }
      setSequenciasPorDia((prev) => ({ ...prev, [dateKey]: { ...currentSeq, ops } }));
    },
    [currentSeq, dateKey]
  );

  const handleReorderDiaTab = useCallback(
    (result) => {
      if (!result.destination) return;
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;
      const fullOpsCurrent = currentSeq.ops || [];
      const otherOps = fullOpsCurrent.filter((op) => (op.tipo || 'cliente') !== filtroTipo);
      const tabOps = fullOpsCurrent.filter((op) => (op.tipo || 'cliente') === filtroTipo);
      const [removed] = tabOps.splice(sourceIndex, 1);
      tabOps.splice(destIndex, 0, removed);
      const movedDataEntrega = removed.dataEntrega ? new Date(removed.dataEntrega).getTime() : 0;
      let precisaJustificativa = false;
      if (destIndex > sourceIndex) {
        for (let j = 0; j < destIndex; j++) {
          const otherDataEntrega = tabOps[j].dataEntrega ? new Date(tabOps[j].dataEntrega).getTime() : 0;
          if (otherDataEntrega > movedDataEntrega) {
            precisaJustificativa = true;
            break;
          }
        }
      }
      if (precisaJustificativa) {
        setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
        setJustificativaTexto('');
      }
      const fullOps = filtroTipo === 'casa' ? [...tabOps, ...otherOps] : [...otherOps, ...tabOps];
      setSequenciasPorDia((prev) => ({ ...prev, [dateKey]: { ...currentSeq, ops: fullOps } }));
    },
    [currentSeq, dateKey, filtroTipo]
  );

  const handleConfirmarSequencia = useCallback(() => {
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      const opsSeq = seq.ops || [];
      const casaTonSeq = opsSeq.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      const clienteTonSeq = opsSeq.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      const casaCap = (CAPACIDADE_TON * (seq.casaPct || 70)) / 100;
      const clienteCap = (CAPACIDADE_TON * (100 - (seq.casaPct || 70))) / 100;
      if (casaTonSeq > casaCap || clienteTonSeq > clienteCap) {
        message.warning('Capacidade excedida — excedente será rolado para o próximo dia');
      }
      const totalTon = opsSeq.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      message.success(
        `Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} confirmada. ${opsSeq.length} OPs, ${totalTon.toFixed(1)} ton.`
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
        columns: 3,
        questions: [
          { type: 'date', id: 'diaSequenciamento', required: false, label: 'Dia do sequenciamento', size: 'middle', format: 'DD/MM/YYYY' },
          { type: 'select', id: 'filtroLiga', required: false, label: 'Liga', size: 'middle', options: [{ value: '', label: 'Todos' }, ...(opcoesLiga || [])] },
          { type: 'select', id: 'filtroTempera', required: false, label: 'Têmpera', size: 'middle', options: [{ value: '', label: 'Todos' }, ...(opcoesTempera || [])] },
        ],
      },
    ],
    [opcoesLiga, opcoesTempera]
  );

  const handleFilter = useCallback(
    (values) => {
      if (values?.diaSequenciamento) setDiaSequenciamento(dayjs(values.diaSequenciamento));
      if (values?.filtroLiga !== undefined) setFiltroLiga(values.filtroLiga === '' ? undefined : values.filtroLiga);
      if (values?.filtroTempera !== undefined) setFiltroTempera(values.filtroTempera === '' ? undefined : values.filtroTempera);
      loadAllFila();
    },
    [loadAllFila]
  );

  const columnsDisponiveis = useMemo(
    () => [
      {
        title: '',
        key: 'contingencia',
        width: 56,
        render: (_, record) =>
          record.contingencia ? (
            <Tooltip title="OP criada manualmente (contingência)">
              <Space size={4}>
                <InfoCircleOutlined style={{ color: '#faad14' }} />
                <Tag color="orange" style={{ margin: 0 }}>Manual</Tag>
              </Space>
            </Tooltip>
          ) : null,
      },
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
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status) => <StatusBadge status={status} />,
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

  const opsParaTabela = useMemo(() => {
    if (filtroListaOPs === 'selecionadas') {
      return opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id));
    }
    return opsDisponiveis;
  }, [filtroListaOPs, opsDisponiveis, selectedRowKeys]);

  const fetchDataDisponiveis = useCallback(async (page, pageSize) => {
    const start = (page - 1) * pageSize;
    const data = opsParaTabela.slice(start, start + pageSize);
    return { data, total: opsParaTabela.length };
  }, [opsParaTabela]);

  useEffect(() => {
    tableDisponiveisRef.current?.reloadTable?.();
  }, [opsParaTabela]);

  const onRowDisponiveis = useCallback((record) => {
    const id = record.id;
    const statusTint = statusRowTint[record.status] || { backgroundColor: 'transparent', borderLeft: '4px solid transparent' };
    return {
      style: {
        cursor: 'pointer',
        ...statusTint,
      },
      onClick: () => {
        setSelectedRowKeys((prev) =>
          prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
        );
      },
    };
  }, []);

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
          handleFilter(filterForm.getFieldsValue());
          setModalFiltrosOpen(false);
        }}
        secondaryButton={
          <Button
            icon={<AiOutlineClear />}
            onClick={() => {
              setFiltroTipo('casa');
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
  const seqDiaAtiva = useMemo(
    () => opsDoDia.filter((op) => (op.tipo || 'cliente') === filtroTipo),
    [opsDoDia, filtroTipo]
  );

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
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Button
          type={filtroTipo === 'casa' ? 'primary' : 'default'}
          icon={<HomeOutlined />}
          onClick={() => setFiltroTipo('casa')}
        >
          Casa (18 Ton)
        </Button>
        <Button
          type={filtroTipo === 'cliente' ? 'primary' : 'default'}
          icon={<TeamOutlined />}
          onClick={() => setFiltroTipo('cliente')}
        >
          Cliente (12 Ton)
        </Button>
        {confirmada && (
          <Tag icon={<LockOutlined />} color="default">
            Confirmada
          </Tag>
        )}
      </div>
                    <CapacidadeIndicator
                      utilizadoTon={utilizadoTon}
                      capacidadeTon={CAPACIDADE_TON}
                      casaTon={casaTon}
                      clienteTon={clienteTon}
                    />
                  </Col>
                </Row>
                {seqDiaAtiva.length > 0 && (
                <Row gutter={16}>
                  <Col span={24}>
                    <Card
                      title={
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Sequência — {diaSequenciamento.format('DD/MM')} • {filtroTipo === 'casa' ? 'Casa' : 'Cliente'}
                          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>({seqDiaAtiva.length} OPs)</Text>
                        </span>
                      }
                      size="small"
                      bodyStyle={{ padding: '8px 12px' }}
                      extra={
                        <Space size="small">
                          {!confirmada && (
                            <Button danger size="small" icon={<DeleteOutlined />} onClick={handleRemoverTodos}>
                              Remover todos
                            </Button>
                          )}
                          {confirmada && <Tag icon={<LockOutlined />}>Confirmada</Tag>}
                        </Space>
                      }
                    >
                      <DragDropContext onDragEnd={handleReorderDiaTab}>
                        <Droppable droppableId="sequencia-dia-tab" isDropDisabled={confirmada}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 60 }}>
                              {seqDiaAtiva.map((op, index) => (
                                <Draggable key={op.id} draggableId={String(op.id)} index={index} isDragDisabled={confirmada || seqDiaAtiva.length === 1}>
                                  {(prov, snap) => (
                                    <div
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 6px',
                                        marginBottom: 2,
                                        borderRadius: 4,
                                        border: '1px solid #f0f0f0',
                                        backgroundColor: snap.isDragging ? '#fafafa' : '#fff',
                                        fontSize: 12,
                                        ...prov.draggableProps.style,
                                      }}
                                    >
                                      {seqDiaAtiva.length > 1 && (
                                        <span {...prov.dragHandleProps} style={{ cursor: confirmada ? 'default' : 'grab' }}>
                                          <HolderOutlined style={{ color: '#999', fontSize: 12 }} />
                                        </span>
                                      )}
                                      {seqDiaAtiva.length === 1 && <span style={{ width: 16, display: 'inline-block' }} />}
                                      <span style={{ width: 20, fontSize: 11, color: '#666' }}>{index + 1}.</span>
                                      <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>{op.codigo || '-'}</Text>
                                      {op.contingencia && (
                                        <Tooltip title="OP criada manualmente (contingência)">
                                          <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                                        </Tooltip>
                                      )}
                                      <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{op.produto || '-'}</Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>{op.liga || '-'} / {op.tempera || '-'}</Text>
                                      <Text style={{ fontSize: 11 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                                      <span style={{ fontSize: 11, color: urgencyColors[getUrgencyLevel(op.dataEntrega, op.status)] }}>
                                        {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM') : '-'}
                                      </span>
                                      {!confirmada && (
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() => handleRemoverDoDia(op.id)}
                                          style={{ padding: '0 4px' }}
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
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #f0f0f0' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Follow-up: </Text>
                        <Space size="small">
                          <Tag style={{ margin: 0, fontSize: 10 }}>Prensa</Tag>
                          <Tag style={{ margin: 0, fontSize: 10 }}>Corte</Tag>
                          <Tag style={{ margin: 0, fontSize: 10 }}>Forno</Tag>
                          <Tag style={{ margin: 0, fontSize: 10 }}>Embalagem</Tag>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                </Row>
                )}
                <Row gutter={16}>
                  <Col span={24}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <Space size="middle">
                          <span style={{ fontWeight: 600, fontSize: 14 }}>OPs Disponíveis</span>
                          <Space size="small">
                            <Button
                              type={filtroListaOPs === 'disponiveis' ? 'primary' : 'default'}
                              size="small"
                              onClick={() => setFiltroListaOPs('disponiveis')}
                            >
                              Disponíveis ({opsDisponiveis.length})
                            </Button>
                            <Button
                              type={filtroListaOPs === 'selecionadas' ? 'primary' : 'default'}
                              size="small"
                              onClick={() => setFiltroListaOPs('selecionadas')}
                            >
                              Selecionadas ({selectedRowKeys.length})
                            </Button>
                          </Space>
                        </Space>
                        <Button type="primary" onClick={handleAdicionarAoDia} disabled={selectedRowKeys.length === 0 || confirmada}>
                          Adicionar ao Dia
                        </Button>
                      </div>
                      <PaginatedTable
                        ref={tableDisponiveisRef}
                        fetchData={fetchDataDisponiveis}
                        initialPageSize={10}
                        columns={columnsDisponiveis}
                        rowKey="id"
                        loadingIcon={<LoadingSpinner />}
                        disabled={loadingFila}
                        scroll={{ x: 'max-content' }}
                        onRow={onRowDisponiveis}
                        rowSelection={rowSelection}
                      />
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
                    </div>
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
              filtroTipo: filtroTipo === 'casa' || filtroTipo === 'cliente' ? filtroTipo : undefined,
            });
            return { data: res.data?.data || [], total: res.data?.pagination?.totalRecords || 0 };
          }}
          onRow={onRowDisponiveis}
        />
        <ModalConfirmarOP open={modalConfirmarOpen} onClose={() => setModalConfirmarOpen(false)} />
        <ModalGerarOPs open={modalGerarOPsOpen} onClose={() => setModalGerarOPsOpen(false)} />
        <Modal
          title="Justificativa — alteração de prioridade"
          open={!!justificativaModal}
          onCancel={() => setJustificativaModal(null)}
          onOk={() => {
            message.info(justificativaTexto ? `Justificativa registrada: ${justificativaTexto}` : 'Justificativa registrada.');
            setJustificativaModal(null);
            setJustificativaTexto('');
          }}
          okText="Registrar"
          cancelText="Cancelar"
        >
          {justificativaModal && (
            <>
              <p style={{ marginBottom: 8 }}>
                A OP <Text strong>{justificativaModal.op.codigo}</Text> (entrega mais próxima) foi movida da posição {justificativaModal.fromIndex} para {justificativaModal.toIndex}.
              </p>
              <p style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>Informe a justificativa (opcional):</p>
              <Input.TextArea
                rows={3}
                value={justificativaTexto}
                onChange={(e) => setJustificativaTexto(e.target.value)}
                placeholder="Justificativa para alteração de prioridade..."
              />
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default FilaProducao;
