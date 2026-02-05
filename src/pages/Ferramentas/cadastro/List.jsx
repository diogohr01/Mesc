import { Button, Col, Form, Input, Layout, message, Modal, Row, Space } from 'antd';
import { Badge } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import { Card, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import FerramentasService from '../../../services/ferramentasService';

const { confirm } = Modal;
const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);

  const debouncedReloadTable = useMemo(
    () =>
      debounce(() => {
        if (tableRef.current) tableRef.current.reloadTable();
      }, 300),
    []
  );

  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const requestData = { page, pageSize, sorterField, sortOrder, ...filters };
        const response = await FerramentasService.getAll(requestData);
        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0,
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        console.error('Erro:', error);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm]
  );

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir esta Ferramenta?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        setLoading(true);
        try {
          await FerramentasService.delete(record.id);
          message.success('Ferramenta excluída com sucesso!');
          if (tableRef.current) tableRef.current.reloadTable();
        } catch (error) {
          message.error('Erro ao excluir Ferramenta.');
          console.error('Erro:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 160, sorter: true },
      { title: 'Perfil', dataIndex: 'cod_perfil', key: 'cod_perfil', width: 120 },
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', width: 220 },
      { title: 'Cav.', dataIndex: 'num_cavidades', key: 'num_cavidades', width: 70, align: 'right' },
      {
        title: 'Nitretação',
        key: 'nitr',
        width: 120,
        align: 'right',
        render: (_, r) => `${r.nitr_atual ?? 0} / ${r.nitr_limite ?? 0}`,
      },
      {
        title: 'Acomp.',
        dataIndex: 'acompanhamento',
        key: 'acompanhamento',
        width: 90,
        render: (v) => (v ? <Badge status="warning" text="Sim" /> : <Badge status="default" text="Não" />),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 140,
        fixed: 'right',
        render: (text, record) => (
          <ActionButtons
            onView={() => onView(record)}
            onEdit={() => onEdit(record)}
            onDelete={() => handleDelete(record)}
            showCopy={false}
            showActivate={false}
            showDeactivate={false}
            size="small"
          />
        ),
      },
    ],
    [onView, onEdit, handleDelete]
  );

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
                  justifyContent: 'space-between',
                  alignItems: 'center',
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Ferramentas
                </h2>
                <Button type="primary" icon={<AiOutlinePlus />} onClick={onAdd} size="middle">
                  Nova Ferramenta
                </Button>
              </div>

              <div
                style={{
                  margin: '12px 0',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                }}
              >
                <Form form={filterForm} layout="vertical" onFinish={() => debouncedReloadTable()} style={{ marginBottom: 0 }}>
                  <Row gutter={[12, 6]} align="bottom">
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="codigo" label="Código" style={{ marginBottom: '4px' }}>
                        <Input placeholder="Código..." size="middle" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="descricao" label="Descrição" style={{ marginBottom: '4px' }}>
                        <Input placeholder="Descrição..." size="middle" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item label=" " style={{ marginBottom: '4px' }}>
                        <Space size="small">
                          <Button type="primary" htmlType="submit" size="middle" icon={<AiOutlineSearch />} loading={loading}>
                            Filtrar
                          </Button>
                          <Button
                            size="middle"
                            icon={<AiOutlineClear />}
                            onClick={() => {
                              filterForm.resetFields();
                              debouncedReloadTable();
                            }}
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
