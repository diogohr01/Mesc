import React, { useEffect, useMemo, useState } from 'react';
import {
  Col,
  DatePicker,
  Progress,
  Row,
  Space,
  Button,
  Tag,
  Typography,
} from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Card as LayoutCard, KpiCard, ScoreBadge, StatusBadge } from '../../components';
import AlertasService from '../../services/alertasService';
import OrdemProducaoService from '../../services/ordemProducaoService';
import RecursosProdutivosService from '../../services/recursosProdutivosService';
import { statusLabels } from '../../constants/ordemProducaoStatus';
import { colors } from '../../styles/colors';

const { Title, Text } = Typography;

const ALERTA_STYLES = {
  urgente: { borderLeft: '4px solid #ff4d4f', backgroundColor: '#fff2f0' },
  warning: { borderLeft: '4px solid #faad14', backgroundColor: '#fffbe6' },
  info: { borderLeft: '4px solid #1890ff', backgroundColor: '#e6f7ff' },
};

const CAPACIDADE_TOTAL = 30;

const RESUMO_STATUS_KEYS = ['rascunho', 'sequenciada', 'confirmada', 'em_producao'];
const RESUMO_STATUS = RESUMO_STATUS_KEYS.map((key) => ({
  key,
  label: statusLabels[key] || key,
  color: key === 'rascunho' ? '#8c8c8c' : key === 'sequenciada' ? '#1890ff' : key === 'confirmada' ? '#385E9D' : '#d46b08',
}));

