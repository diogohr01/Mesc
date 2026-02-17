import { Badge, Button, Col, Form, Layout, message, Modal, Row, Tooltip, Typography } from 'antd';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiFillDelete, AiFillEdit, AiOutlineClear, AiOutlinePlus } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import ClientesService from '../../../services/clientesService';

const { confirm } = Modal;
const { Content } = Layout;
const { Text } = Typography;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  // Função debounced para aplicar filtros
  const debouncedReloadTable = useMemo(
    () => debounce(() => {
      if (tableRef.current) {
        tableRef.current.reloadTable();
      }
    }, 300),
    []
  );

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 3,
        questions: [
          { type: 'text', id: 'nome', required: false, placeholder: 'Digite o nome...', label: 'Nome', size: 'middle' },
          { type: 'text', id: 'codigoEMS', required: false, placeholder: 'Digite o código...', label: 'Código', size: 'middle' },
          { type: 'text', id: 'tipoServico', required: false, placeholder: 'Digite o tipo...', label: 'Tipo de Serviço', size: 'middle' },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  // Atualiza o fetchData para incluir os filtros
  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const requestData = {
          page,
          pageSize,
          sorterField,
          sortOrder,
          ...filters,
          search: searchTerm?.trim() || undefined,
        };

        const response = await ClientesService.getAll(requestData);

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

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir este Cliente/Fornecedor?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        setLoading(true);
        try {
          await ClientesService.delete(record.id);
          message.success('Cliente/Fornecedor excluído com sucesso!');
          if (tableRef.current) {
            tableRef.current.reloadTable();
          }
        } catch (error) {
          message.error('Erro ao excluir Cliente/Fornecedor.');
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
      const response = await ClientesService.copiar(record.id);
      if (response.success) {
        message.success('Cliente/Fornecedor copiado com sucesso!');
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }
    } catch (error) {
      message.error('Erro ao copiar Cliente/Fornecedor.');
      console.error('Erro ao copiar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAtivarDesativar = useCallback(async (record) => {
    try {
      setLoading(true);
      const novoStatus = !record.ativo;
      const response = await ClientesService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        message.success(novoStatus ? 'Cliente ativado com sucesso!' : 'Cliente desativado com sucesso!');
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }
    } catch (error) {
      message.error('Erro ao alterar status do Cliente.');
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
  // Mostrar apenas dados essenciais na tabela - detalhes completos no View
  const columns = useMemo(() => [
    { 
      title: 'Código', 
      dataIndex: 'codigoEMS', 
      key: 'codigoEMS',
      width: 100,
      sorter: true,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      width: 300,
      sorter: true,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoServico',
      key: 'tipoServico',
      width: 150,
    },
    {
      title: 'Contato',
      dataIndex: 'nomeContato',
      key: 'nomeContato',
      width: 150,
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
          showCopy={false}
          showActivate={false}
          showDeactivate={false}
          isActive={record.ativo}
          size="small"
        />
      ),
    },
  ], [handleEdit, handleView, handleDelete, handleCopy, handleAtivarDesativar]);

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
              title="Clientes / Fornecedores"
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
