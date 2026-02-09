import { Button, Col, Form, Layout, message, Row } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import FerramentasService from '../../../services/ferramentasService';
import PerfisService from '../../../services/perfisService';

const { Content } = Layout;

const CODIGO_FERRAMENTA_REGEX = /^[A-Za-z]{3}-[0-9]{4}\/[A-Za-z]{2}-[0-9]{3}$/;

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [perfisOptions, setPerfisOptions] = useState([]);
  const [form] = Form.useForm();
  const acompanhamento = Form.useWatch('acompanhamento', form);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await PerfisService.getAll({ page: 1, pageSize: 500 });
        if (res?.data?.data) {
          setPerfisOptions(
            res.data.data.map((p) => ({ label: `${p.cod_perfil} - ${p.descricao || ''}`, value: p.cod_perfil }))
          );
        }
      } catch (e) {
        console.error('Erro ao carregar perfis:', e);
      }
    };
    load();
  }, []);

  const formConfig = useMemo(
    () => [
      {
        title: 'Dados da Ferramenta',
        leftQuestions: [
          {
            type: 'text',
            id: 'codigo',
            required: true,
            placeholder: 'Ex.: MTR-0001/F16-001',
            label: 'Código (padrão: 3 letras-4 números/2 letras-3 números)',
          },
          {
            type: 'select',
            id: 'cod_perfil',
            required: true,
            placeholder: 'Selecione o perfil',
            label: 'Perfil',
            options: perfisOptions,
            showSearch: true,
          },
          { type: 'text', id: 'descricao', required: true, placeholder: 'Descrição', label: 'Descrição' },
          { type: 'integer', id: 'num_cavidades', required: false, placeholder: '1', label: 'Nº cavidades' },
          { type: 'decimal', id: 'peso_real', required: false, placeholder: '0', label: 'Peso real (kg/m)', precision: 2 },
          { type: 'integer', id: 'nitr_atual', required: false, placeholder: '0', label: 'Nitretação atual (m linear)' },
          { type: 'integer', id: 'nitr_limite', required: false, placeholder: '0', label: 'Nitretação limite (m linear)' },
          { type: 'integer', id: 'tempo_forno_min', required: false, placeholder: '0', label: 'Tempo forno mín (min)' },
          { type: 'integer', id: 'tempo_forno_max', required: false, placeholder: '0', label: 'Tempo forno máx (min)' },
        ],
        rightWrapperStyle: {
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          padding: 16,
          background: '#fafafa',
        },
        rightQuestions: [
          { type: 'checkbox', id: 'acompanhamento', required: false, label: 'Acompanhamento especial', noLabel: true },
          {
            type: 'textarea',
            id: 'motivo_acomp',
            required: false,
            placeholder: 'Motivo (obrigatório se acompanhamento)',
            label: 'Motivo acompanhamento',
            disabled: !acompanhamento,
          },
        ],
      },
    ],
    [perfisOptions, acompanhamento]
  );

  const fetchRecordData = useCallback(
    async (recordId) => {
      setLoading(true);
      try {
        const result = await FerramentasService.getById(recordId);
        if (result.success && result.data?.data) {
          const r = result.data.data;
          const values = {
            codigo: r.codigo || '',
            cod_perfil: r.cod_perfil || undefined,
            descricao: r.descricao || '',
            num_cavidades: r.num_cavidades ?? 1,
            peso_real: r.peso_real ?? 0,
            nitr_atual: r.nitr_atual ?? 0,
            nitr_limite: r.nitr_limite ?? 0,
            tempo_forno_min: r.tempo_forno_min ?? 0,
            tempo_forno_max: r.tempo_forno_max ?? 0,
            acompanhamento: r.acompanhamento === true,
            motivo_acomp: r.motivo_acomp || '',
          };
          setTimeout(() => {
            form.resetFields();
            form.setFieldsValue(values);
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
      if (values.acompanhamento && !(values.motivo_acomp || '').trim()) {
        message.warning('Informe o motivo do acompanhamento especial.');
        return;
      }
      const codigo = (values.codigo || '').trim();
      if (codigo && !CODIGO_FERRAMENTA_REGEX.test(codigo)) {
        message.warning('Código deve seguir o padrão: 3 letras-4 números/2 letras-3 números (ex.: MTR-0001/F16-001).');
        return;
      }
      setLoading(true);
      try {
        const payload = {
          ...values,
          id: editingRecord?.id,
        };
        const response = await FerramentasService.upsert(payload);
        if (response.success) {
          message.success(editingRecord ? 'Ferramenta atualizada com sucesso!' : 'Ferramenta criada com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar ferramenta.');
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
              title={editingRecord ? 'Editar Ferramenta' : 'Nova Ferramenta'}
              extra={<Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar</Button>}
            >
              {loading ? (
                <Loading />
              ) : (
                <div style={{ padding: '16px 0' }}>
                  <DynamicForm
                    formConfig={formConfig}
                    formInstance={form}
                    onSubmit={handleSave}
                    submitText="Salvar Ferramenta"
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
