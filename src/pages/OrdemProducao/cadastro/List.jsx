import { Badge, Button, Col, Form, Layout, message, Modal, Row, Space, Table, Tabs, Tag, Typography } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons, periodToDataRange } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import { getUrgencyLevel, urgencyColors } from '../../../helpers/urgency';
import { toast } from '../../../helpers/toast';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import { colors } from '../../../styles/colors';
import CriarOPMESCModal from '../components/CriarOPMESCModal';

const { confirm } = Modal;
const { Content } = Layout;
const { Text } = Typography;
const SITUACOES = [
  { key: 'todos', label: 'Todos' },
  { key: 'Em cadastro', label: 'Em cadastro' },
  { key: 'Liberada', label: 'Liberada' },
  { key: 'Programada', label: 'Programada' },
  { key: 'Encerrada', label: 'Encerrada' },
  { key: 'Cancelada', label: 'Cancelada' },
];

function getStatusCalculado(record, filhas = []) {
  const situacao = record.situacao;
  if (situacao === 'Encerrada') return { label: 'Concluída', color: 'success' };
  if (situacao === 'Cancelada') return { label: 'Cancelada', color: 'error' };
  if (situacao === 'Programada') return { label: 'Programada', color: 'processing' };
  const filhasList = filhas.length ? filhas : record.filhas || [];
  const hasProgramada = filhasList.some((f) => f.situacao === 'Programada' || f.situacao === 'Encerrada');
  if (hasProgramada) return { label: 'Parcial', color: 'warning' };
  return { label: 'Não Programada', color: 'default' };
}

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const tableFilhasRef = useRef(null);
  const [filhasMap, setFilhasMap] = useState({});
  const [loadingFilhas, setLoadingFilhas] = useState({});
  const loadedFilhasRef = useRef({});
  const { searchTerm, clearSearch } = useFilterSearchContext();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState('pai');
  const [modalCriarOPOpen, setModalCriarOPOpen] = useState(false);
  const [modalCriarOPPai, setModalCriarOPPai] = useState(null);

  const filterFormConfig = useMemo(() => [
    {
      columns: 1,
      questions: [
        { type: 'period', id: 'period', noLabel: false, label: 'Período', size: 'middle' },
      ],
    },
   
    {
      columns: 4,
      questions: [
        { type: 'text', id: 'numeroOPERP', required: false, placeholder: 'Digite o número da OP...', label: 'OP ERP', size: 'middle' },
        { type: 'text', id: 'cliente', required: false, placeholder: 'Digite o nome do cliente...', label: 'Cliente', size: 'middle' },
        { type: 'select', id: 'filtroTipo', required: false, label: 'Tipo', size: 'middle', options: [{ value: 'todos', label: 'Todos' }, { value: 'casa', label: 'Casa' }, { value: 'cliente', label: 'Cliente' }] },
        { type: 'select', id: 'situacao', required: false, placeholder: 'Selecione a situação', label: 'Situação', size: 'middle', options: SITUACOES.map((s) => ({ value: s.key, label: s.label })) },
        { type: 'date', id: 'dataOP', required: false, placeholder: 'Selecione a data...', label: 'Data', size: 'middle' },
      ],
    },
  ], []);

  // Função debounced para aplicar filtros (inclui pesquisa e ambas as tabelas)
  const debouncedReloadTable = useMemo(
    () => debounce(() => {
      if (tableRef.current) tableRef.current.reloadTable();
      if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
    }, 300),
    []
  );

  // Lista mostra apenas OP Pai; OP Filhas aparecem ao expandir a linha
  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const { dataInicio: di, dataFim: df } = periodToDataRange(filters.period);
        const requestData = {
          page,
          pageSize,
          sorterField,
          sortOrder,
          tipoOp: 'PAI',
          numeroOPERP: filters.numeroOPERP,
          cliente: filters.cliente,
          filtroTipo: filters.filtroTipo && filters.filtroTipo !== 'todos' ? filters.filtroTipo : undefined,
          situacao: statusFilter !== 'todos' ? statusFilter : (filters.situacao && filters.situacao !== 'todos' ? filters.situacao : undefined),
          dataOP: filters.dataOP ? dayjs(filters.dataOP).format('YYYY-MM-DD') : undefined,
          dataInicio: di,
          dataFim: df,
          search: searchTerm?.trim() || undefined,
        };

        const response = await OrdemProducaoService.getAll(requestData);

        return {
          data: response.data.data || [],
          total: response.data.pagination?.totalRecords || 0
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        console.error('Erro ao buscar dados:', error);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm, statusFilter, searchTerm]
  );

  const fetchDataFilhas = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const { dataInicio: di, dataFim: df } = periodToDataRange(filters.period);
        const requestData = {
          page,
          pageSize,
          sorterField,
          sortOrder,
          tipoOp: 'FILHA',
          numeroOPERP: filters.numeroOPERP,
          cliente: filters.cliente,
          filtroTipo: filters.filtroTipo && filters.filtroTipo !== 'todos' ? filters.filtroTipo : undefined,
          situacao: statusFilter !== 'todos' ? statusFilter : (filters.situacao && filters.situacao !== 'todos' ? filters.situacao : undefined),
          dataInicio: di,
          dataFim: df,
          search: searchTerm?.trim() || undefined,
        };

        const response = await OrdemProducaoService.getAll(requestData);

        return {
          data: response.data.data || [],
          total: response.data.pagination?.totalRecords || 0
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm, statusFilter, searchTerm]
  );

  const handleEdit = useCallback((record) => {
    onEdit(record);
  }, [onEdit]);

  const handleView = useCallback((record) => {
    onView(record);
  }, [onView]);

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir esta Ordem de Produção?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        setLoading(true);
        try {
          await OrdemProducaoService.delete(record.id);
          message.success('Ordem de Produção excluída com sucesso!');
          if (tableRef.current) {
            tableRef.current.reloadTable();
          }
        } catch (error) {
          message.error('Erro ao excluir Ordem de Produção.');
          console.error('Erro ao excluir:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  }, []);

  const handleCopy = useCallback(async (record) => {
    try {
      setLoading(true);
      const response = await OrdemProducaoService.copiar(record.id);
      if (response.success) {
        message.success('Ordem de Produção copiada com sucesso!');
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }
    } catch (error) {
      message.error('Erro ao copiar Ordem de Produção.');
      console.error('Erro ao copiar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAtivarDesativar = useCallback(async (record) => {
    try {
      setLoading(true);
      const novoStatus = !record.ativo;
      const response = await OrdemProducaoService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        toast.success(novoStatus ? 'Ordem ativada com sucesso!' : 'Ordem desativada com sucesso!');
        if (tableRef.current) tableRef.current.reloadTable();
        if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
      }
    } catch (error) {
      toast.error('Erro ao alterar status da Ordem.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const filters = filterForm.getFieldsValue();
      const { dataInicio: di, dataFim: df } = periodToDataRange(filters.period);
      const response = await OrdemProducaoService.exportar({
        ...filters,
        dataInicio: di,
        dataFim: df,
        search: searchTerm?.trim() || undefined,
        situacao: statusFilter !== 'todos' ? statusFilter : undefined,
      });
      const list = response?.data?.data ?? response?.data ?? [];
      const rows = Array.isArray(list) ? list : [];
      const headers = ['OP ERP', 'Data', 'Nº Pedido', 'Cliente', 'Situação', 'Qtd Total', 'Entrega'];
      const escape = (v) => (v == null ? '' : String(v).replace(/"/g, '""'));
      const rowToCsv = (r) => {
        const dataEntrega = r.dataEntrega ?? r.itens?.[0]?.dataEntrega;
        const qtd = (r.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadePecas) || 0), 0);
        return [r.numeroOPERP, r.dataOP ? dayjs(r.dataOP).format('DD/MM/YYYY') : '', r.numeroPedidoCliente ?? '', r.cliente?.nome ?? '', r.situacao ?? '', qtd, dataEntrega ? dayjs(dataEntrega).format('DD/MM/YYYY') : ''].map(escape).join(',');
      };
      const csv = [headers.join(','), ...rows.map(rowToCsv)].join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordens-producao-${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportado com sucesso.');
    } catch (error) {
      toast.error('Erro ao exportar.');
      console.error('Erro ao exportar:', error);
    }
  }, [filterForm, searchTerm, statusFilter]);

  const handleFilter = useCallback(() => {
    debouncedReloadTable();
    if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
  }, [debouncedReloadTable]);

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  const handleStatusClick = useCallback((key) => {
    setStatusFilter(key);
    setTimeout(() => {
      if (tableRef.current) tableRef.current.reloadTable();
      if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
    }, 0);
  }, []);

  const rowClassName = useCallback((record) => {
    const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
    if (!dataEntrega) return '';
    const atrasada = dayjs(dataEntrega).isBefore(dayjs(), 'day') && record.situacao !== 'Encerrada';
    return atrasada ? 'op-atrasada' : '';
  }, []);

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
      console.error('Erro ao buscar OP Filhas:', error);
      setFilhasMap((prev) => ({ ...prev, [opPaiId]: [] }));
    } finally {
      setLoadingFilhas((prev) => ({ ...prev, [opPaiId]: false }));
    }
  }, []);

  const columnsFilhas = useMemo(() => [
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
        return <Badge status={colorMap[situacao] || 'default'} text={situacao} />;
      },
    },
    {
      title: '',
      key: 'problema',
      width: 32,
      render: (_, record) => {
        const hasProblema = record.ferramentaIndisponivel || record.alerta;
        return hasProblema ? <span style={{ color: '#ff4d4f' }} title="Indicador de problema">&#9888;</span> : null;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record)}
          onEdit={() => handleEdit(record)}
          onCopy={() => handleCopy(record)}
          onActivate={() => handleAtivarDesativar(record)}
          onDeactivate={() => handleAtivarDesativar(record)}
          onDelete={() => handleDelete(record)}
          showCopy={false}
          showActivate={false}
          showDeactivate={false}
          showDelete={true}
          isActive={record.ativo}
          size="small"
        />
      ),
    },
  ], [handleView, handleEdit, handleCopy, handleAtivarDesativar, handleDelete]);

  const expandable = useMemo(
    () => ({
      onExpand: (expanded, record) => {
        if (expanded) fetchFilhas(record.id);
      },
      expandedRowRender: (record) => {
        const filhas = filhasMap[record.id] || [];
        const loadingF = loadingFilhas[record.id];
        if (loadingF) {
          return (
            <div style={{ marginLeft: 24, padding: '16px', textAlign: 'center', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
              <Typography.Text type="secondary">Carregando OP Filhas...</Typography.Text>
            </div>
          );
        }
        return (
          <div style={{ marginLeft: 24, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <Text strong style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.text.secondary }}>OPs MESC (filhas)</Text>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setModalCriarOPPai(record); setModalCriarOPOpen(true); }}>
                Criar OP MESC
              </Button>
            </div>
            {!filhas.length ? (
              <Typography.Text type="secondary">Nenhuma OP Filha vinculada.</Typography.Text>
            ) : (
            <Table
              dataSource={filhas}
              columns={columnsFilhas}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 'max-content' }}
            />
            )}
          </div>
        );
      },
    }),
    [filhasMap, loadingFilhas, fetchFilhas, columnsFilhas]
  );

  const columns = useMemo(() => [
    { title: 'OP Totvs', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 110 },
    {
      title: 'Produto',
      key: 'produto',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.produto || record.itens?.[0]?.item?.descricao || '-',
    },
    { title: 'Cliente', dataIndex: ['cliente', 'nome'], key: 'cliente', width: 180, ellipsis: true },
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
      title: 'Qtd Total (kg)',
      key: 'qtdTotal',
      width: 110,
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
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
    },
    {
      title: 'Qtd Produzida',
      dataIndex: 'qtdProduzida',
      key: 'qtdProduzida',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
    },
    {
      title: 'Saldo',
      key: 'saldo',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const itens = record.itens || [];
        const total = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
        const programada = record.qtdProgramada != null ? Number(record.qtdProgramada) : 0;
        const saldo = total - programada;
        return <Text strong={saldo > 0}>{saldo >= 0 ? saldo.toLocaleString('pt-BR') : '-'}</Text>;
      },
    },
    {
      title: 'Data Entrega',
      key: 'dataEntrega',
      width: 110,
      render: (_, record) => {
        const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
        const level = getUrgencyLevel(dataEntrega, record.situacao === 'Encerrada' ? 'concluida' : '');
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
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <ActionButtons
          onView={() => handleView(record)}
          onEdit={() => handleEdit(record)}
          onCopy={() => handleCopy(record)}
          onActivate={() => handleAtivarDesativar(record)}
          onDeactivate={() => handleAtivarDesativar(record)}
          onDelete={undefined}
          showCopy={false}
          showActivate={false}
          showDeactivate={false}
          showDelete={false}
          isActive={record.ativo}
          size="small"
        />
      ),
    },
  ], [handleEdit, handleView, handleCopy, handleAtivarDesativar, filhasMap]);

  // Colunas para a aba OPs Filhas (lista paginada, com Recurso, sem expandível)
  const columnsFilhasList = useMemo(() => [
    { title: 'OP ERP', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 120 },
    { title: 'Data', dataIndex: 'dataOP', key: 'dataOP', width: 120, render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'), sorter: true },
    { title: 'Recurso', key: 'recurso', width: 140, render: (_, r) => r.ferramenta?.descricao || r.ferramentas?.[0]?.descricao || '-' },
    { title: 'Nº Pedido', dataIndex: 'numeroPedidoCliente', key: 'numeroPedidoCliente', width: 120, render: (val, r) => val || (r.pedidoId ? `Pedido #${r.pedidoId}` : '-') },
    { title: 'Cliente', dataIndex: ['cliente', 'nome'], key: 'cliente', width: 250 },
    { title: 'Entrega', key: 'dataEntrega', width: 120, render: (_, r) => { const d = r.dataEntrega ?? r.itens?.[0]?.dataEntrega; return d ? dayjs(d).format('DD/MM/YYYY') : '-'; } },
    { title: 'Situação', dataIndex: 'situacao', key: 'situacao', width: 150, render: (situacao) => { const colorMap = { 'Em cadastro': 'default', 'Liberada': 'processing', 'Programada': 'warning', 'Encerrada': 'success', 'Cancelada': 'error' }; return <Badge status={colorMap[situacao] || 'default'} text={situacao} />; } },
    { title: 'Qtd Total (peças)', dataIndex: 'itens', key: 'quantidadeTotal', width: 150, align: 'right', render: (itens) => (itens && Array.isArray(itens) ? itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0).toLocaleString('pt-BR') : '0') },
    { title: 'Ações', key: 'actions', width: 150, fixed: 'right', render: (_, record) => (<ActionButtons onView={() => handleView(record)} onEdit={() => handleEdit(record)} showCopy={false} showActivate={false} showDeactivate={false} showDelete={false} size="small" />) },
  ], [handleView, handleEdit]);

  // Cleanup do debounce quando o componente for desmontado
  useEffect(() => {
    return () => {
      debouncedReloadTable.cancel();
    };
  }, [debouncedReloadTable]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Ordens de Produção"
              subtitle="Gestão de OPs Totvs (pai) e OPs MESC (filhas)"
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} onClick={() => { setModalCriarOPPai(null); setModalCriarOPOpen(true); }}>
                    Criar OP Manual
                  </Button>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Exportar</Button>
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
                          filterForm.resetFields();
                          clearSearch();
                          debouncedReloadTable();
                          setModalFiltrosOpen(false);
                        }}
                        size="middle"
                      >
                        Limpar
                      </Button>
                    }
                  />
                </Space>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 12 }}>
               
                <Space wrap>
                  {SITUACOES.map(({ key, label }) => (
                    <Button key={key} type={statusFilter === key ? 'primary' : 'default'} onClick={() => handleStatusClick(key)}>
                      {label}
                    </Button>
                  ))}
                </Space>
              </Space>

              <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                  key: 'pai',
                  label: 'OPs Pai',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <PaginatedTable
                        ref={tableRef}
                        disabled={loading}
                        fetchData={fetchData}
                        initialPageSize={10}
                        columns={columns}
                        loadingIcon={<LoadingSpinner />}
                        rowKey="id"
                        expandable={expandable}
                        rowClassName={rowClassName}
                      />
                    </div>
                  ),
                },
                {
                  key: 'filhas',
                  label: 'OPs Filhas',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <PaginatedTable
                        ref={tableFilhasRef}
                        disabled={loading}
                        fetchData={fetchDataFilhas}
                        initialPageSize={10}
                        columns={columnsFilhasList}
                        loadingIcon={<LoadingSpinner />}
                        rowKey="id"
                        rowClassName={rowClassName}
                      />
                    </div>
                  ),
                },
              ]} />
            </Card>
          </Col>
        </Row>
        <CriarOPMESCModal
          open={modalCriarOPOpen}
          onClose={() => { setModalCriarOPOpen(false); setModalCriarOPPai(null); }}
          opPaiId={modalCriarOPPai?.id}
          opPaiRecord={modalCriarOPPai}
          onSuccess={() => {
            if (tableRef.current) tableRef.current.reloadTable();
            if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
            setModalCriarOPOpen(false);
            setModalCriarOPPai(null);
          }}
        />
      </Content>
    </Layout>
  );
};

export default memo(List);
