import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Layout, message, Progress, Row, Space, Typography } from 'antd';
import { InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { Card, LoadingSpinner, PaginatedTable, ScoreBadge, StatusBadge, StyledScroll } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import OrdemProducaoService from '../../services/ordemProducaoService';
import { colors } from '../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

const CENARIOS = [
  { id: 'entrega', nome: 'Foco em Entrega', desc: 'Prioriza prazo de entrega', pesos: { entrega: 40, setup: 15, liga: 15, tempera: 10, produto: 10, produtividade: 10 } },
  { id: 'produtividade', nome: 'Foco em Produtividade', desc: 'Minimiza setups e trocas', pesos: { entrega: 15, setup: 30, liga: 20, tempera: 15, produto: 10, produtividade: 10 } },
  { id: 'balanceado', nome: 'Balanceado', desc: 'Equilíbrio entre entrega e produtividade', pesos: { entrega: 25, setup: 20, liga: 15, tempera: 15, produto: 10, produtividade: 15 } },
];

const FilaProducao = () => {
  const [cenarioAtivo, setCenarioAtivo] = useState('entrega');
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const { searchTerm } = useFilterSearchContext();

  const debouncedReloadTable = useMemo(
    () => debounce(() => { if (tableRef.current) tableRef.current.reloadTable(); }, 300),
    []
  );

  const fetchData = useCallback(
    async (page, pageSize) => {
      setLoading(true);
      try {
        const response = await OrdemProducaoService.getFilaProducao({
          page,
          pageSize,
          search: searchTerm?.trim() || undefined,
        });
        return {
          data: response.data?.data || [],
          total: response.data?.pagination?.totalRecords || 0,
        };
      } catch (error) {
        message.error('Erro ao carregar a fila de produção.');
        console.error(error);
        return { data: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [searchTerm]
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  useEffect(() => {
    return () => debouncedReloadTable.cancel?.();
  }, [debouncedReloadTable]);

  const cenario = useMemo(() => CENARIOS.find((c) => c.id === cenarioAtivo) || CENARIOS[0], [cenarioAtivo]);

  const columns = useMemo(
    () => [
      {
        title: '#',
        key: 'posicao',
        width: 56,
        align: 'center',
        render: (_, __, index) => index + 1,
      },
      { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 110, render: (v) => <Text strong style={{ fontFamily: 'monospace' }}>{v || '-'}</Text> },
      { title: 'Produto', dataIndex: 'produto', key: 'produto', width: 220, ellipsis: true },
      { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', width: 200, ellipsis: true },
      { title: 'Liga', dataIndex: 'liga', key: 'liga', width: 70, render: (v) => <Text style={{ fontFamily: 'monospace' }}>{v || '-'}</Text> },
      { title: 'Têmpera', dataIndex: 'tempera', key: 'tempera', width: 80, render: (v) => <Text style={{ fontFamily: 'monospace' }}>{v || '-'}</Text> },
      {
        title: 'Qtd',
        dataIndex: 'quantidade',
        key: 'quantidade',
        width: 90,
        align: 'right',
        render: (v) => (v != null ? Number(v).toLocaleString('pt-BR') : '-'),
      },
      {
        title: 'Entrega',
        dataIndex: 'dataEntrega',
        key: 'dataEntrega',
        width: 110,
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
      },
      { title: 'Recurso', dataIndex: 'recurso', key: 'recurso', width: 110, ellipsis: true },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status) => <StatusBadge status={status} />,
      },
      {
        title: 'Score',
        dataIndex: 'score',
        key: 'score',
        width: 80,
        align: 'center',
        render: (score) => <ScoreBadge score={score ?? 0} size="md" />,
      },
    ],
    []
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Fila de Produção"
              subtitle="Sequenciamento por score de prioridade"
              icon={<ThunderboltOutlined style={{ color: colors.primary }} />}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Cenário de priorização
                  </Text>
                  <Space wrap>
                    {CENARIOS.map((c) => (
                      <Button
                        key={c.id}
                        type={cenarioAtivo === c.id ? 'primary' : 'default'}
                        onClick={() => setCenarioAtivo(c.id)}
                        style={{ textAlign: 'left', height: 'auto', padding: '8px 12px' }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>{c.desc}</div>
                      </Button>
                    ))}
                  </Space>
                </div>

                <div style={{ padding: '12px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <InfoCircleOutlined style={{ color: colors.text.secondary }} />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pesos do cenário: {cenario.nome}
                    </Text>
                  </Space>
                  <Row gutter={[16, 8]}>
                    {Object.entries(cenario.pesos).map(([key, val]) => (
                      <Col key={key} xs={24} sm={12} md={8} lg={6}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12, minWidth: 90, textTransform: 'capitalize' }}>{key}</Text>
                          <Progress percent={val} size="small" showInfo={false} style={{ flex: 1, marginBottom: 0 }} />
                          <Text style={{ fontSize: 12, fontFamily: 'monospace', width: 32 }}>{val}%</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                <div style={{ paddingTop: 8 }}>
                  <PaginatedTable
                    ref={tableRef}
                    fetchData={fetchData}
                    initialPageSize={10}
                    columns={columns}
                    rowKey="id"
                    loadingIcon={<LoadingSpinner />}
                    disabled={loading}
                    scroll={{ x: 'max-content' }}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default FilaProducao;
