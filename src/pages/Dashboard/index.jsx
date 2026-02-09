import React, { useMemo } from 'react';
import {
  Card,
  Col,
  Progress,
  Row,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Card as LayoutCard, KpiCard, ScoreBadge, StatusBadge } from '../../components';
import { mockOPs } from '../../mocks/dashboard/mockData';
import { colors } from '../../styles/colors';

const { Title, Text } = Typography;

const RECURSOS_MOCK = [
  { nome: 'Prensa 01', carga: 85, status: 'operando' },
  { nome: 'Prensa 02', carga: 62, status: 'operando' },
  { nome: 'Prensa 03', carga: 0, status: 'manutenção' },
  { nome: 'Forno Homog.', carga: 45, status: 'operando' },
];

const RESUMO_STATUS = [
  { key: 'rascunho', label: 'Rascunho', color: '#8c8c8c' },
  { key: 'sequenciada', label: 'Sequenciada', color: '#1890ff' },
  { key: 'confirmada', label: 'Confirmada', color: '#385E9D' },
  { key: 'em_producao', label: 'Em Produção', color: '#d46b08' },
];

const Dashboard = () => {
  const totalOPs = mockOPs.length;
  const emProducao = mockOPs.filter((op) => op.status === 'em_producao').length;
  const hoje = new Date();
  const atrasadas = mockOPs.filter(
    (op) =>
      new Date(op.dataEntrega) < hoje &&
      op.status !== 'concluida' &&
      op.status !== 'cancelada'
  ).length;
  const concluidas = mockOPs.filter((op) => op.status === 'concluida').length;
  const scoreMedia =
    totalOPs > 0
      ? Math.round(mockOPs.reduce((acc, op) => acc + op.score, 0) / totalOPs)
      : 0;

  const opsUrgentes = useMemo(
    () =>
      mockOPs
        .filter((op) => op.status !== 'concluida' && op.status !== 'cancelada')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Title level={4} style={{ margin: 0, color: colors.text.primary }}>
          Dashboard do Planejador
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Visão geral do sequenciamento de produção
        </Text>
      </div>

      {/* KPIs - 5 cards na mesma linha */}
      <Row gutter={[16, 16]} style={{ flexWrap: 'nowrap' }}>
        <Col flex="1 1 0" style={{ minWidth: 0 }}>
          <KpiCard
            title="OPs Totais"
            value={totalOPs}
            icon={FileTextOutlined}
            subtitle="Ordens ativas"
          />
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 0 }}>
          <KpiCard
            title="Em Produção"
            value={emProducao}
            icon={ToolOutlined}
            subtitle="Em execução"
          />
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 0 }}>
          <KpiCard
            title="Atrasadas"
            value={atrasadas}
            icon={WarningOutlined}
            subtitle="Requer ação"
          />
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 0 }}>
          <KpiCard
            title="Concluídas"
            value={concluidas}
            icon={CheckCircleOutlined}
            subtitle="Este mês"
            trend={{ value: '+12%', positive: true }}
          />
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 0 }}>
          <KpiCard
            title="Score Médio"
            value={scoreMedia}
            icon={RiseOutlined}
            subtitle="Eficiência do sequenciamento"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Fila prioritária */}
        <Col xs={24} lg={12}>
          <LayoutCard
            header={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ margin: 0 }}>Fila Prioritária</Title>
                <Link to="/ordem-producao/cadastro" style={{ fontSize: 12, color: colors.primary }}>
                  Ver tudo →
                </Link>
              </div>
            }
            style={{ height: '100%' }}
          >
            <div>
              {opsUrgentes.map((op, i) => (
                <div
                  key={op.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < opsUrgentes.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Text type="secondary" style={{ width: 20, fontFamily: 'monospace', fontSize: 12 }}>
                      {i + 1}
                    </Text>
                    <div>
                      <Text strong style={{ display: 'block', fontSize: 14 }}>
                        {op.codigo}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {op.produto} • {op.cliente}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusBadge status={op.status} />
                    <ScoreBadge score={op.score} />
                  </div>
                </div>
              ))}
            </div>
          </LayoutCard>
        </Col>

        {/* Status dos Recursos */}
        <Col xs={24} lg={12}>
          <LayoutCard
            header={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f0f0f0', marginBottom: 12}}>
                <Title level={5} style={{ margin: 0 }}>Status dos Recursos</Title>
                <Link to="/forno" style={{ fontSize: 12, color: colors.primary }}>
                  Gerenciar →
                </Link>
              </div>
            }
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 24 }}>
              {RECURSOS_MOCK.map((r) => (
                <div key={r.nome} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 14 }}>{r.nome}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: r.status === 'operando' ? '#52c41a' : '#ff4d4f',
                      }}
                    >
                      {r.status === 'operando' ? `${r.carga}% carga` : 'Em manutenção'}
                    </Text>
                  </div>
                  <Progress
                    percent={r.status === 'operando' ? r.carga : 100}
                    showInfo={false}
                    strokeColor={r.status === 'operando' ? (r.carga > 80 ? colors.primary : '#d46b08') : '#ff4d4f'}
                    trailColor="#f0f0f0"
                    size="small"
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                background: colors.backgroundGray,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Text
                strong
                style={{
                  display: 'block',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: colors.text.secondary,
                  marginBottom: 12,
                }}
              >
                Resumo por Status
              </Text>
              <Row gutter={[16, 8]}>
                {RESUMO_STATUS.map((s) => {
                  const count = mockOPs.filter((o) => o.status === s.key).length;
                  return (
                    <Col span={12} key={s.key}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: s.color,
                            flexShrink: 0,
                          }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {s.label}
                        </Text>
                        <Text strong style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
                          {count}
                        </Text>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </LayoutCard>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
