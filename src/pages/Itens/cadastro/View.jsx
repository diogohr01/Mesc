import { Button, Col, Form, Layout, Row } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import ItensService from '../../../services/itensService';
import { message } from 'antd';

const { Content } = Layout;

const View = ({ record, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: 'Dados do Item',
      columns: 2,
      questions: [
        { type: 'text', id: 'codigo', label: 'Código' },
        { type: 'text', id: 'descricao', label: 'Descrição' },
        { type: 'text', id: 'unidade', label: 'Unidade' },
        { type: 'textarea', id: 'observacoes', label: 'Observações' },
      ],
    },
  ]);

  const fetchData = useCallback(async () => {
    if (!record?.id) return;
    setLoading(true);
    setFormData(null);
    try {
      const response = await ItensService.getById(record.id);
      if (response.success && response.data?.data) {
        const data = response.data.data;
        const values = {
          codigo: data.codigo || '',
          descricao: data.descricao || '',
          unidade: data.unidade || '',
          observacoes: data.observacoes || '',
        };
        setFormData(values);
        form.setFieldsValue(values);
      }
    } catch (error) {
      message.error('Erro ao carregar dados do item.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Garantir que o form exiba os valores após montar (evita campos cinza/vazios)
  useEffect(() => {
    if (formData && !loading) {
      form.setFieldsValue(formData);
    }
  }, [formData, loading, form]);

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
                  alignItems: 'center',
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Visualizar Item
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
              ) : formData ? (
                <div style={{ padding: '16px 0' }}>
                  <ViewForm formConfig={formConfig} formInstance={form} />
                </div>
              ) : null}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default View;
