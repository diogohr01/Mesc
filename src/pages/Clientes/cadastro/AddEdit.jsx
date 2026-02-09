import { Button, Col, Form, Layout, message, Row, Space } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import ClientesService from '../../../services/clientesService';

const { Content } = Layout;

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Dados do Cliente/Fornecedor",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "codigoEMS",
          required: true,
          placeholder: "Digite o código do EMS",
          label: "Código do EMS",
        },
        {
          type: "text",
          id: "nome",
          required: true,
          placeholder: "Digite o nome do cliente/fornecedor",
          label: "Fornecedor/Cliente",
        },
        {
          type: "select",
          id: "tipoServico",
          required: true,
          placeholder: "Selecione o tipo de serviço",
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
          required: false,
          placeholder: "Digite o nome do contato",
          label: "Nome de contato",
        },
        {
          type: "phone",
          id: "telefone",
          required: false,
          placeholder: "Digite o telefone",
          label: "Telefone",
        },
        {
          type: "phone",
          id: "celular",
          required: false,
          placeholder: "Digite o celular",
          label: "Celular",
        },
        {
          type: "email",
          id: "email",
          required: false,
          placeholder: "Digite o email",
          label: "Email",
        },
        {
          type: "textarea",
          id: "observacoes",
          required: false,
          placeholder: "Digite observações",
          label: "Observações",
        },
      ],
    },
  ]);

  // Função para buscar dados do registro quando em modo de edição
  const fetchRecordData = useCallback(async (recordId) => {
    setLoading(true);
    try {
      const result = await ClientesService.getById(recordId);

      if (result.success && result.data?.data) {
        const fetchedRecord = result.data.data;

        // Mapear os campos do backend para o frontend
        const deserializedRecord = {
          codigoEMS: fetchedRecord.codigoEMS || '',
          nome: fetchedRecord.nome || '',
          tipoServico: fetchedRecord.tipoServico || '',
          nomeContato: fetchedRecord.nomeContato || '',
          telefone: fetchedRecord.telefone || '',
          celular: fetchedRecord.celular || '',
          email: fetchedRecord.email || '',
          observacoes: fetchedRecord.observacoes || '',
        };

        // Aguardar o componente ser renderizado antes de definir os valores
        setTimeout(() => {
          try {
            form.resetFields();
            form.setFieldsValue(deserializedRecord);
          } catch (error) {
            console.error('Erro ao definir valores no formulário:', error);
          }
        }, 200);
      }
    } catch (error) {
      message.error('Erro ao buscar o registro.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Buscar dados quando o componente for montado em modo de edição
  useEffect(() => {
    if (editingRecord?.id) {
      fetchRecordData(editingRecord.id);
    } else {
      form.resetFields();
    }
  }, [editingRecord, fetchRecordData, form]);

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);
      try {
        const clienteData = {
          ...values,
          id: editingRecord?.id,
          ativo: true,
        };

        const response = await ClientesService.upsert(clienteData);
        
        if (response.success) {
          message.success(editingRecord ? 'Cliente/Fornecedor atualizado com sucesso!' : 'Cliente/Fornecedor criado com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar Cliente/Fornecedor.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    },
    [editingRecord, onSave]
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title={editingRecord ? 'Editar Cliente/Fornecedor' : 'Novo Cliente/Fornecedor'}
              extra={<Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar</Button>}
            >
              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                  <DynamicForm
                    formConfig={formConfig}
                    formInstance={form}
                    onSubmit={handleSave}
                    submitText="Salvar Cliente"
                    submitIcon={<AiOutlineSave />}
                    submitOnSide={false}
                    onClose={onCancel}
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

export default AddEdit;
