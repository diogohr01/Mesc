import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, Input, Layout, message, Modal, Progress, Row, Select, Space, Tag, Tabs, Tooltip, Typography } from 'antd';
import { ThunderboltOutlined, LockOutlined, UnlockOutlined, LeftOutlined, RightOutlined, HolderOutlined, DeleteOutlined, InfoCircleOutlined, HomeOutlined, TeamOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { AiOutlineClear } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import { useFilaGanttFilterContext } from '../../contexts/FilaGanttFilterContext';
import { useSequenciamento } from '../../contexts/SequenciamentoContext';
import { getUrgencyLevel, urgencyBarColors, urgencyColors } from '../../helpers/urgency';
import StatusBadge from '../../components/Dashboard/StatusBadge';
import { statusRowTint } from '../../constants/ordemProducaoStatus';
import OrdemProducaoService, { normalizeOPParaFila } from '../../services/ordemProducaoService';
import SequenciamentoService from '../../services/sequenciamentoService';
import { colors } from '../../styles/colors';
import ModalSequenciarOP from './Modals/ModalSequenciarOP';
import ModalConfirmarOP from './Modals/ModalConfirmarOP';
import ModalGerarOPs from './Modals/ModalGerarOPs';
import CriarOPMESCModal from '../OrdemProducao/components/CriarOPMESCModal';
import OrdemProducaoTotvsList from '../OrdemProducao/components/OrdemProducaoTotvsList';

dayjs.locale('pt-br');

const CAPACIDADE_CASA_TON = 18;
const CAPACIDADE_CLIENTE_TON = 12;
const CAPACIDADE_TOTAL_TON = CAPACIDADE_CASA_TON + CAPACIDADE_CLIENTE_TON; // 30
const FILA_PAGE_SIZE = 500;

const { Content } = Layout;
const { Text } = Typography;

function getDateKey(d) {
  return dayjs(d).format('YYYY-MM-DD');
}

function getOrCreateSeq(sequenciasPorDia, dateKey) {
  if (!sequenciasPorDia[dateKey]) {
    return { ops: [], casaPct: 60, confirmada: false }; // 60% = 18/(18+12)
  }
  return sequenciasPorDia[dateKey];
}

function buildSequenciamentoPayload(dateKey, sequenciasPorDia) {
  const seq = sequenciasPorDia[dateKey];
  if (!seq) {
    return { data: dateKey, confirmada: false, capacidade: { casaPct: 60, clientePct: 40, casaCap: CAPACIDADE_CASA_TON, clienteCap: CAPACIDADE_CLIENTE_TON }, sequencia: [] };
  }
  const casaPct = seq.casaPct ?? 60;
  const clientePct = 100 - casaPct;
  const casaCap = CAPACIDADE_CASA_TON;
  const clienteCap = CAPACIDADE_CLIENTE_TON;
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
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroListaOPs, setFiltroListaOPs] = useState('disponiveis'); // 'disponiveis' | 'selecionadas'
  const [filtroLiga, setFiltroLiga] = useState(undefined);
  const [filtroTempera, setFiltroTempera] = useState(undefined);
  const [allFilaData, setAllFilaData] = useState([]);
  const [loadingFila, setLoadingFila] = useState(false);
  const { sequenciasPorDia, setSequenciasPorDia } = useSequenciamento();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [diaSequenciamento, setDiaSequenciamento] = useState(() => dayjs());
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [modalSequenciarOpen, setModalSequenciarOpen] = useState(false);
  const [modalDisponiveisOpen, setModalDisponiveisOpen] = useState(false);
  const [tabDisponiveis, setTabDisponiveis] = useState('mesc'); // 'mesc' | 'totvs'
  const [modalCriarOPMESCPai, setModalCriarOPMESCPai] = useState(null); // record OP Totvs para Criar OP MESC
  const [viewMode, setViewMode] = useState('dia'); // 'dia' | 'semana'
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);
  const [modalGerarOPsOpen, setModalGerarOPsOpen] = useState(false);
  const [justificativaModal, setJustificativaModal] = useState(null);
  const [justificativaTexto, setJustificativaTexto] = useState('');
  const [diaAlvoAdicionar, setDiaAlvoAdicionar] = useState(null); // dateKey do dia alvo quando viewMode === 'semana' e modal aberto
  const tableDisponiveisRef = useRef(null);
  const tableTotvsRef = useRef(null);
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
    setContextFiltroTipo(filtroTipo === 'todos' ? undefined : filtroTipo);
  }, [filtroTipo, setContextFiltroTipo]);

  useEffect(() => {
    if (modalDisponiveisOpen && viewMode === 'semana') {
      setDiaAlvoAdicionar(getDateKey(diaSequenciamento.startOf('week')));
    }
  }, [modalDisponiveisOpen, viewMode, diaSequenciamento]);

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
    const targetDateKey =
      viewMode === 'semana' ? (diaAlvoAdicionar || getDateKey(diaSequenciamento.startOf('week'))) : dateKey;
    const toAddWithFlag = toAdd.map((op) => ({ ...op, jaSequenciada: true }));
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, targetDateKey);
      const newOps = [...(seq.ops || []), ...toAddWithFlag];
      return { ...prev, [targetDateKey]: { ...seq, ops: newOps } };
    });
    setSelectedRowKeys([]);
    setModalDisponiveisOpen(false);
  }, [selectedRowKeys, opsDisponiveis, dateKey, viewMode, diaAlvoAdicionar, diaSequenciamento]);

  const handleAdicionarUmaOPAoDia = useCallback(
    (record) => {
      const normalized = normalizeOPParaFila(record, null);
      const toAddWithFlag = [{ ...normalized, jaSequenciada: true }];
      setSequenciasPorDia((prev) => {
        const seq = getOrCreateSeq(prev, dateKey);
        const newOps = [...(seq.ops || []), ...toAddWithFlag];
        return { ...prev, [dateKey]: { ...seq, ops: newOps } };
      });
      message.success('OP adicionada ao dia.');
      tableTotvsRef.current?.reloadExpandido?.(record.opPaiId);
    },
    [dateKey]
  );

  const handleAdicionarVariasAoDia = useCallback(
    (records, opPai) => {
      if (!records?.length) return;
      const toAddWithFlag = records.map((r) => ({ ...normalizeOPParaFila(r, opPai), jaSequenciada: true }));
      setSequenciasPorDia((prev) => {
        const seq = getOrCreateSeq(prev, dateKey);
        const newOps = [...(seq.ops || []), ...toAddWithFlag];
        return { ...prev, [dateKey]: { ...seq, ops: newOps } };
      });
      message.success(records.length === 1 ? 'OP adicionada ao dia.' : `${records.length} OPs adicionadas ao dia.`);
      const opPaiId = records[0]?.opPaiId;
      if (opPaiId) tableTotvsRef.current?.reloadExpandido?.(opPaiId);
    },
    [dateKey]
  );

  const enrichFilhaRecord = useCallback(
    (record, opPaiId) => {
      const jaSequenciada = (currentSeq.ops || []).some((op) => op.id === record.id);
      const naListaDisponiveis = opsDisponiveis.some((op) => op.id === record.id);
      const disponivelParaSequenciamento = naListaDisponiveis || !jaSequenciada;
      return { ...record, opPaiId: opPaiId ?? record.opPaiId, jaSequenciada, disponivelParaSequenciamento };
    },
    [currentSeq.ops, opsDisponiveis]
  );

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
      setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
      setJustificativaTexto('');
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
      const isTodos = filtroTipo === 'todos';
      const tabOps = isTodos ? [...fullOpsCurrent] : fullOpsCurrent.filter((op) => (op.tipo || 'cliente') === filtroTipo);
      const otherOps = isTodos ? [] : fullOpsCurrent.filter((op) => (op.tipo || 'cliente') !== filtroTipo);
      const [removed] = tabOps.splice(sourceIndex, 1);
      tabOps.splice(destIndex, 0, removed);
      setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
      setJustificativaTexto('');
      const fullOps = isTodos ? tabOps : (filtroTipo === 'casa' ? [...tabOps, ...otherOps] : [...otherOps, ...tabOps]);
      setSequenciasPorDia((prev) => ({ ...prev, [dateKey]: { ...currentSeq, ops: fullOps } }));
    },
    [currentSeq, dateKey, filtroTipo]
  );

  const handleConfirmarSequencia = useCallback(() => {
    setSequenciasPorDia((prev) => {
      if (viewMode === 'dia') {
        const seq = getOrCreateSeq(prev, dateKey);
        const opsSeq = seq.ops || [];
        const casaTonSeq = opsSeq.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        const clienteTonSeq = opsSeq.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        const casaCap = CAPACIDADE_CASA_TON;
        const clienteCap = CAPACIDADE_CLIENTE_TON;
        if (casaTonSeq > casaCap || clienteTonSeq > clienteCap) {
          message.warning('Capacidade excedida — excedente será rolado para o próximo dia');
        }
        const totalTon = opsSeq.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        message.success(
          `Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} confirmada. ${opsSeq.length} OPs, ${totalTon.toFixed(1)} ton.`
        );
        return { ...prev, [dateKey]: { ...seq, confirmada: true } };
      }
      // vista semana: confirmar todos os dias da semana que tenham OPs e não estejam confirmados
      const inicio = dayjs(diaSequenciamento).startOf('week');
      let next = { ...prev };
      const diasConfirmados = [];
      for (let i = 0; i < 7; i++) {
        const dia = inicio.add(i, 'day');
        const dk = getDateKey(dia);
        const seq = getOrCreateSeq(next, dk);
        if ((seq.ops?.length ?? 0) > 0 && !seq.confirmada) {
          const opsSeq = seq.ops || [];
          const casaTonSeq = opsSeq.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
          const clienteTonSeq = opsSeq.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
          if (casaTonSeq > CAPACIDADE_CASA_TON || clienteTonSeq > CAPACIDADE_CLIENTE_TON) {
            message.warning(`Capacidade excedida no dia ${dia.format('DD/MM')} — excedente será rolado para o próximo dia`);
          }
          diasConfirmados.push(dia.format('ddd DD/MM'));
          next = { ...next, [dk]: { ...seq, confirmada: true } };
        }
      }
      if (diasConfirmados.length > 0) {
        message.success(`Sequência da semana confirmada. Dias: ${diasConfirmados.join(', ')}.`);
      }
      return next;
    });
  }, [dateKey, diaSequenciamento, viewMode]);

  const handleDesbloquearSequencia = useCallback(() => {
    setSequenciasPorDia((prev) => {
      if (viewMode === 'dia') {
        const seq = getOrCreateSeq(prev, dateKey);
        if (!seq.confirmada) return prev;
        message.success(`Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} desbloqueada. Aguardando confirmação.`);
        return { ...prev, [dateKey]: { ...seq, confirmada: false } };
      }
      // vista semana: desbloquear todos os dias da semana que estejam confirmados
      const inicio = dayjs(diaSequenciamento).startOf('week');
      let next = { ...prev };
      const diasDesbloqueados = [];
      for (let i = 0; i < 7; i++) {
        const dia = inicio.add(i, 'day');
        const dk = getDateKey(dia);
        const seq = getOrCreateSeq(next, dk);
        if (seq.confirmada) {
          diasDesbloqueados.push(dia.format('ddd DD/MM'));
          next = { ...next, [dk]: { ...seq, confirmada: false } };
        }
      }
      if (diasDesbloqueados.length > 0) {
        message.success(`Sequência da semana desbloqueada. Dias: ${diasDesbloqueados.join(', ')}. Aguardando confirmação.`);
      }
      return next;
    });
  }, [dateKey, diaSequenciamento, viewMode]);

  const handlePrevDay = useCallback(() => {
    const next = dayjs(diaSequenciamento).subtract(1, 'day');
    setDiaSequenciamento(next);
  }, [diaSequenciamento]);

  const handleNextDay = useCallback(() => {
    const next = dayjs(diaSequenciamento).add(1, 'day');
    setDiaSequenciamento(next);
  }, [diaSequenciamento]);

  const handlePrevWeek = useCallback(() => {
    setDiaSequenciamento(dayjs(diaSequenciamento).subtract(1, 'week'));
  }, [diaSequenciamento]);

  const handleNextWeek = useCallback(() => {
    setDiaSequenciamento(dayjs(diaSequenciamento).add(1, 'week'));
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

  const selectedOpsTon = useMemo(() => {
    const selected = opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id));
    const casa = selected.filter((op) => (op.tipo || 'cliente') === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
    const cliente = selected.filter((op) => (op.tipo || 'cliente') !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
    return { casaTon: casa, clienteTon: cliente, totalTon: casa + cliente };
  }, [opsDisponiveis, selectedRowKeys]);

  const diasDaSemana = useMemo(() => {
    const inicio = dayjs(diaSequenciamento).startOf('week');
    return Array.from({ length: 7 }, (_, i) => {
      const dia = inicio.add(i, 'day');
      const dk = getDateKey(dia);
      const seq = getOrCreateSeq(sequenciasPorDia, dk);
      const ops = seq.ops || [];
      const casaTon = ops.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      const clienteTon = ops.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      return { dia, dateKey: dk, ops, casaTon, clienteTon, confirmada: !!seq.confirmada };
    });
  }, [diaSequenciamento, sequenciasPorDia]);

  const CAPACIDADE_CASA_SEMANA = 18 * 7; // 126 ton
  const CAPACIDADE_CLIENTE_SEMANA = 12 * 7; // 84 ton
  const CAPACIDADE_TOTAL_SEMANA = CAPACIDADE_CASA_SEMANA + CAPACIDADE_CLIENTE_SEMANA; // 210 ton

  const { casaTonSemana, clienteTonSemana, opsSemanaOrdenadas } = useMemo(() => {
    let casa = 0;
    let cliente = 0;
    const lista = [];
    diasDaSemana.forEach(({ dia, dateKey, ops, casaTon, clienteTon, confirmada }) => {
      casa += casaTon;
      cliente += clienteTon;
      ops.forEach((op) => lista.push({ ...op, diaAssignado: dia, dateKeyAssignado: dateKey, diaConfirmado: confirmada }));
    });
    lista.sort((a, b) => (a.dateKeyAssignado || '').localeCompare(b.dateKeyAssignado || ''));
    return { casaTonSemana: casa, clienteTonSemana: cliente, opsSemanaOrdenadas: lista };
  }, [diasDaSemana]);

  const opsSemanaFiltradas = useMemo(
    () => (filtroTipo === 'todos' ? opsSemanaOrdenadas : opsSemanaOrdenadas.filter((op) => (op.tipo || 'cliente') === filtroTipo)),
    [opsSemanaOrdenadas, filtroTipo]
  );

  const semanaTemOPs = useMemo(
    () => diasDaSemana.some((d) => (d.ops?.length ?? 0) > 0),
    [diasDaSemana]
  );

  const handleReorderSemana = useCallback(
    (result) => {
      if (!result.destination) return;
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;
      const list = [...opsSemanaOrdenadas];
      const [removed] = list.splice(sourceIndex, 1);
      list.splice(destIndex, 0, removed);
      // Não permitir colocar uma OP de dia não confirmado no meio de OPs de dias confirmados
      const hasConfirmedBefore = (idx) => list.slice(0, idx).some((op) => op.diaConfirmado);
      const hasConfirmedAfter = (idx) => list.slice(idx + 1).some((op) => op.diaConfirmado);
      const nonConfirmedInMiddle = list.some(
        (op, i) => !op.diaConfirmado && hasConfirmedBefore(i) && hasConfirmedAfter(i)
      );
      if (nonConfirmedInMiddle) {
        message.warning('Não é possível colocar uma OP de dia não confirmado no meio da ordenação de dias confirmados.');
        return;
      }
      setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
      setJustificativaTexto('');
      const dayOrder = diasDaSemana.map((d) => d.dateKey);
      const dayCounts = dayOrder.map((dk) => opsSemanaOrdenadas.filter((op) => op.dateKeyAssignado === dk).length);
      let idx = 0;
      const newByDay = {};
      dayOrder.forEach((dk, i) => {
        const count = dayCounts[i];
        const segment = list.slice(idx, idx + count).map((op) => ({ ...op, dateKeyAssignado: dk }));
        newByDay[dk] = segment;
        idx += count;
      });
      setSequenciasPorDia((prev) => {
        const next = { ...prev };
        dayOrder.forEach((dk) => {
          const seq = getOrCreateSeq(prev, dk);
          next[dk] = { ...seq, ops: newByDay[dk] || [] };
        });
        return next;
      });
    },
    [opsSemanaOrdenadas, diasDaSemana]
  );

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

  const fetchDataTotvs = useCallback(async (page, pageSize, sorterField, sortOrder) => {
    try {
      const res = await OrdemProducaoService.getAll({
        tipoOp: 'PAI',
        page,
        pageSize,
        sorterField,
        sortOrder,
      });
      const data = res?.data?.data ?? [];
      const total = res?.data?.pagination?.totalRecords ?? data.length;
      return { data, total };
    } catch (e) {
      return { data: [], total: 0 };
    }
  }, []);

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
        {viewMode === 'semana' ? (
          <>
            <Button type="text" icon={<LeftOutlined />} onClick={handlePrevWeek} />
            <Text strong style={{ minWidth: 220 }}>
              {dayjs(diaSequenciamento).startOf('week').format('DD/MM')} - {dayjs(diaSequenciamento).startOf('week').add(6, 'day').format('DD/MM/YYYY')}
            </Text>
            <Button type="text" icon={<RightOutlined />} onClick={handleNextWeek} />
          </>
        ) : (
          <>
            <Button type="text" icon={<LeftOutlined />} onClick={handlePrevDay} />
            <Text strong style={{ minWidth: 220 }}>
              {diaSequenciamento.format('dddd DD/MM/YYYY')}
            </Text>
            <Button type="text" icon={<RightOutlined />} onClick={handleNextDay} />
          </>
        )}
        <Button
          type={viewMode === 'dia' ? 'primary' : 'default'}
          onClick={() => setViewMode('dia')}
        >
          Dia
        </Button>
        <Button
          type={viewMode === 'semana' ? 'primary' : 'default'}
          onClick={() => setViewMode('semana')}
        >
          Semana
        </Button>
      </Space>
     
      {/*<Button icon={<UnorderedListOutlined />} onClick={() => setModalSequenciarOpen(true)}>
        Sequenciar OP
      </Button>*/}
     
      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={handleConfirmarSequencia}
        disabled={
          viewMode === 'dia'
            ? confirmada || (currentSeq.ops || []).length === 0
            : diasDaSemana.every((d) => d.confirmada)
        }
      >
        Confirmar Sequência
      </Button>
      {(viewMode === 'dia' ? confirmada : diasDaSemana.filter((d) => d.confirmada).length >= 2) && (
        <Button
          icon={<UnlockOutlined />}
          onClick={handleDesbloquearSequencia}
        >
          Desbloquear
        </Button>
      )}
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
    () => (filtroTipo === 'todos' ? opsDoDia : opsDoDia.filter((op) => (op.tipo || 'cliente') === filtroTipo)),
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
                    <div
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      {[
                        {
                          key: 'todos',
                          label: 'Total',
                          icon: null,
                          ton: viewMode === 'semana' ? casaTonSemana + clienteTonSemana : casaTon + clienteTon,
                          cap: viewMode === 'semana' ? CAPACIDADE_TOTAL_SEMANA : CAPACIDADE_TOTAL_TON,
                        },
                        {
                          key: 'casa',
                          label: 'Casa',
                          icon: <HomeOutlined style={{ marginRight: 4, fontSize: 11 }} />,
                          ton: viewMode === 'semana' ? casaTonSemana : casaTon,
                          cap: viewMode === 'semana' ? CAPACIDADE_CASA_SEMANA : CAPACIDADE_CASA_TON,
                        },
                        {
                          key: 'cliente',
                          label: 'Cliente',
                          icon: <TeamOutlined style={{ marginRight: 4, fontSize: 11 }} />,
                          ton: viewMode === 'semana' ? clienteTonSemana : clienteTon,
                          cap: viewMode === 'semana' ? CAPACIDADE_CLIENTE_SEMANA : CAPACIDADE_CLIENTE_TON,
                        },
                      ].map(({ key, label, icon, ton, cap }) => {
                        const currentTon = Number(ton) || 0;
                        const capacity = Number(cap) || 1;
                        const pct = Math.min(Math.round((currentTon / capacity) * 100), 999);
                        const isSelected = filtroTipo === key;
                        return (
                          <div
                            key={key}
                            role="button"
                            tabIndex={0}
                            onClick={() => setFiltroTipo(key)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFiltroTipo(key); } }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 8px',
                              marginBottom: 2,
                              borderRadius: 6,
                              cursor: 'pointer',
                              background: isSelected ? (colors.primary ? `${colors.primary}14` : '#e6f7ff') : 'transparent',
                              borderLeft: isSelected ? `3px solid ${colors.primary || '#1890ff'}` : '3px solid transparent',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', minWidth: 72, fontSize: 11 }}>
                              {icon}
                              {label}
                            </span>
                            <Text style={{ fontSize: 11, fontFamily: 'monospace', minWidth: 76 }}>
                              {currentTon.toFixed(1)} / {capacity} ton
                            </Text>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Progress
                                percent={Math.min(pct, 100)}
                                showInfo={false}
                                strokeColor={pct <= 70 ? '#52c41a' : pct <= 90 ? '#faad14' : pct <= 100 ? '#fa8c16' : '#ff4d4f'}
                                trailColor="#f0f0f0"
                                size="small"
                              />
                            </div>
                            <Text style={{ fontSize: 11, minWidth: 28, color: '#52c41a' }}>{pct}%</Text>
                          </div>
                        );
                      })}
                    </div>
                    {confirmada && (
                      <div style={{ marginBottom: 8 }}>
                        <Tag icon={<LockOutlined />} color="default">
                          Confirmada
                        </Tag>
                      </div>
                    )}
                    {selectedRowKeys.length > 0 && selectedOpsTon.totalTon > 0 && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff', fontSize: 12 }}>
                        <Text strong>Selecionadas para adicionar:</Text>
                        <Text style={{ marginLeft: 6 }}>{selectedOpsTon.totalTon.toFixed(1)} ton</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>(Casa: {selectedOpsTon.casaTon.toFixed(1)} · Cliente: {selectedOpsTon.clienteTon.toFixed(1)})</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {filtroTipo === 'todos'
                            ? `Total previsto: ${(casaTon + clienteTon + selectedOpsTon.totalTon).toFixed(1)}/${CAPACIDADE_TOTAL_TON} ton`
                            : `Total previsto: Casa ${(casaTon + selectedOpsTon.casaTon).toFixed(1)}/${CAPACIDADE_CASA_TON} ton · Cliente ${(clienteTon + selectedOpsTon.clienteTon).toFixed(1)}/${CAPACIDADE_CLIENTE_TON} ton`}
                        </Text>
                      </div>
                    )}
                  </Col>
                </Row>
                {viewMode === 'semana' ? (
                <Row gutter={16}>
                  <Col span={24}>
                    <Card
                      title={
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Sequência da semana — {dayjs(diaSequenciamento).startOf('week').format('DD/MM')} - {dayjs(diaSequenciamento).startOf('week').add(6, 'day').format('DD/MM')} • {filtroTipo === 'todos' ? 'Todos' : (filtroTipo === 'casa' ? 'Casa' : 'Cliente')}
                          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>({opsSemanaFiltradas.length} OPs)</Text>
                        </span>
                      }
                      size="small"
                      bodyStyle={{ padding: '8px 12px' }}
                      extra={
                        <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
                          Adicionar OPs ao dia
                        </Button>
                      }
                    >
                      <div style={{ minHeight: 40 }}>
                        {semanaTemOPs && (
                          <div style={{ marginBottom: 8, fontSize: 11 }}>
                            {diasDaSemana.some((d) => d.confirmada) ? (
                              <span style={{ marginRight: 12 }}>
                                <LockOutlined style={{ marginRight: 4 }} />
                                Confirmados: {diasDaSemana.filter((d) => d.confirmada).map((d) => d.dia.format('ddd DD/MM')).join(', ')}
                              </span>
                            ) : (
                              <span style={{ marginRight: 12, color: '#666' }}>
                                <LockOutlined style={{ marginRight: 4 }} />
                                Confirmados: nenhum
                              </span>
                            )}
                            {diasDaSemana.some((d) => !d.confirmada && (d.ops?.length ?? 0) > 0) && (
                              <span style={{ color: '#666' }}>
                                Não confirmados: {diasDaSemana.filter((d) => !d.confirmada && (d.ops?.length ?? 0) > 0).map((d) => d.dia.format('ddd DD/MM')).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                        {opsSemanaFiltradas.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#666', padding: 12 }}>
                            {(filtroTipo === 'todos' || opsSemanaOrdenadas.length === 0) ? 'Nenhuma OP sequenciada nesta semana.' : `Nenhuma OP de ${filtroTipo === 'casa' ? 'Casa' : 'Cliente'} nesta semana.`}
                          </div>
                        ) : filtroTipo === 'todos' ? (
                          <DragDropContext onDragEnd={handleReorderSemana}>
                            <Droppable droppableId="sequencia-semana" isDropDisabled={false}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 40 }}>
                                  {opsSemanaOrdenadas.map((op, index) => (
                                    <Draggable
                                      key={`${op.dateKeyAssignado}-${op.id}-${index}`}
                                      draggableId={`semana-${op.id}`}
                                      index={index}
                                      isDragDisabled={op.diaConfirmado}
                                    >
                                      {(prov, snap) => (
                                        <div
                                          ref={prov.innerRef}
                                          {...prov.draggableProps}
                                          {...prov.dragHandleProps}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '4px 6px',
                                            marginBottom: 2,
                                            borderRadius: 4,
                                            border: '1px solid #f0f0f0',
                                            fontSize: 12,
                                            backgroundColor: snap.isDragging ? '#fafafa' : '#fff',
                                            cursor: op.diaConfirmado ? 'default' : 'grab',
                                            ...prov.draggableProps.style,
                                          }}
                                        >
                                          <HolderOutlined style={{ color: op.diaConfirmado ? '#d9d9d9' : '#999', fontSize: 12 }} />
                                          <span style={{ width: 72, fontSize: 11, color: '#666' }}>{op.diaAssignado ? dayjs(op.diaAssignado).format('ddd DD/MM') : '-'}</span>
                                          {op.diaConfirmado ? (
                                            <Tag icon={<LockOutlined />} color="success" style={{ fontSize: 10 }}>Confirmado</Tag>
                                          ) : (
                                            <Tag color="default" style={{ fontSize: 10 }}>Aguardando confirmação</Tag>
                                          )}
                                          <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>{op.codigo || '-'}</Text>
                                          {op.contingencia && (
                                            <Tooltip title="OP criada manualmente (contingência)">
                                              <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                                            </Tooltip>
                                          )}
                                          <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{op.produto || '-'}</Text>
                                          <Text type="secondary" style={{ fontSize: 11 }}>{op.liga || '-'} / {op.tempera || '-'}</Text>
                                          <Text style={{ fontSize: 11 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                                          <span style={{ fontSize: 11 }}>
                                            {(op.tipo || 'cliente') === 'casa' ? <Tag color="blue" style={{ margin: 0 }}>Casa</Tag> : <Tag style={{ margin: 0 }}>Cliente</Tag>}
                                          </span>
                                          <span style={{ fontSize: 11, color: urgencyColors[getUrgencyLevel(op.dataEntrega, op.status)] }}>
                                            {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM') : '-'}
                                          </span>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        ) : (
                          <>
                            {opsSemanaFiltradas.map((op, index) => (
                              <div
                                key={`${op.dateKeyAssignado}-${op.id}-${index}`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '4px 6px',
                                  marginBottom: 2,
                                  borderRadius: 4,
                                  border: '1px solid #f0f0f0',
                                  fontSize: 12,
                                  backgroundColor: '#fff',
                                }}
                              >
                                <span style={{ width: 72, fontSize: 11, color: '#666' }}>{op.diaAssignado ? dayjs(op.diaAssignado).format('ddd DD/MM') : '-'}</span>
                                {op.diaConfirmado ? (
                                  <Tag icon={<LockOutlined />} color="success" style={{ fontSize: 10 }}>Confirmado</Tag>
                                ) : (
                                  <Tag color="default" style={{ fontSize: 10 }}>Aguardando confirmação</Tag>
                                )}
                                <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>{op.codigo || '-'}</Text>
                                {op.contingencia && (
                                  <Tooltip title="OP criada manualmente (contingência)">
                                    <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                                  </Tooltip>
                                )}
                                <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{op.produto || '-'}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{op.liga || '-'} / {op.tempera || '-'}</Text>
                                <Text style={{ fontSize: 11 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                                <span style={{ fontSize: 11 }}>
                                  {(op.tipo || 'cliente') === 'casa' ? <Tag color="blue" style={{ margin: 0 }}>Casa</Tag> : <Tag style={{ margin: 0 }}>Cliente</Tag>}
                                </span>
                                <span style={{ fontSize: 11, color: urgencyColors[getUrgencyLevel(op.dataEntrega, op.status)] }}>
                                  {op.dataEntrega ? dayjs(op.dataEntrega).format('DD/MM') : '-'}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
                ) : seqDiaAtiva.length > 0 ? (
                <Row gutter={16}>
                  <Col span={24}>
                    <Card
                      title={
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          Sequência — {diaSequenciamento.format('DD/MM')} • {filtroTipo === 'todos' ? 'Todos' : (filtroTipo === 'casa' ? 'Casa' : 'Cliente')}
                          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>({seqDiaAtiva.length} OPs)</Text>
                        </span>
                      }
                      size="small"
                      bodyStyle={{ padding: '8px 12px' }}
                      extra={
                        <Space size="small">
                          {!confirmada && (
                            <>
                              <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
                                Adicionar OPs ao dia
                              </Button>
                              <Button danger  icon={<DeleteOutlined />} onClick={handleRemoverTodos}>
                                Remover todos
                              </Button>
                            </>
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
                                      <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>{op.codigo || op.numeroOPERP || '-'}</Text>
                                      {op.contingencia && (
                                        <Tooltip title="OP criada manualmente (contingência)">
                                          <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                                        </Tooltip>
                                      )}
                                      <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{op.produto || op.itens?.[0]?.descricaoItem || '-'}</Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>{op.liga || '-'} / {op.tempera || '-'}</Text>
                                      <Text style={{ fontSize: 11 }}>{(op.quantidade != null && op.quantidade !== '' ? Number(op.quantidade) : (op.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadePecas) || 0), 0)).toLocaleString('pt-BR')} kg</Text>
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
                ) : (
                <Row gutter={16}>
                  <Col span={24}>
                    <Card
                      title={<span style={{ fontSize: 12, fontWeight: 600 }}>Sequência — {diaSequenciamento.format('DD/MM')}</span>}
                      size="small"
                      bodyStyle={{ padding: 16 }}
                      extra={!confirmada && (
                        <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
                          Adicionar OPs ao dia
                        </Button>
                      )}
                    >
                      <div style={{ textAlign: 'center', color: '#666' }}>
                        Nenhuma OP sequenciada neste dia.
                      </div>
                    </Card>
                  </Col>
                </Row>
                )}
                <Modal
                  title={
                    <span>
                      Adicionar OPs ao dia
                      <Text type="secondary" style={{ marginLeft: 8, fontWeight: 400, fontSize: 14 }}>
                        — {viewMode === 'semana' ? 'Semana' : 'Dia'}: {diaSequenciamento.format('dddd DD/MM/YYYY')}
                      </Text>
                    </span>
                  }
                  open={modalDisponiveisOpen}
                  onCancel={() => { setModalDisponiveisOpen(false); setTabDisponiveis('mesc'); }}
                  width={1300}
                  footer={null}
                  destroyOnClose
                >
                  <Tabs
                    activeKey={tabDisponiveis}
                    onChange={setTabDisponiveis}
                    items={[
                      {
                        key: 'mesc',
                        label: 'OPs MESC',
                        children: (
                          <div>
                            {selectedRowKeys.length > 0 && selectedOpsTon.totalTon > 0 && (
                              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff', fontSize: 12 }}>
                                <Text strong>Capacidade das OPs selecionadas:</Text>
                                <Text style={{ marginLeft: 6 }}>{selectedOpsTon.totalTon.toFixed(1)} ton</Text>
                                <Text type="secondary" style={{ marginLeft: 8 }}>(Casa: {selectedOpsTon.casaTon.toFixed(1)} · Cliente: {selectedOpsTon.clienteTon.toFixed(1)})</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Total previsto no dia: Casa {(casaTon + selectedOpsTon.casaTon).toFixed(1)}/{CAPACIDADE_CASA_TON} ton · Cliente {(clienteTon + selectedOpsTon.clienteTon).toFixed(1)}/{CAPACIDADE_CLIENTE_TON} ton
                                </Text>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                              <Space size="middle">
                                <span style={{ fontWeight: 600, fontSize: 14 }}>OPs Disponíveis</span>
                                <Space size="small">
                                  <Button
                                    type={filtroListaOPs === 'disponiveis' ? 'primary' : 'default'}
                                    onClick={() => setFiltroListaOPs('disponiveis')}
                                  >
                                    Disponíveis ({opsDisponiveis.length})
                                  </Button>
                                  <Button
                                    type={filtroListaOPs === 'selecionadas' ? 'primary' : 'default'}
                                    onClick={() => setFiltroListaOPs('selecionadas')}
                                  >
                                    Selecionadas ({selectedRowKeys.length})
                                  </Button>
                                </Space>
                              </Space>
                              <Space size="middle">
                                {viewMode === 'semana' && (
                                  <>
                                    <Text strong style={{ fontSize: 13 }}>Dia da semana:</Text>
                                    <Select
                                      value={diaAlvoAdicionar || getDateKey(diaSequenciamento.startOf('week'))}
                                      onChange={setDiaAlvoAdicionar}
                                      options={diasDaSemana.map((d) => ({ value: d.dateKey, label: d.dia.format('ddd DD/MM') }))}
                                      style={{ minWidth: 140 }}
                                    />
                                  </>
                                )}
                                <Button
                                  type="primary"
                                  onClick={handleAdicionarAoDia}
                                  disabled={
                                    selectedRowKeys.length === 0 ||
                                    getOrCreateSeq(
                                      sequenciasPorDia,
                                      viewMode === 'semana' ? (diaAlvoAdicionar || getDateKey(diaSequenciamento.startOf('week'))) : dateKey
                                    ).confirmada
                                  }
                                >
                                  Adicionar ao Dia
                                </Button>
                              </Space>
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
                        ),
                      },
                      {
                        key: 'totvs',
                        label: 'OPs Totvs',
                        children: (
                          <div style={{ padding: '0' }}>
                            <OrdemProducaoTotvsList
                              ref={tableTotvsRef}
                              fetchData={fetchDataTotvs}
                              onCriarOPMESC={(record) => setModalCriarOPMESCPai(record)}
                              onSelecionarFilha={handleAdicionarUmaOPAoDia}
                              onAdicionarVariasFilhasAoDia={handleAdicionarVariasAoDia}
                              enrichFilhaRecord={enrichFilhaRecord}
                            />
                          </div>
                        ),
                      },
                    ]}
                  />
                </Modal>
                <CriarOPMESCModal
                  open={modalCriarOPMESCPai != null}
                  onClose={() => setModalCriarOPMESCPai(null)}
                  opPaiId={modalCriarOPMESCPai?.id}
                  opPaiRecord={modalCriarOPMESCPai ?? undefined}
                  onSuccess={() => {
                    const opPaiId = modalCriarOPMESCPai?.id;
                    loadAllFila();
                    setModalCriarOPMESCPai(null);
                    tableTotvsRef.current?.reloadTable?.();
                    tableTotvsRef.current?.reloadExpandido?.(opPaiId);
                  }}
                />
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
