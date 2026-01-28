import { Button, Col, Form, Layout, message, Modal, Row, Space, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiFillDelete, AiFillEdit, AiOutlineClear, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import { Card, DynamicForm, LoadingSpinner, PaginatedTable } from '../../../components';
import Api from '../../../services/api';
import { colors } from '../../../styles/colors';

const { confirm } = Modal;
const { Content } = Layout;
const { Text } = Typography;

const List = ({ onAdd, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm(); // Formulário para filtros
  const filterFormConfig = useMemo(() => [
    {
      columns: 4, // Changed back to 4 for better spacing
      questions: [
        {
          type: "text",
          id: "text",
          required: false,
          placeholder: "Texto...",
          label: "Texto",
          size: "middle" // Changed to middle for better visibility
        },
        {
          type: "integer",
          id: "integer",
          required: false,
          placeholder: "Número...",
          label: "Número",
          size: "middle" // Changed to middle for better visibility
        },
        {
          type: "decimal",
          id: "decimal",
          required: false,
          placeholder: "Decimal...",
          label: "Decimal",
          size: "middle" // Changed to middle for better visibility
        },
        {
          type: "date",
          id: "date",
          required: false,
          placeholder: "Data...",
          label: "Data",
          size: "middle" // Added back date filter
        },
      ],
    },
  ], []);

  const tableRef = useRef(null);

  // Função debounced para aplicar filtros
  const debouncedReloadTable = useMemo(
    () => debounce(() => {
      if (tableRef.current) {
        tableRef.current.reloadTable();
      }
    }, 300),
    []
  );

  // Atualiza o fetchData para incluir os filtros
  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const response = await Api.post('/crud/getAll', {
          page,
          pageSize,
          sorterField,
          sortOrder,
          ...filters, // Inclui os filtros no request
        });

        return {
          data: response.data.data.data,
          total: response.data.data.pagination.totalRecords
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        console.error('Erro ao buscar dados:', error);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm]
  );

  const handleEdit = useCallback((record) => {
    onEdit(record);
  }, [onEdit]);


  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir este registro?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        setLoading(true);
        try {
          await Api.delete(`/crud/${record.id}`);
          message.success('Registro excluído com sucesso!');
          if (tableRef.current) {
            tableRef.current.reloadTable();
          }
        } catch (error) {
          message.error('Erro ao excluir registro.');
          console.error('Erro ao excluir registro:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  }, []);

  // Função para aplicar os filtros e recarregar a tabela
  const handleFilter = useCallback((values) => {
    // Os filtros já estão no formulário, apenas recarrega a tabela
    debouncedReloadTable();
  }, [debouncedReloadTable]);

  // Memoizar colunas para evitar re-renders desnecessários
  const columns = useMemo(() => [
    { title: 'Texto', dataIndex: 'text', key: 'text' },
    { title: 'Número', dataIndex: 'integer', key: 'integer' },
    { title: 'Decimal', dataIndex: 'decimal', key: 'decimal' },
    {
      title: 'Data',
      dataIndex: 'created',
      key: 'created',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (text, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<AiFillEdit style={{ fontSize: '14px' }} />}
              size="small"
              onClick={() => handleEdit(record)}
              disabled={loading}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Button
              type="text"
              danger
              icon={<AiFillDelete style={{ fontSize: '14px' }} />}
              size="small"
              onClick={() => handleDelete(record)}
              disabled={loading}
              style={{ padding: '4px 8px' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [handleEdit, handleDelete, loading]);

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
              styles={{
                header: {
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Lista de Registros
                </h2>
                <Button
                  type="primary"
                  icon={<AiOutlinePlus />}
                  onClick={onAdd}
                  disabled={loading}
                  size="middle"
                >
                  Adicionar Registro
                </Button>
              </div>

                {/* Filtros sempre visíveis */}
                <div style={{
                  margin: '12px 0',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px'
                }}>
                  <DynamicForm
                    formConfig={filterFormConfig}
                    formInstance={filterForm}
                    submitText="Filtrar"
                    submitIcon={<AiOutlineSearch />}
                    submitOnSide={true}
                    onClose={null}
                    onSubmit={handleFilter}
                    secondaryButton={
                      <Button
                        icon={<AiOutlineClear />}
                        onClick={() => {
                          filterForm.resetFields();
                          debouncedReloadTable();
                        }}
                        size="middle"
                      >
                        Limpar
                      </Button>
                    }
                  />
                </div>

              <div style={{ padding: '16px 0' }}>
                <PaginatedTable
                  ref={tableRef}
                  disabled={loading}
                  fetchData={fetchData}
                  initialPageSize={10}
                  columns={columns}
                  loadingIcon={<LoadingSpinner />}
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
