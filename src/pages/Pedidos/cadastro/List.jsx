import { Badge, Button, Col, Form, Layout, message, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiFillDelete, AiFillEdit, AiOutlineClear, AiOutlinePlus } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import PedidosService from '../../../services/pedidosService';

const { Content } = Layout;

const List = ({ onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () => debounce(() => { if (tableRef.current) tableRef.current.reloadTable(); }, 300),
    []
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  const filterFormConfig = useMemo(() => [
    {
      columns: 4,
      questions: [
        { type: 'text', id: 'codigo', required: false, placeholder: 'Digite o código...', label: 'Código', size: 'middle' },
        { type: 'text', id: 'pedidoNumero', required: false, placeholder: 'Digite o número...', label: 'Pedido nº (Totvs)', size: 'middle' },
        { type: 'text', id: 'cliente', required: false, placeholder: 'Digite o cliente...', label: 'Cliente', size: 'middle' },
        { type: 'text', id: 'situacao', required: false, placeholder: 'Digite a situação...', label: 'Situação', size: 'middle' },
        { type: 'range-date', id: 'dataRange', required: false, placeholder: ['Data início', 'Data fim'], label: 'Período', format: 'DD/MM/YYYY' },
      ],
    },
  ], []);

  // Atualiza o fetchData para incluir os filtros
  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        
        // Processar range de datas se existir
        let dataInicio = null;
        let dataFim = null;
        if (filters.dataRange && filters.dataRange.length === 2) {
          dataInicio = filters.dataRange[0] ? dayjs(filters.dataRange[0]).format('YYYY-MM-DD') : null;
          dataFim = filters.dataRange[1] ? dayjs(filters.dataRange[1]).format('YYYY-MM-DD') : null;
        }

        const requestData = {
          page,
          pageSize,
          sorterField,
          sortOrder,
          codigo: filters.codigo,
          pedidoNumero: filters.pedidoNumero,
          cliente: filters.cliente,
          situacao: filters.situacao,
          dataInicio,
          dataFim,
          search: searchTerm?.trim() || undefined,
        };

        const response = await PedidosService.getAll(requestData);

        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        console.error('Erro ao buscar dados:', error);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm, searchTerm]
  );

  const handleEdit = useCallback((record) => {
    onEdit(record);
  }, [onEdit]);

  const handleView = useCallback((record) => {
    onView(record);
  }, [onView]);

  // Pedidos não podem ser excluídos (regra de negócio - vêm da integração TOTVS)
  const handleDelete = undefined;

  const handleCopy = useCallback(async (record) => {
    try {
      setLoading(true);
      const response = await PedidosService.copiar(record.id);
      if (response.success) {
        message.success('Pedido copiado com sucesso!');
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }
    } catch (error) {
      message.error('Erro ao copiar Pedido.');
      console.error('Erro ao copiar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAtivarDesativar = useCallback(async (record) => {
    try {
      setLoading(true);
      const novoStatus = !record.ativo;
      const response = await PedidosService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        message.success(novoStatus ? 'Pedido ativado com sucesso!' : 'Pedido desativado com sucesso!');
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }
    } catch (error) {
      message.error('Erro ao alterar status do Pedido.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para aplicar os filtros e recarregar a tabela
  const handleFilter = useCallback((values) => {
    debouncedReloadTable();
  }, [debouncedReloadTable]);

  // Memoizar colunas para evitar re-renders desnecessários
  const columns = useMemo(() => [
    { 
      title: 'Código', 
      dataIndex: 'codigo', 
      key: 'codigo',
      width: 100,
      sorter: true,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      sorter: true,
      render: (data) => data ? dayjs(data).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Pedido nº (Totvs)',
      dataIndex: 'pedidoNumero',
      key: 'pedidoNumero',
      width: 150,
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 300,
      render: (text, record) => record.cliente?.nome || '-',
    },
    {
      title: 'Situação',
      dataIndex: 'situacao',
      key: 'situacao',
      width: 150,
      render: (situacao) => {
        const statusMap = {
          'NÃO INICIADA': { color: 'default', text: 'Não Iniciada' },
          'EM ANDAMENTO': { color: 'processing', text: 'Em Andamento' },
          'FINALIZADA': { color: 'success', text: 'Finalizada' },
        };
        const status = statusMap[situacao] || { color: 'default', text: situacao };
        return <Badge status={status.color} text={status.text} />;
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
          onDelete={handleDelete}
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
              title="Pedidos"
              extra={
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
              }
            >
              <div style={{ padding: '16px 0' }}>
                <PaginatedTable
                  ref={tableRef}
                  disabled={loading}
                  fetchData={fetchData}
                  initialPageSize={10}
                  columns={columns}
                  loadingIcon={<LoadingSpinner />}
                  rowKey="id"
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default memo(List);
