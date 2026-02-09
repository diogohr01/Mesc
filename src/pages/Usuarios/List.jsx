import { Button, Col, Form, Input, Layout, message, Row, Space, Tag } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlineSearch } from 'react-icons/ai';
import { Card, LoadingSpinner, PaginatedTable, ActionButtons } from '../../components';
import UsuariosService from '../../services/usuariosService';

const { Content } = Layout;

const List = ({ onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);

  const debouncedReloadTable = useMemo(
    () => debounce(() => { if (tableRef.current) tableRef.current.reloadTable(); }, 300),
    []
  );

  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const response = await UsuariosService.getAll({ page, pageSize, sorterField, sortOrder, ...filters });
        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0,
        };
      } catch (error) {
        message.error('Erro ao buscar usuários.');
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm]
  );

  const columns = useMemo(
    () => [
      { title: 'Nome', dataIndex: 'nome', key: 'nome', width: 180 },
      { title: 'E-mail', dataIndex: 'email', key: 'email', width: 220 },
      { title: 'Perfil', dataIndex: 'perfil', key: 'perfil', width: 140 },
      {
        title: 'Módulos',
        dataIndex: 'modulos',
        key: 'modulos',
        render: (modulos) =>
          Array.isArray(modulos) ? (
            <Space size={[0, 4]} wrap>
              {modulos.map((m) => (
                <Tag key={m}>{m}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          ),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record) => (
          <ActionButtons
            onView={() => onView(record)}
            showEdit={false}
            showDelete={false}
            showCopy={false}
            showActivate={false}
            showDeactivate={false}
            size="small"
          />
        ),
      },
    ],
    [onView]
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card variant="borderless" title="Gestão de Usuários">
              <div style={{ margin: '12px 0', padding: '12px', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                <Form form={filterForm} layout="vertical" onFinish={() => debouncedReloadTable()} style={{ marginBottom: 0 }}>
                  <Row gutter={[12, 6]} align="bottom">
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="nome" label="Nome" style={{ marginBottom: '4px' }}>
                        <Input placeholder="Nome..." size="middle" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="email" label="E-mail" style={{ marginBottom: '4px' }}>
                        <Input placeholder="E-mail..." size="middle" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item name="perfil" label="Perfil" style={{ marginBottom: '4px' }}>
                        <Input placeholder="Perfil..." size="middle" allowClear />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6} lg={4}>
                      <Form.Item label=" " style={{ marginBottom: '4px' }}>
                        <Space size="small">
                          <Button type="primary" htmlType="submit" size="middle" icon={<AiOutlineSearch />} loading={loading}>Filtrar</Button>
                          <Button size="middle" icon={<AiOutlineClear />} onClick={() => { filterForm.resetFields(); debouncedReloadTable(); }}>Limpar</Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
              <PaginatedTable
                ref={tableRef}
                columns={columns}
                fetchData={fetchData}
                loading={loading}
                rowKey="id"
                pageSize={10}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default List;
