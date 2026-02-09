import { Button, Col, Form, Layout, message, Row } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import LigasService from '../../../services/ligasService';

const { Content } = Layout;

const formConfig = [
  {
    title: 'Dados da Liga',
    columns: 2,
    questions: [
      { type: 'text', id: 'cod_liga', required: true, placeholder: 'Ex.: 6063', label: 'Código' },
      { type: 'text', id: 'descricao', required: true, placeholder: 'Descrição', label: 'Descrição' },
      { type: 'text', id: 'composicao', required: false, placeholder: 'Composição química', label: 'Composição' },
      { type: 'textarea', id: 'propriedades', required: false, placeholder: 'Propriedades mecânicas', label: 'Propriedades' },
    ],
  },
];

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchRecordData = useCallback(
    async (recordId) => {
      setLoading(true);
      try {
        const result = await LigasService.getById(recordId);
        if (result.success && result.data?.data) {
          const r = result.data.data;
          form.resetFields();
          form.setFieldsValue({
            cod_liga: r.cod_liga || '',
            descricao: r.descricao || '',
            composicao: r.composicao || '',
            propriedades: r.propriedades || '',
          });
        }
      } catch (error) {
        message.error('Erro ao buscar o registro.');
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  useEffect(() => {
    if (editingRecord?.id) fetchRecordData(editingRecord.id);
    else form.resetFields();
  }, [editingRecord, fetchRecordData, form]);

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);
      try {
        const response = await LigasService.upsert({ ...values, id: editingRecord?.id });
        if (response.success) {
          message.success(editingRecord ? 'Liga atualizada com sucesso!' : 'Liga criada com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar liga.');
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
              title={editingRecord ? 'Editar Liga' : 'Nova Liga'}
              extra={<Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading}>Voltar</Button>}
            >
              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                  <DynamicForm formConfig={formConfig} formInstance={form} onSubmit={handleSave} submitText="Salvar" submitIcon={<AiOutlineSave />} submitOnSide={false} onClose={onCancel} />
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
