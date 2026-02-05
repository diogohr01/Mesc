import { Badge, Button, Col, Form, Layout, message, Row, Space, Typography } from 'antd';
import { Card, DynamicForm, LoadingSpinner, PaginatedTable } from '../../../components';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineBranches, AiOutlineClear, AiOutlineEdit, AiOutlineSearch, AiOutlineUp } from 'react-icons/ai';
import dayjs from 'dayjs';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import OPDetalhesModal from '../components/OPDetalhesModal';

const { Content } = Layout;
const { Text } = Typography;

const OrdemProducaoConsulta = () => {
  const [loading, setLoading] = useState(false);
  const [filterForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrdemId, setSelectedOrdemId] = useState(null);
  const tableRef = useRef(null);

  const [filterFormConfig] = useState([
    {
      columns: 3,
      questions: [
        {
          type: "text",
          id: "numeroOPERP",
          required: false,
          placeholder: "Número OP ERP",
          label: "Número OP ERP",
        },
        {
          type: "text",
          id: "numeroOPMESC",
          required: false,
          placeholder: "Número OP MESC",
          label: "Número OP MESC",
        },
        {
          type: "select",
          id: "cliente",
          required: false,
          placeholder: "Selecione o cliente",
          label: "Cliente",
          showSearch: true,
          options: [
            { label: "METALURGICA MOR", value: "METALURGICA MOR" },
            { label: "SEQUENCIAL MILIMÉTRICA", value: "SEQUENCIAL MILIMÉTRICA" },
          ]
        },
        {
          type: "select",
          id: "item",
          required: false,
          placeholder: "Selecione o item",
          label: "Item",
          showSearch: true,
          options: [
            { label: "707395 - TUBO RETANG ALUM", value: "707395" },
            { label: "90100002 - MTR-027 6063 T6F", value: "90100002" },
          ]
        },
        {
          type: "multiselect",
          id: "status",
          required: false,
          placeholder: "Selecione os status",
          label: "Status",
          options: [
            { label: "Em cadastro", value: "Em cadastro" },
            { label: "Liberada", value: "Liberada" },
            { label: "Programada", value: "Programada" },
            { label: "Em produção", value: "Em produção" },
            { label: "Finalizada", value: "Finalizada" },
          ]
        },
        {
          type: "range-date",
          id: "dataEntrega",
          required: false,
          placeholder: ["Data inicial", "Data final"],
          label: "Data de entrega (intervalo)",
          format: "DD/MM/YYYY"
        },
        {
          type: "select",
          id: "prioridade",
          required: false,
          placeholder: "Selecione a prioridade",
          label: "Prioridade",
          options: [
            { label: "Alta", value: "Alta" },
            { label: "Média", value: "Média" },
            { label: "Baixa", value: "Baixa" },
          ]
        },
        {
          type: "select",
          id: "ferramenta",
          required: false,
          placeholder: "Selecione a ferramenta",
          label: "Ferramenta",
          showSearch: true,
          options: [
            { label: "MTU-009-F53", value: "MTU-009-F53" },
            { label: "MTU-009-F64", value: "MTU-009-F64" },
          ]
        },
        {
          type: "select",
          id: "prensa",
          required: false,
          placeholder: "Selecione a prensa",
          label: "Prensa",
          options: [
            { label: "Prensa 1", value: "Prensa 1" },
            { label: "Prensa 2", value: "Prensa 2" },
          ]
        },
        {
          type: "select",
          id: "semanaProducao",
          required: false,
          placeholder: "Selecione a semana",
          label: "Semana de produção",
          options: [
            { label: "Semana 1", value: "Semana 1" },
            { label: "Semana 2", value: "Semana 2" },
            { label: "Semana 3", value: "Semana 3" },
            { label: "Semana 4", value: "Semana 4" },
          ]
        },
      ],
    },
  ]);

  // Função para buscar dados
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

        const response = await OrdemProducaoService.getAll(requestData);

        return {
          data: response.data.data || [],
          total: response.data.pagination?.totalRecords || 0
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

  const handleFilter = useCallback(() => {
    if (tableRef.current) {
      tableRef.current.reloadTable();
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    filterForm.resetFields();
    if (tableRef.current) {
      tableRef.current.reloadTable();
    }
  }, [filterForm]);

  const handleViewDetails = useCallback((record) => {
    setSelectedOrdemId(record.id);
    setModalVisible(true);
  }, []);

  const handleReprogramar = useCallback((record) => {
    message.info('Funcionalidade de reprogramação em desenvolvimento.');
  }, []);

  const handleAlterarPrioridade = useCallback((record) => {
    message.info('Funcionalidade de alterar prioridade em desenvolvimento.');
  }, []);

  const handleAcessarOPsFilhas = useCallback((record) => {
    if (record.opsMESC && record.opsMESC.length > 0) {
      setSelectedOrdemId(record.id);
      setModalVisible(true);
    } else {
      message.info('Esta OP não possui OPs filhas do MESC.');
    }
  }, []);

  // Verificar se OP está atrasada
  const isAtrasada = (dataEntrega) => {
    if (!dataEntrega) return false;
    const hoje = dayjs();
    const entrega = dayjs(dataEntrega);
    return entrega.isBefore(hoje, 'day');
  };

  // Calcular percentual de produção
  const calcularPercentual = (planejada, produzida) => {
    if (!planejada || planejada === 0) return 0;
    return Math.round((produzida / planejada) * 100);
  };

  // Memoizar colunas
  const columns = useMemo(() => [
    {
      title: 'OP ERP',
      dataIndex: 'numeroOPERP',
      key: 'numeroOPERP',
      width: 120,
      sorter: true,
    },
    {
      title: 'OP MESC',
      dataIndex: 'opsMESC',
      key: 'numeroOPMESC',
      width: 120,
      render: (opsMESC) => {
        if (!opsMESC || opsMESC.length === 0) return '-';
        return opsMESC.map(op => op.numeroOPMESC).join(', ');
      },
    },
    {
      title: 'Cliente',
      dataIndex: ['cliente', 'nome'],
      key: 'cliente',
      width: 200,
    },
    {
      title: 'Item',
      dataIndex: 'itens',
      key: 'item',
      width: 200,
      render: (itens) => {
        if (!itens || itens.length === 0) return '-';
        const primeiroItem = itens[0];
        return `${primeiroItem.codigoItem} - ${primeiroItem.descricaoItem?.substring(0, 30)}...`;
      },
    },
    {
      title: 'Qtd Planejada',
      dataIndex: 'itens',
      key: 'quantidadePlanejada',
      width: 130,
      align: 'right',
      render: (itens) => {
        if (!itens || !Array.isArray(itens)) return '0';
        const total = itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0);
        return total.toLocaleString('pt-BR');
      },
    },
    {
      title: 'Qtd Produzida',
      dataIndex: 'itens',
      key: 'quantidadeProduzida',
      width: 130,
      align: 'right',
      render: (itens, record) => {
        if (!itens || !Array.isArray(itens)) return '0';
        const total = itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0);
        const percentual = calcularPercentual(total, total * 0.8); // Mock: 80% produzido
        return (
          <div>
            <div>{Math.round(total * 0.8).toLocaleString('pt-BR')}</div>
            <Badge count={percentual} style={{ backgroundColor: percentual < 100 ? '#faad14' : '#52c41a' }} />
          </div>
        );
      },
    },
    {
      title: 'Data Entrega',
      dataIndex: 'itens',
      key: 'dataEntrega',
      width: 120,
      render: (itens) => {
        if (!itens || itens.length === 0) return '-';
        const primeiraData = itens[0]?.dataEntrega;
        if (!primeiraData) return '-';
        const atrasada = isAtrasada(primeiraData);
        return (
          <Text style={{ color: atrasada ? '#ff4d4f' : 'inherit' }}>
            {dayjs(primeiraData).format('DD/MM/YYYY')}
          </Text>
        );
      },
      sorter: true,
    },
    {
      title: 'Controle',
      dataIndex: 'itens',
      key: 'controle_tipo',
      width: 90,
      render: (itens) => {
        if (!itens || itens.length === 0) return '-';
        const t = itens[0]?.controle_tipo;
        return t === 'PESO' ? 'Peso' : (t === 'PEÇA' ? 'Peça' : '-');
      },
    },
    {
      title: 'Status',
      dataIndex: 'situacao',
      key: 'status',
      width: 120,
      render: (situacao) => {
        const colorMap = {
          'Em cadastro': 'default',
          'Liberada': 'processing',
          'Programada': 'warning',
          'Encerrada': 'success',
        };
        return <Badge status={colorMap[situacao] || 'default'} text={situacao} />;
      },
    },
    {
      title: 'Prioridade',
      dataIndex: 'prioridade',
      key: 'prioridade',
      width: 100,
      render: (prioridade) => {
        const colorMap = {
          'Alta': '#ff4d4f',
          'Média': '#faad14',
          'Baixa': '#52c41a',
        };
        return (
          <Badge
            color={colorMap[prioridade] || '#d9d9d9'}
            text={prioridade || 'N/A'}
          />
        );
      },
      sorter: true,
    },
    {
      title: 'Ferramenta',
      dataIndex: 'ferramenta',
      key: 'ferramenta',
      width: 120,
    },
    {
      title: 'Prensa',
      dataIndex: 'prensa',
      key: 'prensa',
      width: 100,
    },
    {
      title: 'Semana',
      dataIndex: 'semanaProducao',
      key: 'semanaProducao',
      width: 120,
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (text, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<AiOutlineSearch />}
            onClick={() => handleViewDetails(record)}
            size="small"
            title="Visualizar detalhes"
          />
          <Button
            type="text"
            icon={<AiOutlineEdit />}
            onClick={() => handleReprogramar(record)}
            size="small"
            title="Reprogramar"
          />
          <Button
            type="text"
            icon={<AiOutlineUp />}
            onClick={() => handleAlterarPrioridade(record)}
            size="small"
            title="Alterar prioridade"
          />
          <Button
            type="text"
            icon={<AiOutlineBranches />}
            onClick={() => handleAcessarOPsFilhas(record)}
            size="small"
            title="Acessar OPs filhas"
            disabled={!record.opsMESC || record.opsMESC.length === 0}
          />
        </Space>
      ),
    },
  ], [handleViewDetails, handleReprogramar, handleAlterarPrioridade, handleAcessarOPsFilhas]);

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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                Consulta de Ordens de Produção
              </h2>

              {/* Área de Filtros */}
              <div style={{
                margin: '16px 0',
                padding: '16px',
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
                      onClick={handleClearFilters}
                      size="middle"
                    >
                      Limpar Filtros
                    </Button>
                  }
                />
              </div>

              {/* Tabela Principal */}
              <div style={{ padding: '16px 0' }}>
                <PaginatedTable
                  ref={tableRef}
                  disabled={loading}
                  fetchData={fetchData}
                  initialPageSize={10}
                  columns={columns}
                  loadingIcon={<LoadingSpinner />}
                  rowKey="id"
                  rowClassName={(record) => {
                    // Destacar OPs atrasadas
                    if (record.itens && record.itens.length > 0) {
                      const primeiraData = record.itens[0]?.dataEntrega;
                      if (primeiraData && isAtrasada(primeiraData)) {
                        return 'row-atrasada';
                      }
                    }
                    return '';
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Modal de Detalhes */}
        <OPDetalhesModal
          open={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedOrdemId(null);
          }}
          ordemId={selectedOrdemId}
        />
      </Content>

      <style>{`
        .row-atrasada {
          background-color: #fff1f0 !important;
        }
        .row-atrasada:hover {
          background-color: #ffe7e5 !important;
        }
      `}</style>
    </Layout>
  );
};

export default memo(OrdemProducaoConsulta);
