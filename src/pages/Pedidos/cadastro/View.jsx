import { Button, Col, Form, Layout, Row, Space, Table, Typography } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineEdit } from 'react-icons/ai';
import PedidosService from '../../../services/pedidosService';
import { message } from 'antd';
import dayjs from 'dayjs';

const { Content } = Layout;

const View = ({ record, onEdit, onCancel, onCopy, onAtivarDesativar }) => {
  const [loading, setLoading] = useState(false);
  const [pedidoData, setPedidoData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Dados do Pedido",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "codigo",
          label: "Código",
        },
        {
          type: "date",
          id: "data",
          label: "Data",
          format: "DD/MM/YYYY"
        },
        {
          type: "select",
          id: "situacao",
          label: "Situação do pedido",
          options: [
            { label: "NÃO INICIADA", value: "NÃO INICIADA" },
            { label: "EM ANDAMENTO", value: "EM ANDAMENTO" },
            { label: "FINALIZADA", value: "FINALIZADA" },
          ]
        },
        {
          type: "text",
          id: "pedidoNumero",
          label: "Pedido nº",
        },
        {
          type: "text",
          id: "clienteNome",
          label: "Cliente",
        },
        {
          type: "textarea",
          id: "observacao",
          label: "Observação",
        },
        {
          type: "textarea",
          id: "obs_tolerancia",
          label: "Observação tolerância",
        },
      ],
    },
  ]);

  // Buscar dados completos
  const fetchData = useCallback(async () => {
    if (!record?.id) return;

    setLoading(true);
    try {
      const response = await PedidosService.getById(record.id);
      if (response.success && response.data?.data) {
        const data = response.data.data;
        
        const convertToDayjs = (dateString) => {
          if (!dateString) return null;
          try {
            const dayjsDate = dayjs(dateString);
            return dayjsDate.isValid() ? dayjsDate : null;
          } catch (error) {
            return null;
          }
        };

        const formData = {
          codigo: data.codigo || '',
          data: convertToDayjs(data.data),
          situacao: data.situacao || '',
          pedidoNumero: data.pedidoNumero || '',
          clienteNome: data.cliente?.nome || '',
          observacao: data.observacao || '',
          obs_tolerancia: data.obs_tolerancia || '',
        };

        setPedidoData(data);
        
        setTimeout(() => {
          form.setFieldsValue(formData);
        }, 100);
      }
    } catch (error) {
      message.error('Erro ao carregar dados do Pedido.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PedidosService.copiar(record.id);
      if (response.success) {
        message.success('Pedido copiado com sucesso!');
        onCopy?.(response.data?.data);
      }
    } catch (error) {
      message.error('Erro ao copiar Pedido.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, onCopy]);

  const handleAtivarDesativar = useCallback(async () => {
    try {
      setLoading(true);
      const novoStatus = !pedidoData?.ativo;
      const response = await PedidosService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        message.success(novoStatus ? 'Pedido ativado com sucesso!' : 'Pedido desativado com sucesso!');
        fetchData(); // Recarregar dados
        onAtivarDesativar?.(novoStatus);
      }
    } catch (error) {
      message.error('Erro ao alterar status do Pedido.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, pedidoData, fetchData, onAtivarDesativar]);

  // Colunas da tabela de itens (somente leitura)
  const itensColumns = [
    {
      title: 'Cód',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 80,
    },
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
      width: 150,
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      width: 300,
    },
    {
      title: 'Qtde (un)',
      dataIndex: 'quantidadeUn',
      key: 'quantidadeUn',
      width: 120,
      render: (value) => value ? value.toLocaleString('pt-BR') : '0',
    },
    {
      title: 'PL (kg)',
      dataIndex: 'pesoKg',
      key: 'pesoKg',
      width: 120,
      render: (value) => value ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00',
    },
    {
      title: 'Dt entrega',
      dataIndex: 'dataEntrega',
      key: 'dataEntrega',
      width: 150,
      render: (data) => data ? dayjs(data).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Controle',
      dataIndex: 'controle_tipo',
      key: 'controle_tipo',
      width: 90,
      render: (t) => (t === 'PESO' ? 'Peso' : 'Peça'),
    },
    {
      title: 'Dt lim. prod.',
      dataIndex: 'data_limite_prod',
      key: 'data_limite_prod',
      width: 110,
      render: (data) => data ? dayjs(data).format('DD/MM/YYYY') : '-',
    },
  ];

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
                  alignItems: 'center'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Visualizar Pedido
                </h2>
                <Space>
                  <Button
                    type="default"
                    icon={<AiOutlineArrowLeft />}
                    onClick={onCancel}
                    disabled={loading}
                    size="middle"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="default"
                    icon={<AiOutlineEdit />}
                    onClick={onEdit}
                    disabled={loading}
                    size="middle"
                  >
                    Editar
                  </Button>
                </Space>
              </div>

              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                  <ViewForm
                    formConfig={formConfig}
                    formInstance={form}
                  />

                  {/* Tabela de Itens */}
                  {pedidoData?.itens && pedidoData.itens.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                        Itens do Pedido
                      </h3>
                      <Table
                        columns={itensColumns}
                        dataSource={pedidoData.itens}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default View;
