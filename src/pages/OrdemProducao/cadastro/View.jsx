import { Button, Col, Form, Layout, Row, Space, Table, Typography } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineEdit } from 'react-icons/ai';
import dayjs from 'dayjs';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import FerramentasOPTable from '../components/FerramentasOPTable';
import { message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const View = ({ record, onEdit, onCancel, onCopy, onAtivarDesativar }) => {
  const [loading, setLoading] = useState(false);
  const [ordemData, setOrdemData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Dados da Ordem (Cabeçalho)",
      columns: 2,
      questions: [
        { type: "text", id: "numeroOPERP", label: "Número da OP (EMS/TOTVS)" },
        { type: "date", id: "dataOP", label: "Data do Registro", format: "DD/MM/YYYY" },
        { type: "date", id: "dataEntrega", label: "Data de Entrega", format: "DD/MM/YYYY" },
        {
          type: "select",
          id: "situacao",
          label: "Situação",
          options: [
            { label: "Em cadastro", value: "Em cadastro" },
            { label: "Liberada", value: "Liberada" },
            { label: "Programada", value: "Programada" },
            { label: "Encerrada", value: "Encerrada" },
          ]
        },
        { type: "text", id: "liga", label: "Liga" },
        { type: "text", id: "tempera", label: "Têmpera" },
        { type: "text", id: "itemCodigo", label: "Item a Produzir (Código)" },
        { type: "text", id: "itemDescricao", label: "Item a Produzir (Descrição)" },
        { type: "integer", id: "quantidadeAProduzir", label: "Quantidade a Produzir" },
        { type: "text", id: "clienteNome", label: "Cliente" },
        { type: "text", id: "numeroPedidoCliente", label: "Nº Pedido do Cliente" },
        { type: "textarea", id: "observacoes", label: "Observações" },
      ],
    },
    {
      title: "Informações Complementares",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "naturezaOperacao",
          label: "Natureza da operação",
        },
        {
          type: "text",
          id: "numeroEmbarque",
          label: "Número do embarque",
        },
        {
          type: "text",
          id: "numeroNotaFiscal",
          label: "Número da nota fiscal",
        },
        {
          type: "select",
          id: "transportadora",
          label: "Transportadora",
          options: [
            { label: "Transportadora ABC", value: "Transportadora ABC" },
            { label: "Transportadora XYZ", value: "Transportadora XYZ" },
            { label: "Transportadora 123", value: "Transportadora 123" },
          ]
        },
      ],
    },
  ]);

  // Buscar dados completos
  const fetchData = useCallback(async () => {
    if (!record?.id) return;

    setLoading(true);
    try {
      const response = await OrdemProducaoService.getById(record.id);
      if (response.success && response.data) {
        const data = response.data;
        
        // Converter datas
        const convertToDayjs = (dateString) => {
          if (!dateString) return null;
          try {
            return dayjs(dateString);
          } catch {
            return null;
          }
        };

        const primeiroItem = data.itens?.[0];
        const dataEntregaOrdem = data.dataEntrega ?? primeiroItem?.dataEntrega;
        const formData = {
          numeroOPERP: data.numeroOPERP || '',
          dataOP: convertToDayjs(data.dataOP),
          dataEntrega: dataEntregaOrdem ? convertToDayjs(dataEntregaOrdem) : null,
          numeroPedidoCliente: data.numeroPedidoCliente || '',
          clienteNome: data.cliente?.nome || '',
          situacao: data.situacao || '',
          liga: data.liga || '',
          tempera: data.tempera || '',
          itemCodigo: primeiroItem?.codigoItem || '',
          itemDescricao: primeiroItem?.descricaoItem || '',
          quantidadeAProduzir: primeiroItem?.quantidadePecas ?? 0,
          observacoes: data.observacoes || '',
          naturezaOperacao: data.informacoesComplementares?.naturezaOperacao || '',
          numeroEmbarque: data.informacoesComplementares?.numeroEmbarque || '',
          numeroNotaFiscal: data.informacoesComplementares?.numeroNotaFiscal || '',
          transportadora: data.informacoesComplementares?.transportadora || '',
        };

        setOrdemData(data);
        
        setTimeout(() => {
          form.setFieldsValue(formData);
        }, 100);
      }
    } catch (error) {
      message.error('Erro ao carregar dados da Ordem de Produção.');
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
      const response = await OrdemProducaoService.copiar(record.id);
      if (response.success) {
        message.success('Ordem de Produção copiada com sucesso!');
        onCopy?.(response.data);
      }
    } catch (error) {
      message.error('Erro ao copiar Ordem de Produção.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, onCopy]);

  const handleAtivarDesativar = useCallback(async () => {
    try {
      setLoading(true);
      const novoStatus = !ordemData?.ativo;
      const response = await OrdemProducaoService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        message.success(novoStatus ? 'Ordem ativada com sucesso!' : 'Ordem desativada com sucesso!');
        fetchData(); // Recarregar dados
        onAtivarDesativar?.(novoStatus);
      }
    } catch (error) {
      message.error('Erro ao alterar status da Ordem.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, ordemData, fetchData, onAtivarDesativar]);

  const itensColumns = [
    {
      title: 'Código Item',
      dataIndex: 'codigoItem',
      key: 'codigoItem',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricaoItem',
      key: 'descricaoItem',
    },
    {
      title: 'Cód. Cliente',
      dataIndex: 'codigoItemCliente',
      key: 'codigoItemCliente',
    },
    {
      title: 'Qtd (peças)',
      dataIndex: 'quantidadePecas',
      key: 'quantidadePecas',
      align: 'right',
      render: (val) => val?.toLocaleString('pt-BR') || '0',
    },
    {
      title: 'Qtd (kg)',
      dataIndex: 'quantidadeKg',
      key: 'quantidadeKg',
      align: 'right',
      render: (val) => val?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
    },
    {
      title: 'Data Entrega',
      dataIndex: 'dataEntrega',
      key: 'dataEntrega',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Controle',
      dataIndex: 'controle_tipo',
      key: 'controle_tipo',
      render: (t) => (t === 'PESO' ? 'Peso' : 'Peça'),
    },
    {
      title: 'Dt lim. prod.',
      dataIndex: 'data_limite_prod',
      key: 'data_limite_prod',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Acabamento',
      dataIndex: 'acabamento',
      key: 'acabamento',
    },
  ];

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Visualizar Ordem de Produção"
              extra={
                <Space>
                  <Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar</Button>
                  <Button type="default" icon={<AiOutlineEdit />} onClick={onEdit} disabled={loading} size="middle">Editar</Button>
                </Space>
              }
            >
              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                  <ViewForm
                    formConfig={formConfig}
                    formInstance={form}
                  />

                  {/* Grid Ferramentas da OP (apenas nas OP Filhas) */}
                  {ordemData?.tipoOp === 'FILHA' && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={4} style={{ marginBottom: 16 }}>Ferramentas da OP</Title>
                      <FerramentasOPTable ordemData={ordemData} />
                    </div>
                  )}

                  {/* Tabela de Itens */}
                  {ordemData?.itens && ordemData.itens.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={4} style={{ marginBottom: 16 }}>Itens da Ordem</Title>
                      <Table
                        dataSource={ordemData.itens}
                        columns={itensColumns}
                        rowKey={(record, index) => `item-${index}`}
                        pagination={false}
                        bordered
                        size="small"
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
