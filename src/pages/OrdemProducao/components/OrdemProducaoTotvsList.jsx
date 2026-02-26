import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Badge, Button, message, Space, Tag, Tooltip, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { getUrgencyLevel, isDataEntregaAtrasada, urgencyColors } from '../../../helpers/urgency';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import { colors } from '../../../styles/colors';
import CriarOPMESCModal from './CriarOPMESCModal';

const { Text } = Typography;

const temperaTagColor = { T4: 'error', T5: 'processing', T6: 'blue', default: 'default' };

function getStatusCalculado(record, filhas = []) {
  const situacao = record.situacao;
  if (situacao === 'Cancelada') return { label: 'Cancelada', color: 'error' };
  const itens = record.itens || [];
  const quantidadeTotal = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
  let quantidadeProgramada = record.qtdProgramada != null ? Number(record.qtdProgramada) : 0;
  let quantidadeProduzida = record.qtdProduzida != null ? Number(record.qtdProduzida) : 0;
  if (quantidadeProgramada === 0 && quantidadeProduzida === 0 && filhas.length > 0) {
    quantidadeProgramada = filhas.reduce((sum, f) => {
      const itensF = f.itens || [];
      return sum + itensF.reduce((s, i) => s + (parseFloat(i.quantidadePecas) || 0), 0);
    }, 0);
  }
  if (quantidadeProduzida >= quantidadeTotal && quantidadeTotal > 0) return { label: 'Concluída', color: 'success' };
  if (quantidadeProgramada >= quantidadeTotal) return { label: 'Programada', color: 'processing' };
  if (quantidadeProgramada > 0) return { label: 'Parcial', color: 'warning' };
  return { label: 'Não Programada', color: 'default' };
}

