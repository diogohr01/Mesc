import { Button, Col, Form, Layout, message, Modal, Row } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import { Card, DynamicForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import PerfisService from '../../../services/perfisService';

const { confirm } = Modal;
const { Content } = Layout;

const List = ({ onAdd, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const tableRef = useRef(null);
  const { searchTerm, clearSearch } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () =>
      debounce(() => {
        if (tableRef.current) tableRef.current.reloadTable();
      }, 300),
    []
  );

  const filterFormConfig = useMemo(
    () => [
      {
        columns: 4,
        questions: [
          { type: 'text', id: 'cod_perfil', required: false, placeholder: 'Código...', label: 'Código', size: 'middle' },
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
        const requestData = { page, pageSize, sorterField, sortOrder, ...filters, search: searchTerm?.trim() || undefined };
        const response = await PerfisService.getAll(requestData);
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
    [filterForm, searchTerm]
  );

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir este Perfil?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        setLoading(true);
        try {
          await PerfisService.delete(record.id);
          message.success('Perfil excluído com sucesso!');
          if (tableRef.current) tableRef.current.reloadTable();
        } catch (error) {
          message.error('Erro ao excluir Perfil.');
          console.error('Erro:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'cod_perfil', key: 'cod_perfil', width: 140, sorter: true },
      { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', width: 280, sorter: true },
      {
        title: 'Gramatura',
        dataIndex: 'gramatura',
        key: 'gramatura',
        width: 110,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
      },
      {
        title: 'Peso nom. (kg/m)',
        dataIndex: 'peso_nominal',
        key: 'peso_nominal',
        width: 130,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'),
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
              title="Perfis de Extrusão"
              extra={<Button type="primary" icon={<AiOutlinePlus />} onClick={onAdd} size="middle">Novo Perfil</Button>}
            >
              <div
                style={{
                  margin: '12px 0',
                  backgroundColor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: '6px',
                }}
              >
                <DynamicForm
                  formConfig={filterFormConfig}
                  formInstance={filterForm}
                  collapseAsFilter
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
