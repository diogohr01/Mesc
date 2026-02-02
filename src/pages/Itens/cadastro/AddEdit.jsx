import { Button, Col, Form, Layout, message, Row } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import ItensService from '../../../services/itensService';

const { Content } = Layout;

const UNIDADES = [
  { label: 'UN', value: 'UN' },
  { label: 'KG', value: 'KG' },
  { label: 'M', value: 'M' },
  { label: 'M²', value: 'M²' },
  { label: 'PC', value: 'PC' },
];

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: 'Dados do Item',
      columns: 2,
      questions: [
        {
          type: 'text',
          id: 'codigo',
          required: true,
          placeholder: 'Digite o código',
          label: 'Código',
        },
        {
          type: 'text',
          id: 'descricao',
          required: true,
          placeholder: 'Digite a descrição',
          label: 'Descrição',
        },
        {
          type: 'select',
          id: 'unidade',
          required: true,
          placeholder: 'Selecione a unidade',
          label: 'Unidade',
          options: UNIDADES,
        },
        {
          type: 'textarea',
          id: 'observacoes',
          required: false,
          placeholder: 'Observações',
          label: 'Observações',
        },
      ],
    },
  ]);

  const fetchRecordData = useCallback(
    async (recordId) => {
      setLoading(true);
      try {
        const result = await ItensService.getById(recordId);
        if (result.success && result.data?.data) {
          const fetchedRecord = result.data.data;
          const deserializedRecord = {
            codigo: fetchedRecord.codigo || '',
            descricao: fetchedRecord.descricao || '',
            unidade: fetchedRecord.unidade || 'UN',
            observacoes: fetchedRecord.observacoes || '',
          };
          setTimeout(() => {
            try {
              form.resetFields();
              form.setFieldsValue(deserializedRecord);
            } catch (err) {
              console.error('Erro ao definir valores no formulário:', err);
            }
          }, 200);
        }
      } catch (error) {
        message.error('Erro ao buscar o registro.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

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
        const itemData = {
          ...values,
          id: editingRecord?.id,
          ativo: true,
        };
        const response = await ItensService.upsert(itemData);
        if (response.success) {
          message.success(editingRecord ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar item.');
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
              styles={{
                header: {
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  {editingRecord ? 'Editar Item' : 'Novo Item'}
                </h2>
                <Button
                  type="default"
                  icon={<AiOutlineArrowLeft />}
                  onClick={onCancel}
                  disabled={loading}
                  size="middle"
                >
                  Voltar
                </Button>
              </div>

              {loading ? (
                <Loading />
              ) : (
                <div style={{ padding: '16px 0' }}>
                  <DynamicForm
                    formConfig={formConfig}
                    formInstance={form}
                    onSubmit={handleSave}
                    submitText="Salvar Item"
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
