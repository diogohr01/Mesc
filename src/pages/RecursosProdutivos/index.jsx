import React from 'react';
import { Col, Row, Typography } from 'antd';
import { CheckCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { Card } from '../../components';
import { colors } from '../../styles/colors';

const { Text } = Typography;

const RECURSOS_MOCK = [
  { id: '1', nome: 'Prensa 01', tipo: 'Prensa de Extrusão', capacidade: 2200, unidade: 'ton', status: 'operando' },
  { id: '2', nome: 'Prensa 02', tipo: 'Prensa de Extrusão', capacidade: 1800, unidade: 'ton', status: 'operando' },
  { id: '3', nome: 'Prensa 03', tipo: 'Prensa de Extrusão', capacidade: 1200, unidade: 'ton', status: 'manutenção' },
  { id: '4', nome: 'Forno Homog. 01', tipo: 'Forno', capacidade: 30, unidade: 'ton', status: 'operando' },
  { id: '5', nome: 'Serra 01', tipo: 'Serra de Corte', capacidade: null, unidade: null, status: 'operando' },
];

const RecursosProdutivos = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ToolOutlined style={{ color: colors.primary }} />
          Recursos Produtivos
        </h2>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Máquinas, matrizes e linhas de produção
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {RECURSOS_MOCK.map((recurso) => (
          <Col key={recurso.id} xs={24} sm={12} md={8} lg={6}>
            <RecursoCard recurso={recurso} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

function RecursoCard({ recurso }) {
  const isManutencao = recurso.status === 'manutenção';
  const capacidadeStr =
    recurso.capacidade != null && recurso.unidade
      ? `${recurso.capacidade} ${recurso.unidade}`
      : '-';

  const statusNode =
    recurso.status === 'operando' ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52c41a', fontSize: 12, fontWeight: 500 }}>
        <CheckCircleOutlined />
        Operando
      </span>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff4d4f', fontSize: 12, fontWeight: 500 }}>
        <ToolOutlined />
        Manutenção
      </span>
    );

  return (
    <Card
      variant="borderless"
      size="small"
      title={recurso.nome}
      icon={<ToolOutlined style={{ color: colors.primary }} />}
      extra={statusNode}
      style={
        isManutencao
          ? { border: '1px solid #ff4d4f' }
          : {}
      }
    >
      <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
        {recurso.tipo}
      </Text>
      <Text
        type="secondary"
        style={{
          display: 'block',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 4,
        }}
      >
        CAPACIDADE
      </Text>
      <Text strong style={{ fontSize: 16 }}>
        {capacidadeStr}
      </Text>
    </Card>
  );
}

export default RecursosProdutivos;
