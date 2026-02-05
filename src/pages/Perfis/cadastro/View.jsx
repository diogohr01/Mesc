import { Button, Col, Form, Layout, Row } from 'antd';
import { Card, Loading, ViewForm } from '../../../components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import PerfisService from '../../../services/perfisService';
import { message } from 'antd';
import { normalizeDimensionais } from '../../../helpers/perfisUtils';

const { Content } = Layout;

const View = ({ record, onEdit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form] = Form.useForm();

  const formConfig = useMemo(
    () => [
      {
        title: 'Dados do Perfil',
        leftQuestions: [
          { type: 'text', id: 'cod_perfil', label: 'Código do perfil' },
          { type: 'text', id: 'descricao', label: 'Descrição do perfil' },
          { type: 'decimal', id: 'gramatura', label: 'Gramatura (kg/m)' },
          { type: 'decimal', id: 'peso_nominal', label: 'Peso nominal (kg/m)' },
          { type: 'textarea', id: 'observacoes', label: 'OBS (Observações)' },
        ],
        rightQuestions: [
          { type: 'file-display', id: 'caminho_desenho', label: 'Desenho do perfil', variant: 'drawing', placeholder: 'Nenhum arquivo selecionado' },
        ],
        rightQuestionsRow: [
          { type: 'file-display', id: 'anexo_perfil', label: 'Anexo Perfil', variant: 'attachment', placeholder: 'SEM ARQUIVO' },
          { type: 'file-display', id: 'embalamento', label: 'Embalamento', variant: 'attachment', placeholder: 'SEM ARQUIVO' },
        ],
      },
      {
        title: 'Dimensionais',
        columns: 1,
        questions: [
          { type: 'dimensionais-table', id: 'dimensionais', label: 'Dimensionais', emptyText: 'Nenhuma cota cadastrada.' },
        ],
      },
    ],
    []
  );

  const fetchData = useCallback(async () => {
    if (!record?.id) return;
    setLoading(true);
    setData(null);
    try {
      const response = await PerfisService.getById(record.id);
      if (response.success && response.data?.data) {
        const d = response.data.data;
        setData(d);
        form.setFieldsValue({
          cod_perfil: d.cod_perfil || '',
          descricao: d.descricao || '',
          gramatura: d.gramatura ?? 0,
          peso_nominal: d.peso_nominal ?? 0,
          caminho_desenho: d.caminho_desenho || '',
          anexo_perfil: d.anexo_perfil || '',
          embalamento: d.embalamento || '',
          observacoes: d.observacoes || '',
          dimensionais: normalizeDimensionais(d.dimensionais),
        });
      }
    } catch (error) {
      message.error('Erro ao carregar dados do perfil.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [record, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                body: {
                  padding: '24px 24px',
                  minHeight: 420,
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  Visualizar Perfil
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">
                    Voltar
                  </Button>
                  {!loading && data && (
                    <Button type="primary" onClick={onEdit} size="middle">
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <Loading />
              ) : data ? (
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
