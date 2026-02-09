import { Button, Col, Form, Layout, message, Row } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import ItensService from '../../../services/itensService';
import FerramentasService from '../../../services/ferramentasService';

const { Content } = Layout;

const UNIDADES = [
  { label: 'UN', value: 'UN' },
  { label: 'KG', value: 'KG' },
  { label: 'M', value: 'M' },
  { label: 'M²', value: 'M²' },
  { label: 'PC', value: 'PC' },
];

const TIPO_ACABAMENTO = [
  { label: 'Nenhum', value: 'nenhum' },
  { label: 'Pintura', value: 'pintura' },
  { label: 'Anodização', value: 'anodização' },
];

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [ferramentasOptions, setFerramentasOptions] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await FerramentasService.getAll({ page: 1, pageSize: 500 });
        if (res?.data?.data) {
          setFerramentasOptions(
            res.data.data.map((f) => ({ label: `${f.codigo} - ${f.descricao || ''}`, value: f.codigo }))
          );
        }
      } catch (e) {
        console.error('Erro ao carregar ferramentas:', e);
      }
    };
    load();
  }, []);

  const formConfig = useMemo(
    () => [
      {
        title: 'Dados do Item',
        columns: 2,
        questions: [
          { type: 'text', id: 'codigo', required: true, placeholder: 'Digite o código', label: 'Código' },
          {
            type: 'select',
            id: 'cod_ferramenta',
            required: true,
            placeholder: 'Selecione a ferramenta',
            label: 'Ferramenta',
            options: ferramentasOptions,
            showSearch: true,
          },
          { type: 'text', id: 'descricao', required: true, placeholder: 'Digite a descrição', label: 'Descrição' },
          { type: 'select', id: 'unidade', required: true, placeholder: 'Unidade', label: 'Unidade', options: UNIDADES },
          { type: 'integer', id: 'leadtime_producao', required: false, placeholder: '0', label: 'Lead time produção (dias)' },
          { type: 'integer', id: 'leadtime_entrega', required: false, placeholder: '0', label: 'Lead time entrega (dias)' },
          { type: 'select', id: 'tipo_acabamento', required: false, placeholder: 'Nenhum', label: 'Tipo acabamento', options: TIPO_ACABAMENTO },
          { type: 'decimal', id: 'peso_unitario', required: false, placeholder: '0', label: 'Peso unitário (kg)', precision: 2 },
          { type: 'textarea', id: 'observacoes', required: false, placeholder: 'Observações', label: 'Observações' },
        ],
      },
    ],
    [ferramentasOptions]
  );

  const fetchRecordData = useCallback(
    async (recordId) => {
      setLoading(true);
      try {
        const result = await ItensService.getById(recordId);
        if (result.success && result.data?.data) {
          const r = result.data.data;
          const deserializedRecord = {
            codigo: r.codigo || '',
            cod_ferramenta: r.cod_ferramenta || undefined,
            descricao: r.descricao || '',
            unidade: r.unidade || 'UN',
            leadtime_producao: r.leadtime_producao ?? 0,
            leadtime_entrega: r.leadtime_entrega ?? 0,
            tipo_acabamento: r.tipo_acabamento || 'nenhum',
            peso_unitario: r.peso_unitario ?? 0,
            observacoes: r.observacoes || '',
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
      if (!values.cod_ferramenta) {
        message.warning('Selecione uma ferramenta.');
        return;
      }
      setLoading(true);
      try {
        const itemData = {
          ...values,
          id: editingRecord?.id,
          leadtime_producao: values.leadtime_producao ?? 0,
          leadtime_entrega: values.leadtime_entrega ?? 0,
          tipo_acabamento: values.tipo_acabamento || 'nenhum',
          peso_unitario: values.peso_unitario ?? 0,
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
              title={editingRecord ? 'Editar Item' : 'Novo Item'}
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
