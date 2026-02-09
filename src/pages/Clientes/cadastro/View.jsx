import { Button, Col, Form, Layout, Row, Space, Typography } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineEdit } from 'react-icons/ai';
import ClientesService from '../../../services/clientesService';
import { message } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const View = ({ record, onEdit, onCancel, onCopy, onAtivarDesativar }) => {
  const [loading, setLoading] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Dados do Cliente/Fornecedor",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "codigoEMS",
          label: "Código do EMS",
        },
        {
          type: "text",
          id: "nome",
          label: "Fornecedor/Cliente",
        },
        {
          type: "select",
          id: "tipoServico",
          label: "Tipo de serviço",
          options: [
            { label: "DIVERSOS", value: "DIVERSOS" },
            { label: "TRANSPORTE", value: "TRANSPORTE" },
            { label: "MATERIA_PRIMA", value: "MATERIA_PRIMA" },
            { label: "SERVICOS", value: "SERVICOS" },
          ]
        },
        {
          type: "text",
          id: "nomeContato",
          label: "Nome de contato",
        },
        {
          type: "phone",
          id: "telefone",
          label: "Telefone",
        },
        {
          type: "phone",
          id: "celular",
          label: "Celular",
        },
        {
          type: "email",
          id: "email",
          label: "Email",
        },
        {
          type: "textarea",
          id: "observacoes",
          label: "Observações",
        },
      ],
    },
  ]);

  // Buscar dados completos
  const fetchData = useCallback(async () => {
    if (!record?.id) return;

    setLoading(true);
    try {
      const response = await ClientesService.getById(record.id);
      if (response.success && response.data?.data) {
        const data = response.data.data;
        
        const formData = {
          codigoEMS: data.codigoEMS || '',
          nome: data.nome || '',
          tipoServico: data.tipoServico || '',
          nomeContato: data.nomeContato || '',
          telefone: data.telefone || '',
          celular: data.celular || '',
          email: data.email || '',
          observacoes: data.observacoes || '',
        };

        setClienteData(data);
        
        setTimeout(() => {
          form.setFieldsValue(formData);
        }, 100);
      }
    } catch (error) {
      message.error('Erro ao carregar dados do Cliente/Fornecedor.');
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
      const response = await ClientesService.copiar(record.id);
      if (response.success) {
        message.success('Cliente/Fornecedor copiado com sucesso!');
        onCopy?.(response.data?.data);
      }
    } catch (error) {
      message.error('Erro ao copiar Cliente/Fornecedor.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, onCopy]);

  const handleAtivarDesativar = useCallback(async () => {
    try {
      setLoading(true);
      const novoStatus = !clienteData?.ativo;
      const response = await ClientesService.ativarDesativar(record.id, novoStatus);
      if (response.success) {
        message.success(novoStatus ? 'Cliente ativado com sucesso!' : 'Cliente desativado com sucesso!');
        fetchData(); // Recarregar dados
        onAtivarDesativar?.(novoStatus);
      }
    } catch (error) {
      message.error('Erro ao alterar status do Cliente.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, clienteData, fetchData, onAtivarDesativar]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Visualizar Cliente/Fornecedor"
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
