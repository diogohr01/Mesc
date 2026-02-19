import { Button, Col, Form, Layout, Row } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import ItensService from '../../../services/itensService';
import { message } from 'antd';

const { Content } = Layout;

const View = ({ record, onEdit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: 'Dados do Item',
      columns: 2,
      questions: [
        { type: 'text', id: 'codigo', label: 'Código' },
        { type: 'text', id: 'cod_ferramenta', label: 'Ferramenta' },
        { type: 'text', id: 'descricao', label: 'Descrição' },
        { type: 'text', id: 'liga', label: 'Liga' },
        { type: 'text', id: 'tempera', label: 'Têmpera' },
        { type: 'text', id: 'unidade', label: 'Unidade' },
        { type: 'text', id: 'leadtime_producao', label: 'Lead time produção (dias)' },
        { type: 'text', id: 'leadtime_entrega', label: 'Lead time entrega (dias)' },
        { type: 'text', id: 'tipo_acabamento', label: 'Tipo acabamento' },
        { type: 'text', id: 'peso_unitario', label: 'Peso unitário (kg)' },
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
          cod_ferramenta: data.cod_ferramenta || '',
          descricao: data.descricao || '',
          liga: data.liga || '',
          tempera: data.tempera || '',
          unidade: data.unidade || '',
          leadtime_producao: data.leadtime_producao != null ? String(data.leadtime_producao) : '',
          leadtime_entrega: data.leadtime_entrega != null ? String(data.leadtime_entrega) : '',
          tipo_acabamento: data.tipo_acabamento || '',
          peso_unitario: data.peso_unitario != null ? String(data.peso_unitario) : '',
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
              title="Visualizar Item"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar</Button>
                  {!loading && formData && <Button type="primary" onClick={onEdit} size="middle">Editar</Button>}
                </div>
              }
            >
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
