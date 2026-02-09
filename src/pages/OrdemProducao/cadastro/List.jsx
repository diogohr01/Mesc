import { Badge, Button, Col, Form, Input, Layout, message, Modal, Row, Space, Table, Tabs, Typography } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlineSearch } from 'react-icons/ai';
import { Card, DynamicForm, LoadingSpinner, PaginatedTable, ActionButtons, periodToDataRange } from '../../../components';
import { toast } from '../../../helpers/toast';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import { colors } from '../../../styles/colors';

const { confirm } = Modal;
const { Content } = Layout;
const { Text } = Typography;
const SITUACOES = [
  { key: 'todos', label: 'Todos' },
  { key: 'Em cadastro', label: 'Em cadastro' },
  { key: 'Liberada', label: 'Liberada' },
  { key: 'Programada', label: 'Programada' },
  { key: 'Encerrada', label: 'Encerrada' },
];

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const tableFilhasRef = useRef(null);
  const [filhasMap, setFilhasMap] = useState({});
  const [loadingFilhas, setLoadingFilhas] = useState({});
  const loadedFilhasRef = useRef({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState('pai');

  const filterFormConfig = useMemo(() => [
    {
      columns: 1,
      questions: [
        { type: 'period', id: 'period', noLabel: true },
      ],
    },
    {
      columns: 4,
      questions: [
        { type: 'text', id: 'numeroOPERP', required: false, placeholder: 'Digite o número da OP...', label: 'OP ERP', size: 'middle' },
        { type: 'text', id: 'cliente', required: false, placeholder: 'Digite o nome do cliente...', label: 'Cliente', size: 'middle' },
        { type: 'text', id: 'situacao', required: false, placeholder: 'Digite a situação...', label: 'Situação', size: 'middle' },
        { type: 'date', id: 'dataOP', required: false, placeholder: 'Selecione a data...', label: 'Data', size: 'middle' },
      ],
    },
  ], []);

  // Função debounced para aplicar filtros
  const debouncedReloadTable = useMemo(
    () => debounce(() => {
      if (tableRef.current) {
        tableRef.current.reloadTable();
      }
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
          situacao: statusFilter !== 'todos' ? statusFilter : filters.situacao,
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
          situacao: statusFilter !== 'todos' ? statusFilter : filters.situacao,
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

  const debouncedSearch = useMemo(
    () => debounce(() => {
      if (tableRef.current) tableRef.current.reloadTable();
      if (tableFilhasRef.current) tableFilhasRef.current.reloadTable();
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    debouncedSearch();
  }, [debouncedSearch]);

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
    { title: 'OP ERP', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 120 },
    {
      title: 'Data',
      dataIndex: 'dataOP',
      key: 'dataOP',
      width: 120,
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Recurso',
      key: 'recurso',
      width: 140,
      render: (_, record) => record.ferramenta?.descricao || record.ferramentas?.[0]?.descricao || '-',
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 130,
      render: (situacao) => {
        const colorMap = {
          'Em cadastro': 'default',
          'Liberada': 'processing',
          'Programada': 'warning',
          'Encerrada': 'success',
        };
        return <Badge status={colorMap[situacao] || 'default'} text={situacao} />;
      },
    },
    {
      title: 'Qtd Total (peças)',
      dataIndex: 'itens',
      key: 'quantidadeTotal',
      width: 120,
      align: 'right',
      render: (itens) => {
        if (!itens || !Array.isArray(itens)) return '0';
        const total = itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0);
        return total.toLocaleString('pt-BR');
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
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
        if (!filhas.length) {
          return (
            <div style={{ marginLeft: 24, padding: '16px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
              <Typography.Text type="secondary">Nenhuma OP Filha vinculada.</Typography.Text>
            </div>
          );
        }
        return (
          <div style={{ marginLeft: 24, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
            <Text strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.text.secondary, marginBottom: 8 }}>OPs Filhas</Text>
            <Table
              dataSource={filhas}
              columns={columnsFilhas}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 'max-content' }}
            />
          </div>
        );
      },
    }),
    [filhasMap, loadingFilhas, fetchFilhas, columnsFilhas]
  );

  // Memoizar colunas para evitar re-renders desnecessários (apenas OP Pai na lista)
  const columns = useMemo(() => [
    { 
      title: 'OP ERP', 
      dataIndex: 'numeroOPERP', 
      key: 'numeroOPERP',
      width: 120,
    },
    {
      title: 'Data',
      dataIndex: 'dataOP',
      key: 'dataOP',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: true,
    },
    {
      title: 'Nº Pedido',
      dataIndex: 'numeroPedidoCliente',
      key: 'numeroPedidoCliente',
      width: 120,
      render: (val, record) => val || (record.pedidoId ? `Pedido #${record.pedidoId}` : '-'),
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 250,
    },
    {
      title: 'Entrega',
      key: 'dataEntrega',
      width: 120,
      render: (_, record) => {
        const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
        return dataEntrega ? dayjs(dataEntrega).format('DD/MM/YYYY') : '-';
      },
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 150,
      render: (situacao) => {
        const colorMap = {
          'Em cadastro': 'default',
          'Liberada': 'processing',
          'Programada': 'warning',
          'Encerrada': 'success',
        };
        return <Badge status={colorMap[situacao] || 'default'} text={situacao} />;
      },
    },
    {
      title: 'Qtd Total (peças)',
      dataIndex: 'itens',
      key: 'quantidadeTotal',
      width: 150,
      align: 'right',
      render: (itens) => {
        if (!itens || !Array.isArray(itens)) return '0';
        const total = itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0);
        return total.toLocaleString('pt-BR');
      },
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo) => (
        <Badge 
          status={ativo ? 'success' : 'default'} 
          text={ativo ? 'Ativo' : 'Inativo'} 
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (text, record) => (
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
  ], [handleEdit, handleView, handleCopy, handleAtivarDesativar]);

  // Colunas para a aba OPs Filhas (lista paginada, com Recurso, sem expandível)
  const columnsFilhasList = useMemo(() => [
    { title: 'OP ERP', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 120 },
    { title: 'Data', dataIndex: 'dataOP', key: 'dataOP', width: 120, render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'), sorter: true },
    { title: 'Recurso', key: 'recurso', width: 140, render: (_, r) => r.ferramenta?.descricao || r.ferramentas?.[0]?.descricao || '-' },
    { title: 'Nº Pedido', dataIndex: 'numeroPedidoCliente', key: 'numeroPedidoCliente', width: 120, render: (val, r) => val || (r.pedidoId ? `Pedido #${r.pedidoId}` : '-') },
    { title: 'Cliente', dataIndex: ['cliente', 'nome'], key: 'cliente', width: 250 },
    { title: 'Entrega', key: 'dataEntrega', width: 120, render: (_, r) => { const d = r.dataEntrega ?? r.itens?.[0]?.dataEntrega; return d ? dayjs(d).format('DD/MM/YYYY') : '-'; } },
    { title: 'Situação', dataIndex: 'situacao', key: 'situacao', width: 150, render: (situacao) => { const colorMap = { 'Em cadastro': 'default', 'Liberada': 'processing', 'Programada': 'warning', 'Encerrada': 'success' }; return <Badge status={colorMap[situacao] || 'default'} text={situacao} />; } },
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
              subtitle="Gestão de OPs Pai e Filhas"
              extra={<Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Exportar</Button>}
            >
              {/* Filtros sempre visíveis */}
              <div style={{ margin: '12px 0', padding: '12px', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                <DynamicForm
                  formConfig={filterFormConfig}
                  formInstance={filterForm}
                  submitText="Filtrar"
                  submitIcon={<AiOutlineSearch />}
                  submitOnSide={true}
                  onClose={null}
                  onSubmit={handleFilter}
                  secondaryButton={
                    <Button icon={<AiOutlineClear />} onClick={() => { filterForm.resetFields(); debouncedReloadTable(); if (tableFilhasRef.current) tableFilhasRef.current.reloadTable(); }} size="middle">Limpar</Button>
                  }
                />
              </div>

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
      </Content>
    </Layout>
  );
};

export default memo(List);
