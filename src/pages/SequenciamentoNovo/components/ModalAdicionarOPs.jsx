import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Space, Tabs, Typography } from 'antd';
import { HomeOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { LoadingSpinner, PaginatedTable } from '../../../components';
import { getPerdaPercentual } from '../../../helpers/itemFerramentaHelpers';
import { getDateKey, getOrCreateSeq } from '../utils/sequenciamentoCapacidade';

const { Text } = Typography;

/**
 * Modal para adicionar OPs ao dia: tabs OPs Totvs / OPs MESC, filtros, tabelas paginadas.
 * Toda a lógica (handlers, dados) vem via props do hook.
 */
export default function ModalAdicionarOPs({
  open,
  onCancel,
  afterClose,
  viewMode,
  diaSequenciamento,
  dateKey,
  diaAlvoAdicionar,
  setDiaAlvoAdicionar,
  diasDaSemana,
  tabDisponiveis,
  setTabDisponiveis,
  modalFiltroTipo,
  setModalFiltroTipo,
  modalSearchTerm,
  setModalSearchTerm,
  filtroListaOPs,
  setFiltroListaOPs,
  casaTon,
  clienteTon,
  casaCap,
  clienteCap,
  totvsSelectedTon,
  selectedOpsTon,
  selectedOpsListMesc,
  opsFiltradasModalTotvs,
  opsFiltradasModalMESC,
  selectedRowKeysTotvs,
  selectedRowKeys,
  sequenciasPorDia,
  handleAdicionarAoDia,
  tableTotvsRef,
  tableDisponiveisRef,
  fetchDataTotvsModal,
  fetchDataDisponiveis,
  columnsDisponiveis,
  loadingFila,
  onRowDisponiveisTotvs,
  onRowDisponiveis,
  rowSelectionTotvs,
  rowSelection,
  getDistinctValuesForColumnTotvs,
  getDistinctValuesForColumnMESC,
  setModalCriarOPMESCPai,
  selectedOPsComPerda,
  itensList,
}) {
  const [quantityOverrides, setQuantityOverrides] = useState({});

  // Ao abrir o modal, limpar overrides de quantidade para não mostrar valores de uma sessão anterior
  useEffect(() => {
    if (open) setQuantityOverrides({});
  }, [open]);

  const totvsDisplayTon = useMemo(() => {
    const selected = opsFiltradasModalTotvs?.filter((op) => selectedRowKeysTotvs?.includes(op.id)) ?? [];
    const casa = selected
      .filter((op) => (op.tipo || 'cliente') === 'casa')
      .reduce((s, op) => s + (Number(quantityOverrides[op.id] ?? op.quantidade) || 0) / 1000, 0);
    const cliente = selected
      .filter((op) => (op.tipo || 'cliente') !== 'casa')
      .reduce((s, op) => s + (Number(quantityOverrides[op.id] ?? op.quantidade) || 0) / 1000, 0);
    return { totalTon: casa + cliente, casaTon: casa, clienteTon: cliente };
  }, [opsFiltradasModalTotvs, selectedRowKeysTotvs, quantityOverrides]);

  const selectedOpsDisplayTon = useMemo(() => {
    const list = selectedOpsListMesc ?? [];
    const casa = list
      .filter((op) => (op.tipo || 'cliente') === 'casa')
      .reduce((s, op) => s + (Number(quantityOverrides[op.id] ?? op.quantidade) || 0) / 1000, 0);
    const cliente = list
      .filter((op) => (op.tipo || 'cliente') !== 'casa')
      .reduce((s, op) => s + (Number(quantityOverrides[op.id] ?? op.quantidade) || 0) / 1000, 0);
    return { totalTon: casa + cliente, casaTon: casa, clienteTon: cliente };
  }, [selectedOpsListMesc, quantityOverrides]);

  const columnsTotvsWithQty = useMemo(() => {
    return (columnsDisponiveis ?? []).map((col) =>
      col.key === 'quantidade'
        ? {
            ...col,
            render: (_, record) => {
              const isSelected = selectedRowKeysTotvs?.includes(record.id);
              if (!isSelected) {
                const v = record.quantidade;
                return v != null ? Number(v).toLocaleString('pt-BR') : '-';
              }
              return (
                <InputNumber
                  min={1}
                  step={1}
                  value={Number(quantityOverrides[record.id] ?? record.quantidade) || undefined}
                  onChange={(val) =>
                    setQuantityOverrides((prev) => ({ ...prev, [record.id]: val != null ? Number(val) : record.quantidade }))
                  }
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%' }}
                  size="small"
                />
              );
            },
          }
        : col
    );
  }, [columnsDisponiveis, quantityOverrides, selectedRowKeysTotvs]);

  const columnsMescWithQty = useMemo(() => {
    return (columnsDisponiveis ?? []).map((col) =>
      col.key === 'quantidade'
        ? {
            ...col,
            render: (_, record) => {
              const isSelected = selectedRowKeys?.includes(record.id);
              if (!isSelected) {
                const v = record.quantidade;
                return v != null ? Number(v).toLocaleString('pt-BR') : '-';
              }
              return (
                <InputNumber
                  min={1}
                  step={1}
                  value={Number(quantityOverrides[record.id] ?? record.quantidade) || undefined}
                  onChange={(val) =>
                    setQuantityOverrides((prev) => ({ ...prev, [record.id]: val != null ? Number(val) : record.quantidade }))
                  }
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%' }}
                  size="small"
                />
              );
            },
          }
        : col
    );
  }, [columnsDisponiveis, quantityOverrides, selectedRowKeys]);

  const targetDateKey =
    viewMode === 'semana' ? (diaAlvoAdicionar || getDateKey(diaSequenciamento.startOf('week'))) : dateKey;
  const seqTarget = getOrCreateSeq(sequenciasPorDia, targetDateKey);
  const targetConfirmada = seqTarget.confirmada;

  const totvsDisabled = selectedRowKeysTotvs.length === 0 || targetConfirmada;
  const mescDisabled = selectedRowKeys.length === 0 || targetConfirmada;

  return (
    <Modal
      key={open ? 'modal-open' : 'modal-closed'}
      title={
        <span>
          Adicionar OPs ao dia
          <Text type="secondary" style={{ marginLeft: 8, fontWeight: 400, fontSize: 14 }}>
            — {viewMode === 'semana' ? 'Semana' : 'Dia'}: {diaSequenciamento.format('dddd DD/MM/YYYY')}
          </Text>
        </span>
      }
      open={open}
      onCancel={(e) => {
        e?.stopPropagation?.();
        onCancel?.();
      }}
      afterClose={() => {
        setQuantityOverrides({});
        afterClose?.();
      }}
      width={1300}
      footer={null}
      destroyOnClose
      getContainer={() => document.body}
    >
      <Tabs
        activeKey={tabDisponiveis}
        onChange={setTabDisponiveis}
        items={[
          {
            key: 'totvs',
            label: 'OPs Totvs',
            children: (
              <div>
                {totvsDisplayTon?.totalTon > 0 && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '10px 12px',
                      background: '#e6f7ff',
                      borderRadius: 6,
                      border: '1px solid #91d5ff',
                      fontSize: 12,
                    }}
                  >
                    <Text strong>Capacidade das OPs selecionadas (filhas Totvs):</Text>
                    <Text style={{ marginLeft: 6 }}>{totvsDisplayTon.totalTon.toFixed(1)} ton</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (Casa: {totvsDisplayTon.casaTon.toFixed(1)} · Cliente: {totvsDisplayTon.clienteTon.toFixed(1)})
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Total previsto no dia: Casa {(casaTon + totvsDisplayTon.casaTon).toFixed(1)}/{casaCap} ton ·
                      Cliente {(clienteTon + totvsDisplayTon.clienteTon).toFixed(1)}/{clienteCap} ton
                    </Text>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Space size="middle" wrap>
                    <Space size="small">
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#666' }}>Filtro:</span>
                      <Button
                        type={modalFiltroTipo === 'casa' ? 'primary' : 'default'}
                        icon={<HomeOutlined />}
                        onClick={() => setModalFiltroTipo('casa')}
                      >
                        Casa
                      </Button>
                      <Button
                        type={modalFiltroTipo === 'cliente' ? 'primary' : 'default'}
                        icon={<TeamOutlined />}
                        onClick={() => setModalFiltroTipo('cliente')}
                      >
                        Cliente
                      </Button>
                    </Space>
                    <Input
                      placeholder="Buscar (código, produto, cliente)..."
                      allowClear
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      style={{ width: 240 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>OPs Disponíveis</span>
                    <Space size="small">
                      <Button
                        type={filtroListaOPs === 'disponiveis' ? 'primary' : 'default'}
                        onClick={() => setFiltroListaOPs('disponiveis')}
                      >
                        Disponíveis ({opsFiltradasModalTotvs?.length ?? 0})
                      </Button>
                      <Button
                        type={filtroListaOPs === 'selecionadas' ? 'primary' : 'default'}
                        onClick={() => setFiltroListaOPs('selecionadas')}
                      >
                        Selecionadas ({selectedRowKeysTotvs?.length ?? 0})
                      </Button>
                    </Space>
                  </Space>
                  <Space size="middle">
                    {viewMode === 'semana' && diasDaSemana?.length > 0 && (
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
                    <Button type="default" icon={<PlusOutlined />} onClick={() => setModalCriarOPMESCPai?.(null)}>
                      Criar OP MESC
                    </Button>
                    <Button type="primary" onClick={() => handleAdicionarAoDia(quantityOverrides)} disabled={totvsDisabled}>
                      Adicionar ao Dia
                    </Button>
                  </Space>
                </div>
                <PaginatedTable
                  ref={tableTotvsRef}
                  fetchData={fetchDataTotvsModal}
                  initialPageSize={10}
                  columns={columnsTotvsWithQty}
                  rowKey="id"
                  loadingIcon={<LoadingSpinner />}
                  disabled={loadingFila}
                  scroll={{ x: 'max-content' }}
                  onRow={onRowDisponiveisTotvs}
                  rowSelection={rowSelectionTotvs}
                  getDistinctValuesForColumn={getDistinctValuesForColumnTotvs}
                  usePopoverForColumnFilter
                />
              </div>
            ),
          },
          {
            key: 'mesc',
            label: 'OPs MESC',
            children: (
              <div>
                {selectedRowKeys?.length > 0 && selectedOpsDisplayTon?.totalTon > 0 && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '10px 12px',
                      background: '#e6f7ff',
                      borderRadius: 6,
                      border: '1px solid #91d5ff',
                      fontSize: 12,
                    }}
                  >
                    <Text strong>Capacidade das OPs selecionadas:</Text>
                    <Text style={{ marginLeft: 6 }}>{selectedOpsDisplayTon.totalTon.toFixed(1)} ton</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      (Casa: {selectedOpsDisplayTon.casaTon.toFixed(1)} · Cliente: {selectedOpsDisplayTon.clienteTon.toFixed(1)})
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Total previsto no dia: Casa {(casaTon + selectedOpsDisplayTon.casaTon).toFixed(1)}/{casaCap} ton ·
                      Cliente {(clienteTon + selectedOpsDisplayTon.clienteTon).toFixed(1)}/{clienteCap} ton
                    </Text>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Space size="middle" wrap>
                    <Space size="small">
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#666' }}>Filtro:</span>
                      <Button
                        type={modalFiltroTipo === 'casa' ? 'primary' : 'default'}
                        icon={<HomeOutlined />}
                        onClick={() => setModalFiltroTipo('casa')}
                      >
                        Casa
                      </Button>
                      <Button
                        type={modalFiltroTipo === 'cliente' ? 'primary' : 'default'}
                        icon={<TeamOutlined />}
                        onClick={() => setModalFiltroTipo('cliente')}
                      >
                        Cliente
                      </Button>
                    </Space>
                    <Input
                      placeholder="Buscar (código, produto, cliente)..."
                      allowClear
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      style={{ width: 240 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>OPs Disponíveis</span>
                    <Space size="small">
                      <Button
                        type={filtroListaOPs === 'disponiveis' ? 'primary' : 'default'}
                        onClick={() => setFiltroListaOPs('disponiveis')}
                      >
                        Disponíveis ({opsFiltradasModalMESC?.length ?? 0})
                      </Button>
                      <Button
                        type={filtroListaOPs === 'selecionadas' ? 'primary' : 'default'}
                        onClick={() => setFiltroListaOPs('selecionadas')}
                      >
                        Selecionadas ({selectedRowKeys?.length ?? 0})
                      </Button>
                    </Space>
                  </Space>
                  <Space size="middle">
                    {viewMode === 'semana' && diasDaSemana?.length > 0 && (
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
                    <Button type="primary" onClick={() => handleAdicionarAoDia(quantityOverrides)} disabled={mescDisabled}>
                      Adicionar ao Dia
                    </Button>
                  </Space>
                </div>
                <PaginatedTable
                  ref={tableDisponiveisRef}
                  fetchData={fetchDataDisponiveis}
                  initialPageSize={10}
                  columns={columnsMescWithQty}
                  rowKey="id"
                  loadingIcon={<LoadingSpinner />}
                  disabled={loadingFila}
                  scroll={{ x: 'max-content' }}
                  onRow={onRowDisponiveis}
                  rowSelection={rowSelection}
                  getDistinctValuesForColumn={getDistinctValuesForColumnMESC}
                  usePopoverForColumnFilter
                />
                {selectedOPsComPerda?.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    {selectedOPsComPerda.map((op) => {
                      const qtd = Number(op.quantidade) || 0;
                      const perdaFromHelper = getPerdaPercentual(itensList, op.liga, op.tempera, qtd);
                      const perdaPct =
                        perdaFromHelper > 0
                          ? perdaFromHelper
                          : op.percentualPerda != null
                            ? Number(op.percentualPerda)
                            : op.item?.percentualPerda || 0;
                      const produzir = Math.ceil(qtd / (1 - perdaPct / 100));
                      return (
                        <div key={op.id}>
                          {op.codigo}: Necessário: {qtd.toLocaleString('pt-BR')} | Produzir:{' '}
                          {produzir.toLocaleString('pt-BR')} ({perdaPct}% perda)
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
