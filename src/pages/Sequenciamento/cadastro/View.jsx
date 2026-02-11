import { Button, Col, Layout, Row, Typography } from 'antd';
import { Card, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import SequenciamentoService from '../../../services/sequenciamentoService';
import { message } from 'antd';
import { colors } from '../../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

const View = ({ record, onEdit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    if (!record?.id) return;
    setLoading(true);
    setData(null);
    try {
      const response = await SequenciamentoService.getById(record.id);
      if (response.success && response.data?.data) {
        setData(response.data.data);
      }
    } catch (error) {
      message.error('Erro ao carregar dados do cenário.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [record?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const total = data?.criterios?.reduce((s, c) => s + (c.value ?? 0), 0) ?? 0;

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Visualizar Cenário"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="default"
                    icon={<AiOutlineArrowLeft />}
                    onClick={onCancel}
                    disabled={loading}
                    size="middle"
                  >
                    Voltar
                  </Button>
                  {!loading && data && (
                    <Button type="primary" onClick={onEdit} size="middle">
                      Editar
                    </Button>
                  )}
                </div>
              }
            >
              {loading ? (
                <Loading />
              ) : data ? (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 4 }}>
                      Nome
                    </Text>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {data.nome || '—'}
                    </Text>
                  </div>
                  {data.descricao != null && data.descricao !== '' && (
                    <div style={{ marginBottom: 24 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>
                        Descrição
                      </Text>
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {data.descricao}
                      </Text>
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <Text strong>Pesos dos critérios</Text>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'monospace',
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor:
                            total === 100 ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
                          color: total === 100 ? '#52c41a' : '#ff4d4f',
                        }}
                      >
                        Total: {total}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Array.isArray(data.criterios) &&
                        data.criterios.map((c, index) => (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: 6,
                              border: `1px solid ${colors.backgroundGray}`,
                              backgroundColor: colors.background,
                            }}
                          >
                            <span style={{ fontSize: 12, color: colors.text.secondary }}>
                              {index + 1}. {c.label}
                            </span>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: colors.primary,
                              }}
                            >
                              {c.value ?? 0}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
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
