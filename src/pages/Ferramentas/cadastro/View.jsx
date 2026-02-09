import { Button, Col, Form, Layout, Row } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import FerramentasService from '../../../services/ferramentasService';
import { message } from 'antd';

const { Content } = Layout;

const View = ({ record, onEdit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: 'Dados da Ferramenta',
      columns: 2,
      questions: [
        { type: 'text', id: 'codigo', label: 'Código' },
        { type: 'text', id: 'cod_perfil', label: 'Perfil' },
        { type: 'text', id: 'descricao', label: 'Descrição' },
        { type: 'text', id: 'num_cavidades', label: 'Nº cavidades' },
        { type: 'text', id: 'peso_real', label: 'Peso real (kg/m)' },
        { type: 'text', id: 'nitr_atual', label: 'Nitretação atual (m)' },
        { type: 'text', id: 'nitr_limite', label: 'Nitretação limite (m)' },
        { type: 'text', id: 'tempo_forno_min', label: 'Tempo forno mín (min)' },
        { type: 'text', id: 'tempo_forno_max', label: 'Tempo forno máx (min)' },
        { type: 'text', id: 'acompanhamento', label: 'Acompanhamento especial' },
        { type: 'textarea', id: 'motivo_acomp', label: 'Motivo acompanhamento' },
      ],
    },
  ]);

  const fetchData = useCallback(async () => {
    if (!record?.id) return;
    setLoading(true);
    setFormData(null);
    try {
      const response = await FerramentasService.getById(record.id);
      if (response.success && response.data?.data) {
        const data = response.data.data;
        const values = {
          codigo: data.codigo || '',
          cod_perfil: data.cod_perfil || '',
          descricao: data.descricao || '',
          num_cavidades: data.num_cavidades != null ? String(data.num_cavidades) : '',
          peso_real: data.peso_real != null ? String(data.peso_real) : '',
          nitr_atual: data.nitr_atual != null ? String(data.nitr_atual) : '',
          nitr_limite: data.nitr_limite != null ? String(data.nitr_limite) : '',
          tempo_forno_min: data.tempo_forno_min != null ? String(data.tempo_forno_min) : '',
          tempo_forno_max: data.tempo_forno_max != null ? String(data.tempo_forno_max) : '',
          acompanhamento: data.acompanhamento ? 'Sim' : 'Não',
          motivo_acomp: data.motivo_acomp || '',
        };
        setFormData(values);
        form.setFieldsValue(values);
      }
    } catch (error) {
      message.error('Erro ao carregar dados da ferramenta.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              title="Visualizar Ferramenta"
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
