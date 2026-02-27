import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Form, message, Space, Tag, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSequenciamento } from '../../../contexts/SequenciamentoContext';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import { useFilaGanttFilterContext } from '../../../contexts/FilaGanttFilterContext';
import { getUrgencyLevel, urgencyColors } from '../../../helpers/urgency';
import { getBufferDays, bufferColors } from '../../../helpers/buffer';
import { getPerdaPercentual } from '../../../helpers/itemFerramentaHelpers';
import { statusRowTint } from '../../../constants/ordemProducaoStatus';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import SequenciamentoService from '../../../services/sequenciamentoService';
import ItensService from '../../../services/itensService';
import ExcecoesCapacidadeService from '../../../services/excecoesCapacidadeService';
import FerramentasService from '../../../services/ferramentasService';
import StatusBadge from '../../../components/Dashboard/StatusBadge';
import {
  getCapacidadeForDate,
  getDateKey,
  getOrCreateSeq,
  buildSequenciamentoPayload,
  getDistinctFromList,
  autoSelectFerramenta,
} from '../utils/sequenciamentoCapacidade';

const FILA_PAGE_SIZE = 500;
const { Text } = Typography;

/**
 * Hook com toda a lógica de negócio do Sequenciamento (capacidade, preview, reorder, confirmação, filtros).
 * A página e os componentes apenas leem estado e disparam ações.
 */
