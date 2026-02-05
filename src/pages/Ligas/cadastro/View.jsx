import { Button, Col, Form, Layout, Row } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import LigasService from '../../../services/ligasService';
import { message } from 'antd';

const { Content } = Layout;

const formConfig = [
  {
    title: 'Dados da Liga',
    columns: 2,
    questions: [
      { type: 'text', id: 'cod_liga', label: 'Código' },
      { type: 'text', id: 'descricao', label: 'Descrição' },
      { type: 'text', id: 'composicao', label: 'Composição' },
      { type: 'textarea', id: 'propriedades', label: 'Propriedades' },
    ],
  },
];

const View = ({ record, onEdit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    if (!record?.id) return;
    setLoading(true);
    try {
      const response = await LigasService.getById(record.id);
      if (response.success && response.data?.data) {
        const data = response.data.data;
        const values = { cod_liga: data.cod_liga || '', descricao: data.descricao || '', composicao: data.composicao || '', propriedades: data.propriedades || '' };
        setFormData(values);
        form.setFieldsValue(values);
      }
    } catch (error) {
      message.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [record, form]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (formData && !loading) form.setFieldsValue(formData); }, [formData, loading, form]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card variant="borderless" styles={{ header: { padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Visualizar Liga</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading}>Voltar</Button>
                  {!loading && formData && <Button type="primary" onClick={onEdit}>Editar</Button>}
                </div>
              </div>
              {loading ? <Loading /> : formData ? <div style={{ padding: '16px 0' }}><ViewForm formConfig={formConfig} formInstance={form} /></div> : null}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default View;
