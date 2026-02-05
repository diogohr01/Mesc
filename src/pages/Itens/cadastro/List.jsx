import { Badge, Button, Col, Form, Input, Layout, message, Row, Space } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import { Card, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import ItensService from '../../../services/itensService';

const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);

  const debouncedReloadTable = useMemo(
    () =>
      debounce(() => {
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }, 300),
    []
  );

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
        };
        const response = await ItensService.getAll(requestData);
        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0,
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

  const handleView = useCallback((record) => onView(record), [onView]);
  const handleEdit = useCallback((record) => onEdit(record), [onEdit]);

  const handleFilter = useCallback(() => {
    debouncedReloadTable();
  }, [debouncedReloadTable]);

  const columns = useMemo(
    () => [
      {
        title: 'Código',
        dataIndex: 'codigo',
        key: 'codigo',
        width: 120,
        sorter: true,
      },
      {
        title: 'Descrição',
        dataIndex: 'descricao',
        key: 'descricao',
        width: 300,
        sorter: true,
      },
      {
        title: 'Unidade',
        dataIndex: 'unidade',
        key: 'unidade',
        width: 80,
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
        width: 140,
        fixed: 'right',
        render: (text, record) => (
          <ActionButtons
            onView={() => handleView(record)}
            onEdit={() => handleEdit(record)}
            showDelete={false}
            showCopy={false}
            showActivate={false}
            showDeactivate={false}
            size="small"
          />
        ),
      },
    ],
    [handleView, handleEdit]
  );

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
                  alignItems: 'center',
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Itens
                </h2>
                
              </div>

              {/* Filtros sempre visíveis - padrão das outras telas */}
              <div
                style={{
                  margin: '12px 0',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                }}
              >
                <Form
                  form={filterForm}
                  layout="vertical"
                  onFinish={handleFilter}
                  style={{ marginBottom: 0 }}
                >
                  <Row gutter={[12, 6]} align="bottom">
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="codigo" label="Código" style={{ marginBottom: '4px' }}>
                        <Input
                          placeholder="Digite o código..."
                          size="middle"
                          allowClear
                          prefix={<AiOutlineSearch style={{ color: '#bfbfbf' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="descricao" label="Descrição" style={{ marginBottom: '4px' }}>
                        <Input
                          placeholder="Digite a descrição..."
                          size="middle"
                          allowClear
                          prefix={<AiOutlineSearch style={{ color: '#bfbfbf' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item label=" " style={{ marginBottom: '4px' }}>
                        <Space size="small" style={{ width: '100%' }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            size="middle"
                            icon={<AiOutlineSearch />}
                            loading={loading}
                            style={{ minWidth: '80px', flex: 1 }}
                          >
                            Filtrar
                          </Button>
                          <Button
                            size="middle"
                            icon={<AiOutlineClear />}
                            onClick={() => {
                              filterForm.resetFields();
                              debouncedReloadTable();
                            }}
                            style={{ minWidth: '80px', flex: 1 }}
                          >
                            Limpar
                          </Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>

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

export default List;