export function useSequenciamentoLogic() {
  const [cenarios, setCenarios] = useState([]);
  const [cenarioAtivo, setCenarioAtivo] = useState(null);
  const [loadingCenarios, setLoadingCenarios] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroListaOPs, setFiltroListaOPs] = useState('disponiveis');
  const [filtroLiga, setFiltroLiga] = useState(undefined);
  const [filtroTempera, setFiltroTempera] = useState(undefined);
  const [allFilaData, setAllFilaData] = useState([]);
  const [loadingFila, setLoadingFila] = useState(false);
  const { sequenciasPorDia, setSequenciasPorDia } = useSequenciamento();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [diaSequenciamento, setDiaSequenciamento] = useState(() => dayjs());
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [modalDisponiveisOpen, setModalDisponiveisOpen] = useState(false);
  const [tabDisponiveis, setTabDisponiveis] = useState('totvs');
  const [modalFiltroTipo, setModalFiltroTipo] = useState('casa');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedRowKeysTotvs, setSelectedRowKeysTotvs] = useState([]);
  const [modalCriarOPMESCPai, setModalCriarOPMESCPai] = useState(undefined);
  const [viewMode, setViewMode] = useState('dia');
  const [justificativaModal, setJustificativaModal] = useState(null);
  const [justificativaTexto, setJustificativaTexto] = useState('');
  const [diaAlvoAdicionar, setDiaAlvoAdicionar] = useState(null);
  const [excecoesCapacidade, setExcecoesCapacidade] = useState([]);
  const [itensList, setItensList] = useState([]);
  const [ferramentasList, setFerramentasList] = useState([]);
  const [editOPModal, setEditOPModal] = useState(null);
  const [ferramentasOptions, setFerramentasOptions] = useState([]);
  const tableDisponiveisRef = useRef(null);
  const tableTotvsRef = useRef(null);
  const { searchTerm } = useFilterSearchContext();
  const { setCenarioId: setContextCenarioId, setFiltroTipo: setContextFiltroTipo } = useFilaGanttFilterContext();
  const [filterForm] = Form.useForm();

  const cenarioAtivoId = cenarioAtivo ?? (cenarios[0]?.id ?? null);
  const dateKey = getDateKey(diaSequenciamento);
  const currentSeq = getOrCreateSeq(sequenciasPorDia, dateKey);
  const casaPct = currentSeq.casaPct;
  const confirmada = currentSeq.confirmada;

  const capacityForDate = useMemo(
    () => getCapacidadeForDate(excecoesCapacidade, dateKey),
    [excecoesCapacidade, dateKey]
  );
  const { casaCap, clienteCap, capacidadeTotal, excecaoDia } = capacityForDate;

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
    if (modalDisponiveisOpen) {
      setModalFiltroTipo(filtroTipo === 'casa' || filtroTipo === 'cliente' ? filtroTipo : 'casa');
      setModalSearchTerm('');
    }
  }, [modalDisponiveisOpen, filtroTipo]);

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

  useEffect(() => {
    let cancelled = false;
    ExcecoesCapacidadeService.getAll({ page: 1, pageSize: 500 })
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          setExcecoesCapacidade(res.data.data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    ItensService.getAll({ page: 1, pageSize: 500 })
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          setItensList(Array.isArray(res.data.data) ? res.data.data : []);
        }
      })
      .catch(() => setItensList([]));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    FerramentasService.getAll({ page: 1, pageSize: 500 })
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          setFerramentasList(res.data.data || []);
          setFerramentasOptions(res.data.data.map((f) => ({ value: f.codigo, label: `${f.codigo} - ${f.descricao || ''}` })));
        }
      })
      .catch(() => {
        if (!cancelled) setFerramentasList([]);
        if (!cancelled) setFerramentasOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!editOPModal) return;
    FerramentasService.getAll({ page: 1, pageSize: 500 })
      .then((res) => {
        if (res?.data?.data) {
          setFerramentasOptions(res.data.data.map((f) => ({ value: f.codigo, label: `${f.codigo} - ${f.descricao || ''}` })));
        }
      })
      .catch(() => setFerramentasOptions([]));
  }, [editOPModal]);

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

  const opsFiltradasModalTotvs = useMemo(() => {
    let list = opsDisponiveis.filter((op) => op.opPaiId != null && (op.tipo || 'cliente') === modalFiltroTipo);
    if (modalSearchTerm?.trim()) {
      const term = modalSearchTerm.trim().toLowerCase();
      list = list.filter(
        (op) =>
          op.codigo?.toLowerCase().includes(term) ||
          op.produto?.toLowerCase().includes(term) ||
          op.cliente?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [opsDisponiveis, modalFiltroTipo, modalSearchTerm]);

  const opsFiltradasModalMESC = useMemo(() => {
    let list = opsDisponiveis.filter((op) => (op.opPaiId == null || !op.opPaiId) && (op.tipo || 'cliente') === modalFiltroTipo);
    if (modalSearchTerm?.trim()) {
      const term = modalSearchTerm.trim().toLowerCase();
      list = list.filter(
        (op) =>
          op.codigo?.toLowerCase().includes(term) ||
          op.produto?.toLowerCase().includes(term) ||
          op.cliente?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [opsDisponiveis, modalFiltroTipo, modalSearchTerm]);

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

  const addPreviewItems = useCallback(
    (targetDateKey, items) => {
      setSequenciasPorDia((prev) => {
        const seq = getOrCreateSeq(prev, targetDateKey);
        const preview = [...(seq.preview || []), ...items];
        return { ...prev, [targetDateKey]: { ...seq, preview } };
      });
    },
    []
  );

  const removePreviewItem = useCallback((targetDateKey, itemId) => {
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, targetDateKey);
      const preview = (seq.preview || []).filter((p) => p.id !== itemId);
      return { ...prev, [targetDateKey]: { ...seq, preview } };
    });
  }, []);

  const updatePreviewItem = useCallback((targetDateKey, itemId, patch) => {
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, targetDateKey);
      const preview = (seq.preview || []).map((p) => (p.id === itemId ? { ...p, ...patch } : p));
      return { ...prev, [targetDateKey]: { ...seq, preview } };
    });
  }, []);

  const handleAdicionarAoDia = useCallback((quantityOverrides = {}) => {
    const targetDateKey =
      viewMode === 'semana' ? (diaAlvoAdicionar || getDateKey(diaSequenciamento.startOf('week'))) : dateKey;
    const seqTarget = getOrCreateSeq(sequenciasPorDia, targetDateKey);
    if (seqTarget.confirmada) {
      message.warning('Sequência já confirmada.');
      return;
    }
    if (tabDisponiveis === 'totvs') {
      if (selectedRowKeysTotvs.length === 0) {
        message.info('Selecione pelo menos uma OP.');
        return;
      }
      const toAdd = opsFiltradasModalTotvs.filter((op) => selectedRowKeysTotvs.includes(op.id));
      if (toAdd.length === 0) return;
      const previewItems = toAdd.map((op) => {
        const quantidade = Number(quantityOverrides[op.id] ?? op.quantidade) || 0;
        const ferramenta = autoSelectFerramenta(quantidade, ferramentasList);
        const quantidadeOriginal = Number(op.quantidade) || 0;
        return {
          id: `prev-${op.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          opTotvsId: op.id,
          opPaiId: op.opPaiId ?? null,
          opTotvsQuantidadeOriginal: quantidadeOriginal,
          opTotvsCodigo: op.codigo || op.numeroOPERP,
          produto: op.produto || op.itens?.[0]?.descricaoItem,
          cliente: op.cliente,
          liga: op.liga,
          tempera: op.tempera,
          tipo: op.tipo || 'cliente',
          dataEntrega: op.dataEntrega ?? op.itens?.[0]?.dataEntrega,
          quantidade,
          ferramentaSugerida: ferramenta?.codigo || null,
          ferramentaManual: null,
          semFerramenta: !ferramenta,
        };
      });
      addPreviewItems(targetDateKey, previewItems);
      setSelectedRowKeysTotvs([]);
      message.success(`${previewItems.length} item(ns) adicionado(s) ao preview do dia ${dayjs(targetDateKey).format('DD/MM')}.`);
    } else {
      if (selectedRowKeys.length === 0) {
        message.info('Selecione pelo menos uma OP.');
        return;
      }
      const toAdd = opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id));
      if (toAdd.length === 0) return;
      const toAddWithFlag = toAdd.map((op) => ({
        ...op,
        quantidade: Number(quantityOverrides[op.id] ?? op.quantidade) || op.quantidade,
        jaSequenciada: true,
      }));
      startTransition(() => {
        setSequenciasPorDia((prev) => {
          const seq = getOrCreateSeq(prev, targetDateKey);
          const newOps = [...(seq.ops || []), ...toAddWithFlag];
          return { ...prev, [targetDateKey]: { ...seq, ops: newOps } };
        });
      });
      setSelectedRowKeys([]);
      message.success(`${toAdd.length} OP(s) adicionada(s) ao dia ${dayjs(targetDateKey).format('DD/MM')}.`);
    }
    queueMicrotask(() => setModalDisponiveisOpen(false));
  }, [
    tabDisponiveis,
    selectedRowKeysTotvs,
    selectedRowKeys,
    opsFiltradasModalTotvs,
    opsDisponiveis,
    dateKey,
    viewMode,
    diaAlvoAdicionar,
    diaSequenciamento,
    sequenciasPorDia,
    ferramentasList,
    addPreviewItems,
  ]);

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
      return { ...prev, [dateKey]: { ...seq, ops: [], preview: [] } };
    });
  }, [dateKey]);

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
      const dataMovida = removed.dataEntrega ?? removed.itens?.[0]?.dataEntrega;
      const opAcima = destIndex > 0 ? tabOps[destIndex - 1] : null;
      const dataAcima = opAcima ? (opAcima.dataEntrega ?? opAcima.itens?.[0]?.dataEntrega) : null;
      const contraUrgencia = dataMovida && dataAcima && new Date(dataMovida) < new Date(dataAcima);
      if (contraUrgencia) {
        setJustificativaModal({ op: removed, fromIndex: sourceIndex + 1, toIndex: destIndex + 1 });
        setJustificativaTexto('');
      }
      const fullOps = isTodos ? tabOps : (filtroTipo === 'casa' ? [...tabOps, ...otherOps] : [...otherOps, ...tabOps]);
      setSequenciasPorDia((prev) => ({ ...prev, [dateKey]: { ...currentSeq, ops: fullOps } }));
    },
    [currentSeq, dateKey, filtroTipo]
  );

  const handleConfirmarSequencia = useCallback(async () => {
    const preview = currentSeq.preview || [];
    const hasSemFerramenta = preview.some((p) => p.semFerramenta);
    if (preview.length > 0 && hasSemFerramenta) {
      message.error('Remova ou atribua ferramenta a todos os itens do preview antes de confirmar.');
      return;
    }
    // Validar quantidade por OP Totvs: soma por opTotvsId não pode exceder opTotvsQuantidadeOriginal
    const previewToValidate = viewMode === 'dia'
      ? (currentSeq.preview || [])
      : (() => {
          const inicio = dayjs(diaSequenciamento).startOf('week');
          const items = [];
          for (let i = 0; i < 7; i++) {
            const dk = getDateKey(inicio.add(i, 'day'));
            const seq = getOrCreateSeq(sequenciasPorDia, dk);
            if (seq.preview?.length) items.push(...seq.preview);
          }
          return items;
        })();
    const byOpTotvsId = {};
    previewToValidate.forEach((p) => {
      if (p.opTotvsId == null) return;
      if (!byOpTotvsId[p.opTotvsId]) {
        byOpTotvsId[p.opTotvsId] = { soma: 0, original: p.opTotvsQuantidadeOriginal ?? 0, codigo: p.opTotvsCodigo || String(p.opTotvsId) };
      }
      byOpTotvsId[p.opTotvsId].soma += Number(p.quantidade) || 0;
    });
    for (const id of Object.keys(byOpTotvsId)) {
      const { soma, original, codigo } = byOpTotvsId[id];
      if (original > 0 && soma > original) {
        message.error(`Quantidade da OP ${codigo} excede o total (${soma.toLocaleString('pt-BR')} > ${original.toLocaleString('pt-BR')}). Ajuste ou remova itens do preview.`);
        return;
      }
    }
    // Criar OP MESC por cada item de preview com opTotvsId (filha sob PAI)
    const previewComTotvs = viewMode === 'dia'
      ? (currentSeq.preview || []).filter((p) => p.opTotvsId != null && p.opPaiId != null)
      : (() => {
          const inicio = dayjs(diaSequenciamento).startOf('week');
          const items = [];
          for (let i = 0; i < 7; i++) {
            const dk = getDateKey(inicio.add(i, 'day'));
            const seq = getOrCreateSeq(sequenciasPorDia, dk);
            if (seq.preview?.length) items.push(...seq.preview.filter((p) => p.opTotvsId != null && p.opPaiId != null));
          }
          return items;
        })();
    const createdOpByPreviewId = {};
    for (const p of previewComTotvs) {
      try {
        const resPai = await OrdemProducaoService.getById(p.opPaiId);
        const opPai = resPai?.data?.data ?? resPai?.data;
        if (!opPai) {
          message.error(`OP Pai ${p.opPaiId} não encontrada. Não foi possível criar OP MESC para ${p.opTotvsCodigo || p.opTotvsId}.`);
          return;
        }
        const quantidade = Number(p.quantidade) || 0;
        const itensPai = opPai.itens || [];
        const useKg = (itensPai.reduce((s, i) => s + (parseFloat(i.quantidadeKg) || 0), 0)) > 0;
        const qtdParaItem = useKg ? quantidade : Math.round(quantidade);
        const itensFilha = itensPai.length
          ? itensPai.map((item, idx) => ({
              ...item,
              id: item.id ?? idx + 1,
              quantidadePecas: idx === 0 ? qtdParaItem : (item.quantidadePecas ?? 0),
              ...(useKg && idx === 0 ? { quantidadeKg: quantidade } : {}),
            }))
          : [{ quantidadePecas: Math.round(quantidade), quantidadeKg: useKg ? quantidade : undefined }];
        const codigoFerramenta = p.ferramentaManual || p.ferramentaSugerida;
        const ferramentaId = codigoFerramenta && Array.isArray(ferramentasList)
          ? (ferramentasList.find((f) => f.codigo === codigoFerramenta)?.id ?? null)
          : null;
        const serializeDate = (v) => (!v ? null : typeof v === 'string' ? v : dayjs(v).format('YYYY-MM-DD'));
        const ordemData = {
          tipoOp: 'FILHA',
          opPaiId: p.opPaiId,
          opTotvsCodigo: p.opTotvsCodigo ?? p.opTotvsId ?? '',
          numeroOPERP: '',
          dataOP: serializeDate(dayjs()),
          situacao: 'Em cadastro',
          cliente: opPai.cliente || {},
          numeroPedidoCliente: opPai.numeroPedidoCliente ?? '',
          observacoes: '',
          itens: itensFilha,
          informacoesComplementares: {},
          ativo: true,
          ferramentaId: ferramentaId ?? undefined,
        };
        const response = await OrdemProducaoService.upsert(ordemData);
        if (!response?.success) {
          message.error(response?.message || `Erro ao criar OP MESC para ${p.opTotvsCodigo || p.opTotvsId}.`);
          return;
        }
        const created = response?.data?.data ?? response?.data;
        createdOpByPreviewId[p.id] = {
          id: created?.id,
          codigo: created?.codigo ?? created?.numeroOPERP ?? `${p.opTotvsCodigo ?? p.opTotvsId ?? ''}-001`,
        };
      } catch (err) {
        message.error(`Erro ao criar OP MESC para ${p.opTotvsCodigo || p.opTotvsId}.`);
        console.error(err);
        return;
      }
    }
    // Atualizar estado: mover preview para ops e marcar confirmada
    setSequenciasPorDia((prev) => {
      if (viewMode === 'dia') {
        const seq = getOrCreateSeq(prev, dateKey);
        let opsSeq = seq.ops || [];
        if (seq.preview && seq.preview.length > 0) {
          const fromPreview = seq.preview.map((p) => {
            const created = createdOpByPreviewId[p.id];
            const id = created?.id ?? p.id;
            const codigo = created?.codigo ?? p.opTotvsCodigo ?? p.codigo;
            return {
              id,
              codigo,
              numeroOPERP: codigo,
              produto: p.produto,
              cliente: p.cliente,
              liga: p.liga,
              tempera: p.tempera,
              tipo: p.tipo || 'cliente',
              dataEntrega: p.dataEntrega,
              quantidade: p.quantidade,
              recurso: p.ferramentaManual || p.ferramentaSugerida,
              ferramenta: p.ferramentaManual || p.ferramentaSugerida ? { codigo: p.ferramentaManual || p.ferramentaSugerida, descricao: '' } : null,
              jaSequenciada: true,
            };
          });
          opsSeq = [...opsSeq, ...fromPreview];
        }
        const casaTonSeq = opsSeq.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        const clienteTonSeq = opsSeq.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        if (casaTonSeq > casaCap || clienteTonSeq > clienteCap) {
          message.warning('Capacidade excedida — excedente será rolado para o próximo dia');
        }
        const totalTon = opsSeq.reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
        message.success(
          `Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} confirmada. ${opsSeq.length} OPs, ${totalTon.toFixed(1)} ton.`
        );
        return { ...prev, [dateKey]: { ...seq, ops: opsSeq, preview: [], confirmada: true } };
      }
      const inicio = dayjs(diaSequenciamento).startOf('week');
      let next = { ...prev };
      const diasConfirmados = [];
      for (let i = 0; i < 7; i++) {
        const dia = inicio.add(i, 'day');
        const dk = getDateKey(dia);
        const capDia = getCapacidadeForDate(excecoesCapacidade, dk);
        const seq = getOrCreateSeq(next, dk);
        let opsSeq = seq.ops || [];
        if (seq.preview && seq.preview.length > 0 && !seq.preview.some((p) => p.semFerramenta)) {
          const fromPreview = seq.preview.map((p) => {
            const created = createdOpByPreviewId[p.id];
            const id = created?.id ?? p.id;
            const codigo = created?.codigo ?? p.opTotvsCodigo ?? p.codigo;
            return {
              id,
              codigo,
              numeroOPERP: codigo,
              produto: p.produto,
              cliente: p.cliente,
              liga: p.liga,
              tempera: p.tempera,
              tipo: p.tipo || 'cliente',
              dataEntrega: p.dataEntrega,
              quantidade: p.quantidade,
              recurso: p.ferramentaManual || p.ferramentaSugerida,
              ferramenta: p.ferramentaManual || p.ferramentaSugerida ? { codigo: p.ferramentaManual || p.ferramentaSugerida, descricao: '' } : null,
              jaSequenciada: true,
            };
          });
          opsSeq = [...opsSeq, ...fromPreview];
        }
        if ((opsSeq.length > 0) && !seq.confirmada) {
          const casaTonSeq = opsSeq.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
          const clienteTonSeq = opsSeq.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
          if (casaTonSeq > capDia.casaCap || clienteTonSeq > capDia.clienteCap) {
            message.warning(`Capacidade excedida no dia ${dia.format('DD/MM')} — excedente será rolado para o próximo dia`);
          }
          diasConfirmados.push(dia.format('ddd DD/MM'));
          next = { ...next, [dk]: { ...seq, ops: opsSeq, preview: [], confirmada: true } };
        }
      }
      if (diasConfirmados.length > 0) {
        message.success(`Sequência da semana confirmada. Dias: ${diasConfirmados.join(', ')}.`);
      }
      return next;
    });
    loadAllFila();
  }, [dateKey, diaSequenciamento, viewMode, casaCap, clienteCap, excecoesCapacidade, currentSeq, sequenciasPorDia, ferramentasList, loadAllFila]);

  const handleDesbloquearSequencia = useCallback(() => {
    setSequenciasPorDia((prev) => {
      if (viewMode === 'dia') {
        const seq = getOrCreateSeq(prev, dateKey);
        if (!seq.confirmada) return prev;
        message.success(`Sequência do dia ${diaSequenciamento.format('DD/MM/YYYY')} desbloqueada. Aguardando confirmação.`);
        return { ...prev, [dateKey]: { ...seq, confirmada: false } };
      }
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

  const handleDateChange = useCallback((newDateKey) => {
    setDiaSequenciamento(dayjs(newDateKey));
  }, []);

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

  const previewTon = useMemo(() => {
    const preview = currentSeq.preview || [];
    return preview.reduce((s, p) => s + (Number(p.quantidade) || 0) / 1000, 0);
  }, [currentSeq.preview]);

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
      const capDia = getCapacidadeForDate(excecoesCapacidade, dk);
      const seq = getOrCreateSeq(sequenciasPorDia, dk);
      const ops = seq.ops || [];
      const casaTon = ops.filter((op) => op.tipo === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      const clienteTon = ops.filter((op) => op.tipo !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
      return { dia, dateKey: dk, ops, casaTon, clienteTon, casaCap: capDia.casaCap, clienteCap: capDia.clienteCap, confirmada: !!seq.confirmada };
    });
  }, [diaSequenciamento, sequenciasPorDia, excecoesCapacidade]);

  const CAPACIDADE_CASA_SEMANA = useMemo(
    () => diasDaSemana.reduce((s, d) => s + (d.casaCap ?? 18), 0),
    [diasDaSemana]
  );
  const CAPACIDADE_CLIENTE_SEMANA = useMemo(
    () => diasDaSemana.reduce((s, d) => s + (d.clienteCap ?? 12), 0),
    [diasDaSemana]
  );
  const CAPACIDADE_TOTAL_SEMANA = CAPACIDADE_CASA_SEMANA + CAPACIDADE_CLIENTE_SEMANA;

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

  const handleConfirmEditOP = useCallback(() => {
    if (!editOPModal) return;
    const { op, quantidade, ferramentaCodigo } = editOPModal;
    setSequenciasPorDia((prev) => {
      const seq = getOrCreateSeq(prev, dateKey);
      const ops = (seq.ops || []).map((o) =>
        o.id === op.id
          ? {
              ...o,
              quantidade: Number(quantidade) || o.quantidade,
              ferramenta: ferramentaCodigo ? { codigo: ferramentaCodigo, descricao: '' } : o.ferramenta,
              recurso: ferramentaCodigo || o.recurso,
            }
          : o
      );
      return { ...prev, [dateKey]: { ...seq, ops } };
    });
    message.success(`OP ${op.codigo || op.numeroOPERP} atualizada.`);
    setEditOPModal(null);
  }, [editOPModal, dateKey]);

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
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 90, filterable: true, render: (v) => <Text strong style={{ fontFamily: 'monospace' }}>{v || '-'}</Text> },
      { title: 'Produto', dataIndex: 'produto', key: 'produto', width: 200, ellipsis: true, filterable: true },
      {
        title: 'Liga',
        dataIndex: 'liga',
        key: 'liga',
        width: 80,
        filterable: true,
        render: (v) => <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace' }}>{v || '-'}</Tag>,
      },
      {
        title: 'Têmpera',
        dataIndex: 'tempera',
        key: 'tempera',
        width: 80,
        filterable: true,
        render: (v) => (
          <Tag color={({ T4: 'error', T5: 'processing', T6: 'blue', H32: 'cyan' }[v] || 'default')} style={{ margin: 0, fontFamily: 'monospace' }}>
            {v || '-'}
          </Tag>
        ),
      },
      { title: 'Recurso', dataIndex: 'recurso', key: 'recurso', width: 100, ellipsis: true, filterable: true },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        width: 80,
        filterable: true,
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
        render: (v, record) => {
          const q = v != null ? Number(v).toLocaleString('pt-BR') : '-';
          if (record.quantidadeTotalPai != null && record.qtdProgramadaPai != null) {
            const total = record.quantidadeTotalPai;
            const prog = record.qtdProgramadaPai;
            const falta = Math.max(0, total - prog);
            const un = record.useKgPai ? 'kg' : 'un';
            return (
              <Tooltip title={`Total: ${total.toLocaleString('pt-BR')} ${un} · Já seq.: ${prog.toLocaleString('pt-BR')} ${un} · Falta: ${falta.toLocaleString('pt-BR')} ${un}`}>
                <span>{q}</span>
              </Tooltip>
            );
          }
          return q;
        },
      },
      {
        title: 'Necessário | Produzir',
        key: 'necessarioProduzir',
        width: 180,
        align: 'right',
        render: (_, record) => {
          // OP Totvs (FILHA com PAI): Total = quantidade desta OP (igual a Qtd kg da linha); Falta = Total - já programado no PAI
          const temPai = record.quantidadeTotalPai != null && record.qtdProgramadaPai != null;
          const totalOp = record.quantidade != null ? Number(record.quantidade) : 0;
          const programadoPai = temPai ? Number(record.qtdProgramadaPai) : 0;
          const falta = temPai ? Math.max(0, totalOp - programadoPai) : 0;
          const qtd = temPai ? falta : totalOp;

          const perdaFromHelper = getPerdaPercentual(itensList, record.liga, record.tempera, qtd);
          const perdaPct = perdaFromHelper > 0 ? perdaFromHelper : (record.percentualPerda != null ? Number(record.percentualPerda) : record.item?.percentualPerda);

          if (temPai) {
            if (falta === 0) {
              return <Text type="secondary" style={{ fontSize: 12 }}>Total: {totalOp.toLocaleString('pt-BR')} — programado</Text>;
            }
            if (perdaPct == null || perdaPct === 0) {
              return (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Total: {totalOp.toLocaleString('pt-BR')} | Falta: {falta.toLocaleString('pt-BR')}
                </Text>
              );
            }
            const produzir = Math.ceil(falta / (1 - perdaPct / 100));
            return (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total: {totalOp.toLocaleString('pt-BR')} | Falta: {falta.toLocaleString('pt-BR')} → Produzir: {produzir.toLocaleString('pt-BR')} ({perdaPct}% perda)
              </Text>
            );
          }

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
          const dataEntrega = v ?? record.itens?.[0]?.dataEntrega;
          const diasTolerancia = record.diasToleranciaAtraso ?? record.itens?.[0]?.dias_tolerancia_atraso ?? 0;
          const level = getUrgencyLevel(dataEntrega, record.status, diasTolerancia);
          const color = urgencyColors[level];
          return <span style={{ color: color || undefined }}>{dataEntrega ? dayjs(dataEntrega).format('DD/MM/YYYY') : '-'}</span>;
        },
      },
      {
        title: 'Buffer',
        key: 'buffer',
        width: 72,
        align: 'center',
        render: (_, record) => {
          const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
          const buffer = getBufferDays(dataEntrega, record.status);
          const label = buffer.days > 0 ? `+${buffer.days}d` : `${buffer.days}d`;
          return <span style={{ color: bufferColors[buffer.level], fontWeight: 600, fontSize: 12 }}>{label}</span>;
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        filterable: true,
        render: (status) => <StatusBadge status={status} />,
      },
    ],
    [itensList]
  );

  const selectedOPsComPerda = useMemo(() => {
    return opsDisponiveis.filter((op) => {
      if (!selectedRowKeys.includes(op.id)) return false;
      const qtd = Number(op.quantidade) || 0;
      const perdaFromHelper = getPerdaPercentual(itensList, op.liga, op.tempera, qtd);
      const perdaPct = perdaFromHelper > 0 ? perdaFromHelper : (op.percentualPerda != null ? Number(op.percentualPerda) : op.item?.percentualPerda);
      return perdaPct != null && perdaPct > 0;
    });
  }, [opsDisponiveis, selectedRowKeys, itensList]);

  const totvsSelectedTon = useMemo(() => {
    const selected = opsFiltradasModalTotvs.filter((op) => selectedRowKeysTotvs.includes(op.id));
    const casa = selected.filter((op) => (op.tipo || 'cliente') === 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
    const cliente = selected.filter((op) => (op.tipo || 'cliente') !== 'casa').reduce((s, op) => s + (Number(op.quantidade) || 0) / 1000, 0);
    return { totalTon: casa + cliente, casaTon: casa, clienteTon: cliente };
  }, [opsFiltradasModalTotvs, selectedRowKeysTotvs]);

  const selectedOpsListMesc = useMemo(
    () => opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id)),
    [opsDisponiveis, selectedRowKeys]
  );

  const opsParaTabelaTotvs = useMemo(() => {
    if (filtroListaOPs === 'selecionadas') {
      return opsFiltradasModalTotvs.filter((op) => selectedRowKeysTotvs.includes(op.id));
    }
    return opsFiltradasModalTotvs;
  }, [filtroListaOPs, opsFiltradasModalTotvs, selectedRowKeysTotvs]);

  const opsParaTabelaMESC = useMemo(() => {
    if (filtroListaOPs === 'selecionadas') {
      return opsDisponiveis.filter((op) => selectedRowKeys.includes(op.id));
    }
    return opsFiltradasModalMESC;
  }, [filtroListaOPs, opsDisponiveis, opsFiltradasModalMESC, selectedRowKeys]);

  const getDistinctValuesForColumnTotvs = useCallback(
    async (columnKey) => getDistinctFromList(opsFiltradasModalTotvs, columnKey),
    [opsFiltradasModalTotvs]
  );

  const getDistinctValuesForColumnMESC = useCallback(
    async (columnKey) => getDistinctFromList(opsFiltradasModalMESC, columnKey),
    [opsFiltradasModalMESC]
  );

  const applyFiltersAndSort = (list, filters, sorterField, sortOrder) => {
    let result = [...(list || [])];
    if (filters && typeof filters === 'object') {
      Object.keys(filters).forEach((key) => {
        const selected = filters[key];
        if (Array.isArray(selected) && selected.length > 0) {
          result = result.filter((op) => {
            const val = op[key] ?? '';
            return selected.includes(val);
          });
        }
      });
    }
    if (sorterField && sortOrder) {
      result.sort((a, b) => {
        const va = a[sorterField];
        const vb = b[sorterField];
        const cmp = va == null && vb == null ? 0 : va == null ? 1 : vb == null ? -1 : (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb)));
        return sortOrder === 'ascend' ? cmp : -cmp;
      });
    }
    return result;
  };

  const fetchDataDisponiveis = useCallback(async (page, pageSize, sorterField, sortOrder, filters) => {
    const list = applyFiltersAndSort(opsParaTabelaMESC, filters, sorterField, sortOrder);
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total: list.length };
  }, [opsParaTabelaMESC]);

  const fetchDataTotvsModal = useCallback(async (page, pageSize, sorterField, sortOrder, filters) => {
    const list = applyFiltersAndSort(opsParaTabelaTotvs, filters, sorterField, sortOrder);
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total: list.length };
  }, [opsParaTabelaTotvs]);

  useEffect(() => {
    if (modalDisponiveisOpen) {
      if (tabDisponiveis === 'totvs') tableTotvsRef.current?.reloadTable?.();
      else tableDisponiveisRef.current?.reloadTable?.();
    }
  }, [opsParaTabelaTotvs, opsParaTabelaMESC, modalDisponiveisOpen, tabDisponiveis]);

  const onRowDisponiveis = useCallback((record) => {
    const id = record.id;
    const statusTint = statusRowTint[record.status] || { backgroundColor: 'transparent', borderLeft: '4px solid transparent' };
    return {
      style: { cursor: 'pointer', ...statusTint },
      onClick: () => {
        setSelectedRowKeys((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
      },
    };
  }, []);

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const rowSelectionTotvs = {
    selectedRowKeys: selectedRowKeysTotvs,
    onChange: (keys) => setSelectedRowKeysTotvs(keys),
  };

  const onRowDisponiveisTotvs = useCallback((record) => {
    const id = record.id;
    const statusTint = statusRowTint[record.status] || { backgroundColor: 'transparent', borderLeft: '4px solid transparent' };
    return {
      style: { cursor: 'pointer', ...statusTint },
      onClick: () => {
        setSelectedRowKeysTotvs((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
      },
    };
  }, []);

  const opsDoDia = currentSeq.ops || [];
  const seqDiaAtiva = useMemo(
    () => (filtroTipo === 'todos' ? opsDoDia : opsDoDia.filter((op) => (op.tipo || 'cliente') === filtroTipo)),
    [opsDoDia, filtroTipo]
  );

  const hasPreviewSemFerramenta = useMemo(() => (currentSeq.preview || []).some((p) => p.semFerramenta), [currentSeq.preview]);

  const canConfirmar = useMemo(() => {
    if (viewMode === 'dia') {
      const temOPs = (currentSeq.ops?.length ?? 0) > 0 || (currentSeq.preview?.length ?? 0) > 0;
      return !confirmada && temOPs && !hasPreviewSemFerramenta;
    }
    const algumDiaComOPs = diasDaSemana.some((d) => (d.ops?.length ?? 0) > 0);
    return !diasDaSemana.every((d) => d.confirmada) && algumDiaComOPs;
  }, [viewMode, confirmada, currentSeq, hasPreviewSemFerramenta, diasDaSemana]);

  return {
    capacityForDate,
    casaCap,
    clienteCap,
    capacidadeTotal,
    excecaoDia,
    dateKey,
    currentSeq,
    confirmada,
    utilizadoTon,
    casaTon,
    clienteTon,
    previewTon,
    diasDaSemana,
    opsSemanaOrdenadas,
    opsSemanaFiltradas,
    semanaTemOPs,
    CAPACIDADE_CASA_SEMANA,
    CAPACIDADE_CLIENTE_SEMANA,
    CAPACIDADE_TOTAL_SEMANA,
    casaTonSemana,
    clienteTonSemana,
    filtroTipo,
    setFiltroTipo,
    viewMode,
    setViewMode,
    diaSequenciamento,
    handleDateChange,
    filtroLiga,
    filtroTempera,
    modalDisponiveisOpen,
    setModalDisponiveisOpen,
    tabDisponiveis,
    setTabDisponiveis,
    modalFiltroTipo,
    setModalFiltroTipo,
    modalSearchTerm,
    setModalSearchTerm,
    diaAlvoAdicionar,
    setDiaAlvoAdicionar,
    justificativaModal,
    setJustificativaModal,
    justificativaTexto,
    setJustificativaTexto,
    editOPModal,
    setEditOPModal,
    modalCriarOPMESCPai,
    setModalCriarOPMESCPai,
    modalFiltrosOpen,
    setModalFiltrosOpen,
    filterForm,
    filterFormConfig,
    setFiltroLiga,
    setFiltroTempera,
    opsDisponiveis,
    opsFiltradasModalTotvs,
    opsFiltradasModalMESC,
    selectedRowKeys,
    setSelectedRowKeys,
    selectedRowKeysTotvs,
    setSelectedRowKeysTotvs,
    seqDiaAtiva,
    opcoesLiga,
    opcoesTempera,
    filtroListaOPs,
    setFiltroListaOPs,
    selectedOpsTon,
    selectedOpsListMesc,
    totvsSelectedTon,
    selectedOPsComPerda,
    opsParaTabelaTotvs,
    opsParaTabelaMESC,
    idsEmQualquerSequencia,
    loadAllFila,
    handleAdicionarAoDia,
    handleRemoverDoDia,
    handleRemoverTodos,
    sequenciasPorDia,
    handleReorderDiaTab,
    handleReorderSemana,
    handleConfirmarSequencia,
    handleDesbloquearSequencia,
    handleSliderChange,
    handleFilter,
    handleConfirmEditOP,
    addPreviewItems,
    removePreviewItem,
    updatePreviewItem,
    tableDisponiveisRef,
    tableTotvsRef,
    columnsDisponiveis,
    fetchDataDisponiveis,
    fetchDataTotvsModal,
    getDistinctValuesForColumnTotvs,
    getDistinctValuesForColumnMESC,
    onRowDisponiveis,
    onRowDisponiveisTotvs,
    rowSelection,
    rowSelectionTotvs,
    allFilaData,
    loadingFila,
    excecoesCapacidade,
    itensList,
    ferramentasOptions,
    ferramentasList,
    cenarios,
    cenarioAtivo,
    setCenarioAtivo,
    loadingCenarios,
    getDateKey,
    getOrCreateSeq,
    buildSequenciamentoPayload,
    hasPreviewSemFerramenta,
    canConfirmar,
  };
}
