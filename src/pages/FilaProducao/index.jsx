import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Layout, message, Progress, Row, Space, Typography } from 'antd';
import { InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { Card, LoadingSpinner, PaginatedTable, ScoreBadge, StatusBadge } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import OrdemProducaoService from '../../services/ordemProducaoService';
import SequenciamentoService from '../../services/sequenciamentoService';
import { colors } from '../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

const FilaProducao = () => {
  const [cenarios, setCenarios] = useState([]);
  const [cenarioAtivo, setCenarioAtivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCenarios, setLoadingCenarios] = useState(true);
  const tableRef = useRef(null);
  const { searchTerm } = useFilterSearchContext();

  useEffect(() => {
    let cancelled = false;
    setLoadingCenarios(true);
    SequenciamentoService.getAll({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled && res.success && res.data?.data) {
          const list = res.data.data;
          setCenarios(list);
          if (list.length && cenarioAtivo == null) setCenarioAtivo(list[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) message.error('Erro ao carregar cenários.');
      })
      .finally(() => {
        if (!cancelled) setLoadingCenarios(false);
      });
    return () => { cancelled = true; };
  }, []);

  const cenarioAtivoId = cenarioAtivo ?? (cenarios[0]?.id ?? null);
  const cenarioSelecionado = useMemo(
    () => cenarios.find((c) => c.id === cenarioAtivoId) || cenarios[0],
    [cenarios, cenarioAtivoId]
  );
  const pesosDoCenario = useMemo(() => {
    if (!cenarioSelecionado?.criterios?.length) return {};
    return cenarioSelecionado.criterios.reduce((acc, cr) => {
      acc[cr.id] = cr.value ?? 0;
      return acc;
    }, {});
  }, [cenarioSelecionado]);

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
          cenarioId: cenarioAtivoId ?? undefined,
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
    [searchTerm, cenarioAtivoId]
  );

  useEffect(() => {
    debouncedReloadTable();
  }, [searchTerm, debouncedReloadTable]);

  useEffect(() => {
    if (cenarioAtivoId != null && tableRef.current) tableRef.current.reloadTable();
  }, [cenarioAtivoId]);

  useEffect(() => {
    return () => debouncedReloadTable.cancel?.();
  }, [debouncedReloadTable]);


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
              subtitle="Ordenação por cenário de prioridade"
              icon={<ThunderboltOutlined style={{ color: colors.primary }} />}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Cenário de priorização
                  </Text>
                  {loadingCenarios ? (
                    <Text type="secondary">Carregando cenários...</Text>
                  ) : cenarios.length === 0 ? (
                    <Text type="secondary">Nenhum cenário cadastrado. Cadastre em PCP → Cenários.</Text>
                  ) : (
                    <Space wrap>
                      {cenarios.map((c) => (
                        <Button
                          key={c.id}
                          type={cenarioAtivoId === c.id ? 'primary' : 'default'}
                          onClick={() => setCenarioAtivo(c.id)}
                          style={{ textAlign: 'left', height: 'auto', padding: '8px 12px' }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome}</div>
                          <div style={{ fontSize: 11, opacity: 0.85 }}>{c.descricao || ''}</div>
                        </Button>
                      ))}
                    </Space>
                  )}
                </div>

                {cenarioSelecionado && Object.keys(pesosDoCenario).length > 0 && (
                  <div style={{ padding: '12px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <Space align="center" style={{ marginBottom: 8 }}>
                      <InfoCircleOutlined style={{ color: colors.text.secondary }} />
                      <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pesos do cenário: {cenarioSelecionado.nome}
                      </Text>
                    </Space>
                    <Row gutter={[16, 8]}>
                      {(cenarioSelecionado.criterios || []).map((cr) => (
                        <Col key={cr.id} xs={24} sm={12} md={8} lg={6}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12, minWidth: 90 }}>{cr.label}</Text>
                            <Progress percent={cr.value ?? 0} size="small" showInfo={false} style={{ flex: 1, marginBottom: 0 }} />
                            <Text style={{ fontSize: 12, fontFamily: 'monospace', width: 32 }}>{cr.value ?? 0}%</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}

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
