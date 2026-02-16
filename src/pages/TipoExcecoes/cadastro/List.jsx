import { Badge, Button, Col, Form, Layout, message, Modal, Row, Space } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import TipoExcecoesService from '../../../services/tipoExcecoesService';

const { confirm } = Modal;
const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
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
          { type: 'text', id: 'codigo', required: false, placeholder: 'Código...', label: 'Código', size: 'middle' },
          { type: 'text', id: 'descricao', required: false, placeholder: 'Descrição...', label: 'Descrição', size: 'middle' },
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
        const response = await TipoExcecoesService.getAll({
          page,
          pageSize,
          sorterField,
          sortOrder,
          ...filters,
          search: searchTerm?.trim() || undefined,
        });
        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0,
        };
      } catch (error) {
        message.error('Erro ao buscar dados.');
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [filterForm, searchTerm]
  );

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir este Tipo de Exceção?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        try {
          await TipoExcecoesService.delete(record.id);
          message.success('Tipo de exceção excluído com sucesso!');
          if (tableRef.current) tableRef.current.reloadTable();
        } catch (error) {
          message.error('Erro ao excluir tipo de exceção.');
        }
      },
    });
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 140 },
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', width: 300 },
      {
        title: 'Ações',
        key: 'actions',
        width: 140,
        fixed: 'right',
        render: (_, record) => (
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

  useEffect(() => {
    return () => debouncedReloadTable.cancel?.();
  }, [debouncedReloadTable]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Tipo de Exceções"
              extra={
                <Space>
                  <Button type="primary" icon={<AiOutlinePlus />} onClick={onAdd} size="middle">Novo Tipo</Button>
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
