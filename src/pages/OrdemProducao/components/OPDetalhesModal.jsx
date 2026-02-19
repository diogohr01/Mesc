import { Badge, Button, Form, Modal, Space, Table, Tabs, Typography } from 'antd';
import { ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineDownload, AiOutlinePrinter } from 'react-icons/ai';
import dayjs from 'dayjs';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import { message } from 'antd';

const { Text } = Typography;
const { TabPane } = Tabs;

const OPDetalhesModal = ({ open, onClose, ordemId }) => {
  const [loading, setLoading] = useState(false);
  const [ordemData, setOrdemData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Dados da Ordem",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "numeroOPERP",
          label: "Número da OP (ERP / TOTVS)",
        },
        {
          type: "date",
          id: "dataOP",
          label: "Data da OP",
          format: "DD/MM/YYYY"
        },
        {
          type: "text",
          id: "numeroPedidoCliente",
          label: "Número do pedido do cliente",
        },
        {
          type: "text",
          id: "clienteNome",
          label: "Cliente",
        },
        {
          type: "select",
          id: "situacao",
          label: "Situação da OP",
          options: [
            { label: "Em cadastro", value: "Em cadastro" },
            { label: "Liberada", value: "Liberada" },
            { label: "Programada", value: "Programada" },
            { label: "Encerrada", value: "Encerrada" },
          ]
        },
      ],
    },
  ]);

  // Buscar dados da OP
  const fetchData = useCallback(async () => {
    if (!ordemId) return;

    setLoading(true);
    try {
      const response = await OrdemProducaoService.getById(ordemId);
      if (response.success && response.data) {
        const data = response.data;
        setOrdemData(data);
        setHistorico(data.historicoAlteracoes || []);

        // Preencher formulário
        const convertToDayjs = (dateString) => {
          if (!dateString) return null;
          try {
            return dayjs(dateString);
          } catch {
            return null;
          }
        };

        const formData = {
          numeroOPERP: data.numeroOPERP || '',
          dataOP: convertToDayjs(data.dataOP),
          numeroPedidoCliente: data.numeroPedidoCliente || '',
          clienteNome: data.cliente?.nome || '',
          situacao: data.situacao || '',
        };

        setTimeout(() => {
          form.setFieldsValue(formData);
        }, 100);
      }
    } catch (error) {
      message.error('Erro ao carregar dados da OP.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [ordemId, form]);

  useEffect(() => {
    if (open && ordemId) {
      fetchData();
    } else {
      setOrdemData(null);
      setHistorico([]);
      form.resetFields();
    }
  }, [open, ordemId, fetchData, form]);

  const handleExport = useCallback(async () => {
    try {
      const response = await OrdemProducaoService.exportar({ id: ordemId });
      if (response.success) {
        message.success('Dados exportados com sucesso!');
        // Aqui poderia implementar download real do arquivo
      }
    } catch (error) {
      message.error('Erro ao exportar dados.');
      console.error('Erro:', error);
    }
  }, [ordemId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const historicoColumns = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 180,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'Usuário',
      dataIndex: 'usuario',
      key: 'usuario',
      width: 150,
    },
    {
      title: 'Campo',
      dataIndex: 'campo',
      key: 'campo',
      width: 150,
    },
    {
      title: 'Valor Antigo',
      dataIndex: 'valorAntigo',
      key: 'valorAntigo',
      width: 200,
    },
    {
      title: 'Valor Novo',
      dataIndex: 'valorNovo',
      key: 'valorNovo',
      width: 200,
    },
  ];

  const opsFilhasColumns = [
    {
      title: 'OP MESC',
      dataIndex: 'numeroOPMESC',
      key: 'numeroOPMESC',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => {
        const colorMap = {
          'Em produção': 'processing',
          'Finalizada': 'success',
          'Cancelada': 'error',
        };
        return <Badge status={colorMap[status] || 'default'} text={status} />;
      },
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      width: 120,
      align: 'right',
      render: (val) => val?.toLocaleString('pt-BR') || '0',
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ top: 20 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: '18px' }}>
            Detalhes da Ordem de Produção
          </Text>
          <Space>
            <Button
              icon={<AiOutlineDownload />}
              onClick={handleExport}
              disabled={loading}
            >
              Exportar
            </Button>
            <Button
              icon={<AiOutlinePrinter />}
              onClick={handlePrint}
              disabled={loading}
            >
              Imprimir
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </Space>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Carregando...</Text>
        </div>
      ) : (
        <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
          <TabPane tab="Dados Gerais" key="1">
            <ViewForm
              formConfig={formConfig}
              formInstance={form}
            />
          </TabPane>

          <TabPane tab="Histórico de Alterações" key="2">
            <Table
              dataSource={historico}
              columns={historicoColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane tab="OPs MESC" key="3">
            {ordemData?.opsMESC && ordemData.opsMESC.length > 0 ? (
              <Table
                dataSource={ordemData.opsMESC}
                columns={opsFilhasColumns}
                rowKey={(record, index) => `op-${index}`}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">Nenhuma OP do MESC vinculada</Text>
              </div>
            )}
          </TabPane>

          <TabPane tab="Observações" key="4">
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              minHeight: '200px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <Text>
                {ordemData?.observacoes || 'Nenhuma observação registrada.'}
              </Text>
            </div>
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
};

export default OPDetalhesModal;