const Dashboard = () => {
  const [opsResumo, setOpsResumo] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [weekRange, setWeekRange] = useState([dayjs().startOf('week'), dayjs().endOf('week')]);
  const [alertas, setAlertas] = useState([]);
  const [hoveredFilaId, setHoveredFilaId] = useState(null);
  const [hoveredAlertaId, setHoveredAlertaId] = useState(null);

  useEffect(() => {
    OrdemProducaoService.getDadosDashboard().then((res) => {
      if (res.success && res.data && res.data.opsResumo) {
        setOpsResumo(res.data.opsResumo);
      }
    });
    RecursosProdutivosService.getAll().then((res) => {
      if (res.success && res.data && res.data.data) {
        setRecursos(res.data.data.map((r) => ({ nome: r.nome, carga: r.status === 'manutencao' ? 0 : 70, status: r.status })));
      }
    });
    AlertasService.getAll().then((res) => {
      if (res.success && res.data && res.data.data) {
        setAlertas(res.data.data);
      }
    });
  }, []);

  const totalOPs = opsResumo.length;
  const emProducao = opsResumo.filter((op) => op.status === 'em_producao').length;
  const hoje = new Date();
  const atrasadas = opsResumo.filter(
    (op) =>
      op.dataEntrega && new Date(op.dataEntrega) < hoje &&
      op.status !== 'concluida' &&
      op.status !== 'cancelada'
  ).length;
  const concluidas = opsResumo.filter((op) => op.status === 'concluida').length;
  const scoreMedia =
    totalOPs > 0
      ? Math.round(opsResumo.reduce((acc, op) => acc + (op.score || 0), 0) / totalOPs)
      : 0;

  const opsUrgentes = useMemo(
    () =>
      opsResumo
        .filter((op) => op.status !== 'concluida' && op.status !== 'cancelada')
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5),
    [opsResumo]
  );

  const opsEmProducao = useMemo(
    () => opsResumo.filter((op) => op.status === 'em_producao'),
    [opsResumo]
  );
  const programadoHoje = useMemo(
    () => opsEmProducao.reduce((acc, op) => acc + (op.quantidadeKg || 0) / 1000, 0),
    [opsEmProducao]
  );
  const casaHoje = useMemo(
    () => opsEmProducao.filter((op) => op.tipo === 'casa').reduce((acc, op) => acc + (op.quantidadeKg || 0) / 1000, 0),
    [opsEmProducao]
  );
  const clienteHoje = programadoHoje - casaHoje;
  const capacidadePct = Math.min(Math.round((programadoHoje / CAPACIDADE_TOTAL) * 100), 100);

  const alertasUrgentesCount = alertas.filter((a) => a.tipo === 'urgente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
        <Title level={4} style={{ margin: 0, color: colors.text.primary }}>
          Dashboard do Planejador
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Visão geral do sequenciamento de produção
        </Text>
        </div>

        <Space size="middle" wrap>
                  <DatePicker.RangePicker
                    value={weekRange}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) setWeekRange([dates[0], dates[1]]);
                    }}
                    format="DD/MM/YYYY"
                    placeholder={['Início', 'Fim']}
                    style={{ width: 240 }}
                  />
                
                </Space>
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
      <Col xs={24} lg={24}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ height: '100%' }}
          >
            <LayoutCard
              header={
                <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChartOutlined style={{ color: colors.primary }} />
                  Capacidade Diária
                </Title>
              }
              style={{ height: '100%', marginBottom: 0 }}
            >
              <div style={{ padding: ' 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                  <Text style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>
                    {programadoHoje.toFixed(1)}{' '}
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>/ {CAPACIDADE_TOTAL} ton</Text>
                  </Text>
                  <Tag
                    color={
                      capacidadePct > 90 ? 'error' : capacidadePct > 70 ? 'warning' : 'success'
                    }
                    style={{ margin: 0 }}
                  >
                    {capacidadePct}%
                  </Tag>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 6,
                    background: colors.backgroundGray,
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((casaHoje / CAPACIDADE_TOTAL) * 100)}%`,
                      height: '100%',
                      background: colors.primary,
                      transition: 'width 0.3s',
                    }}
                  />
                  <div
                    style={{
                      width: `${Math.round((clienteHoje / CAPACIDADE_TOTAL) * 100)}%`,
                      height: '100%',
                      background: '#385E9D',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 8, borderRadius: 2, background: colors.primary }} />
                    <Text type="secondary">Casa: {casaHoje.toFixed(1)} ton</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 8, borderRadius: 2, background: '#385E9D' }} />
                    <Text type="secondary">Cliente: {clienteHoje.toFixed(1)} ton</Text>
                  </div>
                </div>
              </div>
            </LayoutCard>
          </motion.div>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Fila prioritária */}
        <Col xs={24} lg={16}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ height: '100%' }}
          >
            <LayoutCard
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Title level={5} style={{ margin: 0 }}>Top OPs urgentes</Title>
                  <Link to="/ordem-producao/cadastro" style={{ fontSize: 9, color: colors.primary }}>
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
                    onMouseEnter={() => setHoveredFilaId(op.id)}
                    onMouseLeave={() => setHoveredFilaId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: i < opsUrgentes.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: hoveredFilaId === op.id ? '#fafafa' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Text type="secondary" style={{ width: 20, fontFamily: 'monospace', fontSize: 9 }}>
                        {i + 1}
                      </Text>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: 13 }}>
                          {op.codigo}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 9 }}>
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
          </motion.div>
        </Col>

        {/* Alertas */}
        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ height: '100%' }}
          >
            <LayoutCard
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BellOutlined style={{ color: colors.primary }} />
                    Alertas
                    {alertasUrgentesCount > 0 && (
                      <Tag color="error" style={{ fontSize: 9, lineHeight: '16px', padding: '0px' }}>
                        {alertasUrgentesCount}
                      </Tag>
                    )}
                  </Title>
                </div>
              }
              style={{ height: '100%' }}
            >
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {alertas.map((alerta, idx) => (
                  <div
                    key={alerta.id}
                    onMouseEnter={() => setHoveredAlertaId(alerta.id)}
                    onMouseLeave={() => setHoveredAlertaId(null)}
                    style={{
                      padding: '12px 16px',
                      borderLeft: `4px solid ${colors.primary}`,
                      backgroundColor: colors.white,
                      borderBottom: idx < alertas.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Text style={{ fontSize: 9, display: 'block', lineHeight: 1.5 }}>{alerta.msg}</Text>
                    <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>{alerta.tempo} atrás</Text>
                  </div>
                ))}
              </div>
            </LayoutCard>
          </motion.div>
        </Col>
      </Row>

    
      <Row gutter={[24, 24]}>
        {/* Capacidade Diária */}
      

        {/* Status dos Recursos */}
        <Col xs={24} lg={24}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ height: '100%' }}
          >
            <LayoutCard
              header={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Title level={5} style={{ margin: 0 }}>Status dos Recursos</Title>
                  <Link to="/recursos-produtivos" style={{ fontSize: 9, color: colors.primary }}>
                    Gerenciar →
                  </Link>
                </div>
              }
              style={{ height: '100%' }}
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {recursos.map((r) => (
                  <Col xs={24} sm={12} md={8} flex="1 1 0" key={r.nome} style={{ minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13 }} ellipsis>{r.nome}</Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: r.status === 'operando' ? '#52c41a' : '#ff4d4f',
                            flexShrink: 0,
                            marginLeft: 8,
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
                      />
                    </div>
                  </Col>
                ))}
              </Row>

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
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: colors.text.secondary,
                    marginBottom: 12,
                  }}
                >
                  Resumo por Status
                </Text>
                <Row gutter={[24, 8]} align="middle">
                  {RESUMO_STATUS.map((s) => {
                    const count = opsResumo.filter((o) => o.status === s.key).length;
                    return (
                      <Col flex="1 1 0" key={s.key} style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: s.color,
                                flexShrink: 0,
                              }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                              {s.label}
                            </Text>
                          </div>
                          <Text strong style={{ fontFamily: 'monospace', fontSize: 12, flexShrink: 0, minWidth: 24, textAlign: 'right' }}>
                            {count}
                          </Text>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </LayoutCard>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
