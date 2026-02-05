import { Button, Col, Form, Layout, message, Row } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import PerfisService from '../../../services/perfisService';
import { normalizeDimensionais } from '../../../helpers/perfisUtils';

const { Content } = Layout;

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const formConfig = useMemo(
    () => [
      {
        title: 'Dados do Perfil',
        leftQuestions: [
          { type: 'text', id: 'cod_perfil', label: 'Código do perfil', required: true, placeholder: 'Ex.: NBC-0001' },
          { type: 'text', id: 'descricao', label: 'Descrição do perfil', required: true, placeholder: 'Descrição' },
          { type: 'decimal', id: 'gramatura', label: 'Gramatura (kg/m)', placeholder: '0', precision: 2 },
          { type: 'decimal', id: 'peso_nominal', label: 'Peso nominal (kg/m)', placeholder: '0', precision: 2 },
          { type: 'textarea', id: 'observacoes', label: 'OBS (Observações)', placeholder: 'Observações' },
        ],
        rightQuestions: [
          {
            type: 'file-display',
            id: 'caminho_desenho',
            label: 'Desenho do perfil',
            variant: 'drawing',
            placeholder: 'Nenhum arquivo selecionado',
            accept: 'image/*,.pdf',
          },
        ],
        rightQuestionsRow: [
          {
            type: 'file-display',
            id: 'anexo_perfil',
            label: 'Anexo Perfil',
            variant: 'attachment',
            placeholder: 'SEM ARQUIVO',
            accept: '.pdf,.doc,.docx',
          },
          {
            type: 'file-display',
            id: 'embalamento',
            label: 'Embalamento',
            variant: 'attachment',
            placeholder: 'SEM ARQUIVO',
            accept: '.pdf,.doc,.docx',
          },
        ],
      },
      {
        title: 'Dimensionais',
        columns: 1,
        questions: [
          {
            type: 'dimensionais-table',
            id: 'dimensionais',
            label: 'Dimensionais',
            addButtonText: 'Adicionar linha',
            emptyText: 'Nenhuma cota. Clique em "Adicionar linha".',
          },
        ],
      },
    ],
    []
  );

  const fetchRecordData = useCallback(
    async (recordId) => {
      setLoading(true);
      try {
        const result = await PerfisService.getById(recordId);
        if (result.success && result.data?.data) {
          const r = result.data.data;
          form.setFieldsValue({
            cod_perfil: r.cod_perfil || '',
            descricao: r.descricao || '',
            gramatura: r.gramatura ?? 0,
            peso_nominal: r.peso_nominal ?? 0,
            caminho_desenho: r.caminho_desenho || '',
            anexo_perfil: r.anexo_perfil || '',
            embalamento: r.embalamento || '',
            observacoes: r.observacoes || '',
            dimensionais: normalizeDimensionais(r.dimensionais),
          });
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
      form.setFieldsValue({ dimensionais: [] });
    }
  }, [editingRecord, fetchRecordData, form]);

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);
      try {
        const dimensionaisFiltered = (values.dimensionais || []).filter(
          (d) => d.nome_cota != null && String(d.nome_cota).trim() !== ''
        );
        const payload = {
          ...values,
          id: editingRecord?.id,
          dimensionais: dimensionaisFiltered,
        };
        const response = await PerfisService.upsert(payload);
        if (response.success) {
          message.success(editingRecord ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');
          onSave();
        }
      } catch (err) {
        message.error('Erro ao salvar perfil.');
        console.error('Erro:', err);
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
                body: {
                  padding: '24px 24px',
                  minHeight: 420,
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  {editingRecord ? 'Editar Perfil' : 'Novo Perfil'}
                </h2>
                <Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">
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
                    submitText="Salvar Perfil"
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
