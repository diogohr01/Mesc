import { Badge, Button, Col, Form, Layout, message, Modal, Row, Space } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineClear, AiOutlinePlus } from 'react-icons/ai';
import { Card, FilterModalForm, LoadingSpinner, PaginatedTable, ActionButtons } from '../../../components';
import { useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import FerramentasService from '../../../services/ferramentasService';

const { confirm } = Modal;
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
        if (tableRef.current) tableRef.current.reloadTable();
      }, 300),
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
        const requestData = { page, pageSize, sorterField, sortOrder, ...filters, search: searchTerm?.trim() || undefined };
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
    [filterForm, searchTerm]
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
              title="Ferramentas"
              extra={
                <Space>
                  <Button type="primary" icon={<AiOutlinePlus />} onClick={onAdd} size="middle">Nova Ferramenta</Button>
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
