import { Button, Col, Form, Layout, message, Modal, Row } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import { Card, DynamicForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import SequenciamentoService from '../../../services/sequenciamentoService';

const { confirm } = Modal;
const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () => debounce(() => {
      if (tableRef.current) tableRef.current.reloadTable();
    }, 300),
    []
  );

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 2,
        questions: [
          { type: 'text', id: 'nome', required: false, placeholder: 'Nome...', label: 'Nome', size: 'middle' },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  const handleFilter = useCallback(() => {
    debouncedReloadTable();
  }, [debouncedReloadTable]);

  const fetchData = useCallback(
    async (page, pageSize, sorterField, sortOrder) => {
      setLoading(true);
      try {
        const filters = filterForm.getFieldsValue();
        const response = await SequenciamentoService.getAll({
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
      content: 'Tem certeza de que deseja excluir este Cenário?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        try {
          await SequenciamentoService.delete(record.id);
          message.success('Cenário excluído com sucesso!');
          if (tableRef.current) tableRef.current.reloadTable();
        } catch (error) {
          message.error('Erro ao excluir cenário.');
        }
      },
    });
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Nome', dataIndex: 'nome', key: 'nome', width: 220, sorter: true },
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', ellipsis: true },
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
              title="Cenários"
              extra={
                <Button type="primary" icon={<AiOutlinePlus />} onClick={onAdd} size="middle">
                  Novo Cenário
                </Button>
              }
            >
              <div
                style={{
                  margin: '12px 0',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                }}
              >
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
                        clearSearch();
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
