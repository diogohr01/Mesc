import React from 'react';
import { Button, Col, Layout, message, Row, Space, Tag, Typography } from 'antd';
import { LockOutlined, ThunderboltOutlined, UnlockOutlined } from '@ant-design/icons';
import { AiOutlineClear } from 'react-icons/ai';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { Card, DateNavStepper, FilterModalForm } from '../../components';
import { colors } from '../../styles/colors';
import CriarOPMESCModal from '../OrdemProducao/components/CriarOPMESCModal';
import { useSequenciamentoLogic } from './hooks/useSequenciamentoLogic.jsx';
import { getDateKey, getOrCreateSeq } from './utils/sequenciamentoCapacidade';
import {
  CapacidadeBarras,
  SequenciaDiaList,
  SequenciaSemanaList,
  PreviewList,
  ModalAdicionarOPs,
  JustificativaModal,
  EditOPModal,
} from './components';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Text } = Typography;

function SequenciamentoNovoPage() {
  const logic = useSequenciamentoLogic();
  const {
    capacityForDate,
    casaCap,
    clienteCap,
    capacidadeTotal,
    excecaoDia,
    dateKey,
    currentSeq,
    confirmada,
    casaTon,
    clienteTon,
    diasDaSemana,
    casaTonSemana,
    clienteTonSemana,
    CAPACIDADE_CASA_SEMANA,
    CAPACIDADE_CLIENTE_SEMANA,
    CAPACIDADE_TOTAL_SEMANA,
    filtroTipo,
    setFiltroTipo,
    viewMode,
    setViewMode,
    diaSequenciamento,
    handleDateChange,
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
    seqDiaAtiva,
    selectedRowKeys,
    selectedOpsTon,
    selectedOpsListMesc,
    opsFiltradasModalTotvs,
    selectedRowKeysTotvs,
    sequenciasPorDia,
    loadAllFila,
    handleAdicionarAoDia,
    handleRemoverDoDia,
    handleRemoverTodos,
    handleReorderDiaTab,
    handleReorderSemana,
    handleConfirmarSequencia,
    handleDesbloquearSequencia,
    handleConfirmEditOP,
    removePreviewItem,
    updatePreviewItem,
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
    totvsSelectedTon,
    selectedOPsComPerda,
    itensList,
    ferramentasOptions,
    opsSemanaOrdenadas,
    opsSemanaFiltradas,
    semanaTemOPs,
    opcoesLiga,
    opcoesTempera,
    handleFilter,
    canConfirmar,
    setSelectedRowKeys,
    setSelectedRowKeysTotvs,
    setFiltroLiga,
    setFiltroTempera,
    filtroListaOPs,
    setFiltroListaOPs,
    opsFiltradasModalMESC,
  } = logic;

  const filtrosNaTitulo = (
    <Space wrap size="small">
      <Space>
        <DateNavStepper
          value={getDateKey(diaSequenciamento)}
          onChange={handleDateChange}
          mode={viewMode === 'semana' ? 'semana' : 'dia'}
          format="dddd DD/MM/YYYY"
        />
        <Button type={viewMode === 'dia' ? 'primary' : 'default'} onClick={() => setViewMode('dia')}>
          Dia
        </Button>
        <Button type={viewMode === 'semana' ? 'primary' : 'default'} onClick={() => setViewMode('semana')}>
          Semana
        </Button>
      </Space>
      {excecaoDia && (
        <Tag color="orange" title={excecaoDia.motivo || undefined}>
          Exceção: {capacityForDate.casaPct}/{capacityForDate.clientePct}
        </Tag>
      )}
      <Button
        type="primary"
        icon={<LockOutlined />}
        onClick={handleConfirmarSequencia}
        disabled={!canConfirmar}
      >
        Confirmar Sequência
      </Button>
      {(viewMode === 'dia' ? confirmada : diasDaSemana.filter((d) => d.confirmada).length >= 2) && (
        <Button icon={<UnlockOutlined />} onClick={handleDesbloquearSequencia}>
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
                    <CapacidadeBarras
                      filtroTipo={filtroTipo}
                      setFiltroTipo={setFiltroTipo}
                      viewMode={viewMode}
                      casaTon={casaTon}
                      clienteTon={clienteTon}
                      casaCap={casaCap}
                      clienteCap={clienteCap}
                      capacidadeTotal={capacidadeTotal}
                      casaTonSemana={casaTonSemana}
                      clienteTonSemana={clienteTonSemana}
                      CAPACIDADE_CASA_SEMANA={CAPACIDADE_CASA_SEMANA}
                      CAPACIDADE_CLIENTE_SEMANA={CAPACIDADE_CLIENTE_SEMANA}
                      CAPACIDADE_TOTAL_SEMANA={CAPACIDADE_TOTAL_SEMANA}
                      confirmada={confirmada}
                      excecaoDia={excecaoDia}
                      capacityForDate={capacityForDate}
                    />
                    {selectedRowKeys?.length > 0 && selectedOpsTon?.totalTon > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          background: '#e6f7ff',
                          borderRadius: 6,
                          border: '1px solid #91d5ff',
                          fontSize: 12,
                        }}
                      >
                        <Text strong>Selecionadas para adicionar:</Text>
                        <Text style={{ marginLeft: 6 }}>{selectedOpsTon.totalTon.toFixed(1)} ton</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          (Casa: {selectedOpsTon.casaTon.toFixed(1)} · Cliente: {selectedOpsTon.clienteTon.toFixed(1)})
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {filtroTipo === 'todos'
                            ? `Total previsto: ${(casaTon + clienteTon + selectedOpsTon.totalTon).toFixed(1)}/${capacidadeTotal} ton`
                            : `Total previsto: Casa ${(casaTon + selectedOpsTon.casaTon).toFixed(1)}/${casaCap} ton · Cliente ${(clienteTon + selectedOpsTon.clienteTon).toFixed(1)}/${clienteCap} ton`}
                        </Text>
                      </div>
                    )}
                  </Col>
                </Row>

                {viewMode === 'semana' ? (
                  <Row gutter={16}>
                    <Col span={24}>
                      <SequenciaSemanaList
                        diaSequenciamento={diaSequenciamento}
                        filtroTipo={filtroTipo}
                        opsSemanaOrdenadas={opsSemanaOrdenadas}
                        opsSemanaFiltradas={opsSemanaFiltradas}
                        diasDaSemana={diasDaSemana}
                        semanaTemOPs={semanaTemOPs}
                        handleReorderSemana={handleReorderSemana}
                        setModalDisponiveisOpen={setModalDisponiveisOpen}
                      />
                    </Col>
                  </Row>
                ) : seqDiaAtiva?.length > 0 ? (
                  <Row gutter={16}>
                    <Col span={24}>
                      <SequenciaDiaList
                        seqDiaAtiva={seqDiaAtiva}
                        confirmada={confirmada}
                        diaSequenciamento={diaSequenciamento}
                        filtroTipo={filtroTipo}
                        setFiltroTipo={setFiltroTipo}
                        handleReorderDiaTab={handleReorderDiaTab}
                        handleRemoverDoDia={handleRemoverDoDia}
                        handleRemoverTodos={handleRemoverTodos}
                        setModalDisponiveisOpen={setModalDisponiveisOpen}
                        setEditOPModal={setEditOPModal}
                      />
                    </Col>
                  </Row>
                ) : (
                  <Row gutter={16}>
                    <Col span={24}>
                      <Card
                        title={<span style={{ fontSize: 12, fontWeight: 600 }}>Sequência — {diaSequenciamento.format('DD/MM')}</span>}
                        size="small"
                        bodyStyle={{ padding: 16 }}
                        extra={
                          !confirmada && (
                            <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
                              Adicionar OPs ao dia
                            </Button>
                          )
                        }
                      >
                        <div style={{ textAlign: 'center', color: '#666' }}>Nenhuma OP sequenciada neste dia.</div>
                      </Card>
                    </Col>
                  </Row>
                )}

                {currentSeq.preview?.length > 0 && !confirmada && (
                  <PreviewList
                    preview={currentSeq.preview}
                    dateKey={dateKey}
                    updatePreviewItem={updatePreviewItem}
                    removePreviewItem={removePreviewItem}
                    ferramentasOptions={ferramentasOptions}
                  />
                )}

                <ModalAdicionarOPs
                  open={modalDisponiveisOpen}
                  onCancel={() => {
                    setModalDisponiveisOpen(false);
                    setTabDisponiveis('totvs');
                  }}
                  afterClose={() => {
                    setTabDisponiveis('totvs');
                    setSelectedRowKeys([]);
                    setSelectedRowKeysTotvs([]);
                    setModalSearchTerm('');
                    setModalFiltroTipo('casa');
                  }}
                  viewMode={viewMode}
                  diaSequenciamento={diaSequenciamento}
                  dateKey={dateKey}
                  diaAlvoAdicionar={diaAlvoAdicionar}
                  setDiaAlvoAdicionar={setDiaAlvoAdicionar}
                  diasDaSemana={diasDaSemana}
                  tabDisponiveis={tabDisponiveis}
                  setTabDisponiveis={setTabDisponiveis}
                  modalFiltroTipo={modalFiltroTipo}
                  setModalFiltroTipo={setModalFiltroTipo}
                  modalSearchTerm={modalSearchTerm}
                  setModalSearchTerm={setModalSearchTerm}
                  filtroListaOPs={filtroListaOPs}
                  setFiltroListaOPs={setFiltroListaOPs}
                  casaTon={casaTon}
                  clienteTon={clienteTon}
                  casaCap={casaCap}
                  clienteCap={clienteCap}
                  totvsSelectedTon={totvsSelectedTon}
                  selectedOpsTon={selectedOpsTon}
                  selectedOpsListMesc={selectedOpsListMesc}
                  opsFiltradasModalTotvs={opsFiltradasModalTotvs}
                  opsFiltradasModalMESC={opsFiltradasModalMESC}
                  selectedRowKeysTotvs={selectedRowKeysTotvs}
                  selectedRowKeys={selectedRowKeys}
                  sequenciasPorDia={sequenciasPorDia}
                  handleAdicionarAoDia={handleAdicionarAoDia}
                  tableTotvsRef={tableTotvsRef}
                  tableDisponiveisRef={tableDisponiveisRef}
                  fetchDataTotvsModal={fetchDataTotvsModal}
                  fetchDataDisponiveis={fetchDataDisponiveis}
                  columnsDisponiveis={columnsDisponiveis}
                  loadingFila={loadingFila}
                  onRowDisponiveisTotvs={onRowDisponiveisTotvs}
                  onRowDisponiveis={onRowDisponiveis}
                  rowSelectionTotvs={rowSelectionTotvs}
                  rowSelection={rowSelection}
                  getDistinctValuesForColumnTotvs={getDistinctValuesForColumnTotvs}
                  getDistinctValuesForColumnMESC={getDistinctValuesForColumnMESC}
                  setModalCriarOPMESCPai={setModalCriarOPMESCPai}
                  selectedOPsComPerda={selectedOPsComPerda}
                  itensList={itensList}
                />

                <CriarOPMESCModal
                  open={modalCriarOPMESCPai !== undefined}
                  onClose={() => setModalCriarOPMESCPai(undefined)}
                  opPaiId={modalCriarOPMESCPai?.id}
                  opPaiRecord={
                    typeof modalCriarOPMESCPai === 'object' && modalCriarOPMESCPai != null ? modalCriarOPMESCPai : undefined
                  }
                  itensList={itensList}
                  onSuccess={() => {
                    loadAllFila();
                    setModalCriarOPMESCPai(undefined);
                    tableTotvsRef.current?.reloadTable?.();
                  }}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        <JustificativaModal
          visible={!!justificativaModal}
          justificativaModal={justificativaModal}
          justificativaTexto={justificativaTexto}
          setJustificativaTexto={setJustificativaTexto}
          onConfirm={() => {
            message.info(justificativaTexto ? `Justificativa registrada: ${justificativaTexto}` : 'Justificativa registrada.');
            setJustificativaModal(null);
            setJustificativaTexto('');
          }}
          onCancel={() => setJustificativaModal(null)}
        />

        <EditOPModal
          editOPModal={editOPModal}
          setEditOPModal={setEditOPModal}
          ferramentasOptions={ferramentasOptions}
          handleConfirmEditOP={handleConfirmEditOP}
        />
      </Content>
    </Layout>
  );
}

export default SequenciamentoNovoPage;