const OrdemProducaoTotvsList = forwardRef(function OrdemProducaoTotvsList(
  {
    fetchData,
    onCriarOPMESC,
    onSelecionarFilha,
    /** Adiciona várias OPs filhas ao dia de uma vez (evita N toasts). Se definida, "Adicionar selecionadas ao dia" usa isto. */
    onAdicionarVariasFilhasAoDia,
    /** Quando definida, cada registo filha é mapeado antes de ser exibido (ex.: para definir disponivelParaSequenciamento e jaSequenciada no contexto da Fila). */
    enrichFilhaRecord,
    onViewFilha,
    onEditFilha,
    onCopyFilha,
    onDeleteFilha,
    onAtivarDesativarFilha,
  },
  ref
) {
  const tableRef = useRef(null);
  const expandidoRefs = useRef({});
  const [filhasMap, setFilhasMap] = useState({});
  const [loadingFilhas, setLoadingFilhas] = useState({});
  const loadedFilhasRef = useRef({});
  const [modalCriarOPPai, setModalCriarOPPai] = useState(null);
  const [selectedFilhasByOpPaiId, setSelectedFilhasByOpPaiId] = useState({});

  useImperativeHandle(ref, () => ({
    reloadTable: () => tableRef.current?.reloadTable?.(),
    reloadExpandido: (opPaiId) => {
      if (opPaiId && expandidoRefs.current[opPaiId]?.reloadTable) {
        expandidoRefs.current[opPaiId].reloadTable();
      }
    },
  }), []);

  const fetchFilhas = useCallback(async (opPaiId) => {
    if (loadedFilhasRef.current[opPaiId]) return;
    loadedFilhasRef.current[opPaiId] = true;
    setLoadingFilhas((prev) => ({ ...prev, [opPaiId]: true }));
    try {
      const response = await OrdemProducaoService.getAll({
        opPaiId,
        page: 1,
        pageSize: 100,
      });
      const data = response?.data?.data || [];
      setFilhasMap((prev) => ({ ...prev, [opPaiId]: data }));
    } catch (error) {
      console.error('Erro ao buscar OPs MESC:', error);
      setFilhasMap((prev) => ({ ...prev, [opPaiId]: [] }));
    } finally {
      setLoadingFilhas((prev) => ({ ...prev, [opPaiId]: false }));
    }
  }, []);

  const fetchDataFilhasExpandido = useCallback(
    (opPaiId) => async (page, pageSize, sorterField, sortOrder) => {
      const response = await OrdemProducaoService.getAll({
        opPaiId,
        page,
        pageSize,
        sorterField,
        sortOrder,
      });
      let data = response?.data?.data || [];
      if (enrichFilhaRecord) {
        data = data.map((r) => enrichFilhaRecord({ ...r, opPaiId: r.opPaiId ?? opPaiId }, opPaiId));
      }
      return {
        data,
        total: response?.data?.pagination?.totalRecords || 0,
      };
    },
    [enrichFilhaRecord]
  );

  const rowClassName = useCallback((record) => {
    const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
    if (!dataEntrega) return '';
    const diasTolerancia = record.diasToleranciaAtraso ?? record.itens?.[0]?.dias_tolerancia_atraso ?? 0;
    const atrasada = isDataEntregaAtrasada(dataEntrega, diasTolerancia) && record.situacao !== 'Encerrada';
    return atrasada ? 'op-atrasada' : '';
  }, []);

  const handleCriarOPMESCClick = useCallback(
    (record) => {
      if (onCriarOPMESC) {
        onCriarOPMESC(record);
      } else {
        setModalCriarOPPai(record);
      }
    },
    [onCriarOPMESC]
  );

  const handleCriarOPMESCSuccess = useCallback(() => {
    tableRef.current?.reloadTable?.();
    const opPaiId = modalCriarOPPai?.id;
    if (opPaiId && expandidoRefs.current[opPaiId]?.reloadTable) {
      expandidoRefs.current[opPaiId].reloadTable();
    }
    setModalCriarOPPai(null);
  }, [modalCriarOPPai?.id]);

  const columnsFilhas = useMemo(
    () => [
      { title: 'Código OP MESC', dataIndex: 'codigo', key: 'codigo', width: 130, render: (v) => v || '-' },
      {
        title: 'Ferramenta',
        key: 'ferramenta',
        width: 140,
        render: (_, record) => record.ferramenta?.descricao || record.ferramentas?.[0]?.descricao || '-',
      },
      {
        title: 'Quantidade',
        dataIndex: 'itens',
        key: 'quantidade',
        width: 100,
        align: 'right',
        render: (itens) => {
          if (!itens || !Array.isArray(itens)) return '0';
          return itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0).toLocaleString('pt-BR');
        },
      },
      {
        title: 'Data Programada',
        dataIndex: 'dataInicio',
        key: 'dataProgramada',
        width: 120,
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
      },
      {
        title: 'Status',
        dataIndex: 'situacao',
        key: 'situacao',
        width: 130,
        render: (situacao) => {
          const colorMap = { 'Em cadastro': 'default', 'Liberada': 'processing', 'Programada': 'warning', 'Encerrada': 'success', 'Cancelada': 'error' };
          return <Badge status={colorMap[situacao] || 'default'} style={{ fontSize: 9 }} text={situacao} />;
        },
      },
      {
        title: 'Seq.',
        key: 'sequenciamento',
        width: 120,
        render: (_, record) => {
          const jaSequenciada = record.jaSequenciada;
          const disponivel = record.disponivelParaSequenciamento;
          if (!jaSequenciada && !disponivel) return '-';
          return (
            <Space size={4} wrap>
              {jaSequenciada && <Tag color="success">Sequenciada</Tag>}
              {disponivel && !jaSequenciada && <Tag color="blue">Disponível p/ seq.</Tag>}
            </Space>
          );
        },
      },
      {
        title: '',
        key: 'problema',
        width: 32,
        render: (_, record) => {
          const hasProblema = record.ferramentaIndisponivel || record.alerta || record.statusDetalhado === 'falha';
          const tooltipTitle = record.statusDetalhado === 'falha' ? 'Ferramenta quebrada ou perda excessiva' : 'Indicador de problema';
          return hasProblema ? (
            <Tooltip title={tooltipTitle}>
              <span style={{ color: '#ff4d4f' }}>&#9888;</span>
            </Tooltip>
          ) : null;
        },
      },
      /* Coluna "Adicionar ao dia" por linha removida: usa-se seleção por checkboxes + botão "Adicionar selecionadas ao dia" */
      ...(onViewFilha || onEditFilha || onDeleteFilha
        ? [
            {
              title: 'Ações',
              key: 'actions',
              width: 120,
              fixed: 'right',
              render: (_, record) => (
                <ActionButtons
                  onView={onViewFilha ? () => onViewFilha(record) : undefined}
                  onEdit={onEditFilha ? () => onEditFilha(record) : undefined}
                  onCopy={onCopyFilha ? () => onCopyFilha(record) : undefined}
                  onActivate={onAtivarDesativarFilha ? () => onAtivarDesativarFilha(record) : undefined}
                  onDeactivate={onAtivarDesativarFilha ? () => onAtivarDesativarFilha(record) : undefined}
                  onDelete={onDeleteFilha ? () => onDeleteFilha(record) : undefined}
                  showCopy={false}
                  showActivate={false}
                  showDeactivate={false}
                  showDelete={!!onDeleteFilha}
                  isActive={record.ativo}
                  size="small"
                />
              ),
            },
          ]
        : []),
    ],
    [onSelecionarFilha, onViewFilha, onEditFilha, onCopyFilha, onDeleteFilha, onAtivarDesativarFilha]
  );

  const handleAdicionarSelecionadasAoDia = useCallback(
    (opPaiId, opPaiRecord) => {
      const sel = selectedFilhasByOpPaiId[opPaiId];
      const rows = sel?.rows ?? [];
      if (rows.length === 0) return;
      if (onAdicionarVariasFilhasAoDia) {
        onAdicionarVariasFilhasAoDia(rows, opPaiRecord);
      } else if (onSelecionarFilha) {
        rows.forEach((r) => onSelecionarFilha(r));
        message.success(rows.length === 1 ? 'OP adicionada ao dia.' : `${rows.length} OPs adicionadas ao dia.`);
      }
      setSelectedFilhasByOpPaiId((prev) => ({ ...prev, [opPaiId]: { keys: [], rows: [] } }));
      if (expandidoRefs.current[opPaiId]?.reloadTable) expandidoRefs.current[opPaiId].reloadTable();
    },
    [onSelecionarFilha, onAdicionarVariasFilhasAoDia, selectedFilhasByOpPaiId]
  );

  const expandable = useMemo(
    () => ({
      onExpand: (expanded, record) => {
        if (expanded) fetchFilhas(record.id);
      },
      expandedRowRender: (record) => {
        const opPaiId = record.id;
        const sel = selectedFilhasByOpPaiId[opPaiId] ?? { keys: [], rows: [] };
        const comSelecao = onSelecionarFilha || onAdicionarVariasFilhasAoDia;
        const rowSelectionFilhas =
          comSelecao ?
            {
              selectedRowKeys: sel.keys,
              onChange: (keys, rows) =>
                setSelectedFilhasByOpPaiId((prev) => ({
                  ...prev,
                  [opPaiId]: { keys, rows: rows ?? [] },
                })),
              getCheckboxProps: (r) => ({
                disabled: !(r.disponivelParaSequenciamento && !r.jaSequenciada),
              }),
            }
          : null;
        return (
          <div style={{ marginLeft: 24, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <Text strong style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.text.secondary }}>
                OPs MESC
              </Text>
              <Space>
                {comSelecao && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleAdicionarSelecionadasAoDia(opPaiId, record)}
                    disabled={(sel.keys?.length ?? 0) === 0}
                  >
                    Adicionar selecionadas ao dia
                  </Button>
                )}
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleCriarOPMESCClick(record)}>
                  Criar OP MESC
                </Button>
              </Space>
            </div>
            <PaginatedTable
              ref={(r) => {
                if (r) expandidoRefs.current[opPaiId] = r;
              }}
              fetchData={fetchDataFilhasExpandido(opPaiId)}
              initialPageSize={100}
              hidePagination
              columns={columnsFilhas}
              rowKey="id"
              rowSelection={rowSelectionFilhas}
              loadingIcon={<LoadingSpinner />}
              scroll={{ x: 'max-content' }}
            />
          </div>
        );
      },
    }),
    [
      fetchFilhas,
      fetchDataFilhasExpandido,
      columnsFilhas,
      handleCriarOPMESCClick,
      onSelecionarFilha,
      onAdicionarVariasFilhasAoDia,
      selectedFilhasByOpPaiId,
      handleAdicionarSelecionadasAoDia,
    ]
  );

  const columns = useMemo(
    () => [
      { title: 'OP Totvs', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 110 },
      {
        title: 'Produto',
        key: 'produto',
        width: 160,
        ellipsis: true,
        render: (_, record) => record.produto || record.itens?.[0]?.item?.descricao || '-',
      },
      {
        title: 'Cliente',
        dataIndex: ['cliente', 'nome'],
        key: 'cliente',
        width: 140,
        ellipsis: true,
        render: (_, record) => {
          const text = record?.cliente?.nome ?? '-';
          const str = String(text);
          const display = str.length > 15 ? `${str.slice(0, 15)}...` : str;
          return (
            <Tooltip title={str}>
              <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{display}</span>
            </Tooltip>
          );
        },
      },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        width: 90,
        render: (tipo) => {
          const t = (tipo || 'cliente').toLowerCase();
          return t === 'casa' ? <Tag color="blue">Casa</Tag> : <Tag>Cliente</Tag>;
        },
      },
      {
        title: 'Liga',
        dataIndex: 'liga',
        key: 'liga',
        width: 80,
        render: (_, record) => (
          <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{record.liga || '-'}</Tag>
        ),
      },
      {
        title: 'Têmpera',
        dataIndex: 'tempera',
        key: 'tempera',
        width: 80,
        render: (_, record) => (
          <Tag color={temperaTagColor[record.tempera] || temperaTagColor.default} style={{ margin: 0 }}>
            {record.tempera || '-'}
          </Tag>
        ),
      },
      {
        title: 'Qtd Total (kg)',
        key: 'qtdTotal',
        width: 80,
        align: 'right',
        render: (_, record) => {
          const itens = record.itens || [];
          const total = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
          return total > 0 ? total.toLocaleString('pt-BR') : (record.qtdTotalKg != null ? Number(record.qtdTotalKg).toLocaleString('pt-BR') : '-');
        },
      },
      {
        title: 'Qtd Programada',
        dataIndex: 'qtdProgramada',
        key: 'qtdProgramada',
        width: 80,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
      },
      {
        title: 'Qtd Produzida',
        dataIndex: 'qtdProduzida',
        key: 'qtdProduzida',
        width: 80,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
      },
      {
        title: 'Saldo',
        key: 'saldo',
        width: 60,
        align: 'right',
        render: (_, record) => {
          const itens = record.itens || [];
          const total = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
          const programada = record.qtdProgramada != null ? Number(record.qtdProgramada) : 0;
          const saldo = Math.max(0, total - programada);
          return <Text strong={saldo > 0}>{saldo.toLocaleString('pt-BR')}</Text>;
        },
      },
      {
        title: 'Data Entrega',
        key: 'dataEntrega',
        width: 80,
        render: (_, record) => {
          const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
          const diasTolerancia = record.diasToleranciaAtraso ?? record.itens?.[0]?.dias_tolerancia_atraso ?? 0;
          const level = getUrgencyLevel(dataEntrega, record.situacao === 'Encerrada' ? 'concluida' : '', diasTolerancia);
          const color = urgencyColors[level];
          return <span style={{ color: color || undefined }}>{dataEntrega ? dayjs(dataEntrega).format('DD/MM/YYYY') : '-'}</span>;
        },
      },
      {
        title: 'Status',
        key: 'statusCalculado',
        width: 130,
        render: (_, record) => {
          const filhas = filhasMap[record.id] || [];
          const { label, color } = getStatusCalculado(record, filhas);
          return <Tag color={color}>{label}</Tag>;
        },
      },
    ],
    [filhasMap]
  );

  return (
    <>
      <PaginatedTable
        ref={tableRef}
        fetchData={fetchData}
        initialPageSize={10}
        columns={columns}
        loadingIcon={<LoadingSpinner />}
        rowKey="id"
        expandable={expandable}
        rowClassName={rowClassName}
        scroll={{ x: 'max-content' }}
      />
      {!onCriarOPMESC && (
        <CriarOPMESCModal
          open={modalCriarOPPai != null}
          onClose={() => setModalCriarOPPai(null)}
          opPaiId={modalCriarOPPai?.id}
          opPaiRecord={modalCriarOPPai ?? undefined}
          onSuccess={handleCriarOPMESCSuccess}
        />
      )}
    </>
  );
});

export default OrdemProducaoTotvsList;
