import { Badge, Button, Col, Form, Layout, message, Row } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import ItensService from '../../../services/itensService';

const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [modalFiltrosOpen, setModalFiltrosOpen] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () =>
      debounce(() => {
        if (tableRef.current) {
          tableRef.current.reloadTable();
        }
      }, 300),
    []
  );

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 4,
        questions: [
          { type: 'text', id: 'codigo', required: false, placeholder: 'Digite o código...', label: 'Código', size: 'middle' },
          { type: 'text', id: 'descricao', required: false, placeholder: 'Digite a descrição...', label: 'Descrição', size: 'middle' },
        ],
      },
    ],
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
          search: searchTerm?.trim() || undefined,
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
    [filterForm, searchTerm]
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

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
              title="Itens"
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
