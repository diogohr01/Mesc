import { Badge, Button, Col, Form, Layout, message, Modal, Row, Space, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
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
import CriarOPMESCModal from '../components/CriarOPMESCModal';
import OrdemProducaoTotvsList from '../components/OrdemProducaoTotvsList';

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

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const tableFilhasRef = useRef(null);
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

  // Lista mostra OPs Totvs; OPs MESC ao expandir a linha
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

  // Colunas para a aba OPs MESC (lista paginada, com Recurso, sem expandível)
  const columnsFilhasList = useMemo(() => [
    { title: 'OP ERP', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 120 },
    { title: 'Data', dataIndex: 'dataOP', key: 'dataOP', width: 120, render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'), sorter: true },
    { title: 'Recurso', key: 'recurso', width: 140, render: (_, r) => r.ferramenta?.descricao || r.ferramentas?.[0]?.descricao || '-' },
    { title: 'Nº Pedido', dataIndex: 'numeroPedidoCliente', key: 'numeroPedidoCliente', width: 120, render: (val, r) => val || (r.pedidoId ? `Pedido #${r.pedidoId}` : '-') },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 250,
      render: (_, record) => {
        const text = record?.cliente?.nome ?? '-';
        const str = String(text);
        const display = str.length > 15 ? `${str.slice(0, 15)}...` : str;
        return (
          <Tooltip title={str}>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 250 }}>{display}</span>
          </Tooltip>
        );
      },
    },
    { title: 'Entrega', key: 'dataEntrega', width: 120, render: (_, r) => { const d = r.dataEntrega ?? r.itens?.[0]?.dataEntrega; return d ? dayjs(d).format('DD/MM/YYYY') : '-'; } },
    { title: 'Situação', dataIndex: 'situacao', key: 'situacao', width: 150, render: (situacao) => { const colorMap = { 'Em cadastro': 'default', 'Liberada': 'processing', 'Programada': 'warning', 'Encerrada': 'success', 'Cancelada': 'error' }; return <Badge status={colorMap[situacao] || 'default'} text={situacao} />; } },
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
              subtitle="Gestão de OPs Totvs e OPs MESC"
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
                  label: 'OPs Totvs',
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <OrdemProducaoTotvsList
                        ref={tableRef}
                        fetchData={fetchData}
                        onCriarOPMESC={(record) => {
                          setModalCriarOPPai(record);
                          setModalCriarOPOpen(true);
                        }}
                        onViewFilha={handleView}
                        onEditFilha={handleEdit}
                        onCopyFilha={handleCopy}
                        onDeleteFilha={handleDelete}
                        onAtivarDesativarFilha={handleAtivarDesativar}
                      />
                    </div>
                  ),
                },
                {
                  key: 'filhas',
                  label: 'OPs MESC',
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
            tableRef.current?.reloadExpandido?.(modalCriarOPPai?.id);
            setModalCriarOPOpen(false);
            setModalCriarOPPai(null);
          }}
        />
      </Content>
    </Layout>
  );
};

export default memo(List);
