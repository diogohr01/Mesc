import { Button, Col, Form, Layout, message, Row, Space, Tag } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import UsuariosService from '../../services/usuariosService';

const { Content } = Layout;

const List = ({ onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () => debounce(() => { if (tableRef.current) tableRef.current.reloadTable(); }, 300),
    []
  );

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 4,
        questions: [
          { type: 'text', id: 'nome', required: false, placeholder: 'Nome...', label: 'Nome', size: 'middle' },
          { type: 'text', id: 'email', required: false, placeholder: 'E-mail...', label: 'E-mail', size: 'middle' },
          { type: 'text', id: 'perfil', required: false, placeholder: 'Perfil...', label: 'Perfil', size: 'middle' },
        ],
      },
    ],
    []
  );

  const handleFilter = useCallback(() => {
    debouncedReloadTable();
  }, [debouncedReloadTable]);

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const response = await UsuariosService.getAll({ page, pageSize, sorterField, sortOrder, ...filters, search: searchTerm?.trim() || undefined });
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
    [filterForm, searchTerm]
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
            <Card
              variant="borderless"
              title="Gestão de Usuários"
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

export default List;
