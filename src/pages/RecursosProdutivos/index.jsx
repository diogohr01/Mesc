import React, { useEffect, useMemo, useState } from 'react';
import { Col, Row, Typography } from 'antd';
import { CheckCircleOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Card } from '../../components';
import { useFilterSearchContext } from '../../contexts/FilterSearchContext';
import RecursosProdutivosService from '../../services/recursosProdutivosService';
import { colors } from '../../styles/colors';

const { Text } = Typography;

const RecursosProdutivos = () => {
  const [recursos, setRecursos] = useState([]);
  const { searchTerm } = useFilterSearchContext();

  useEffect(() => {
    RecursosProdutivosService.getAll().then((res) => {
      if (res.success && res.data && res.data.data) {
        setRecursos(res.data.data);
      }
    });
  }, []);

  const filteredRecursos = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return recursos;
    return recursos.filter(
      (r) =>
        (r.nome && r.nome.toLowerCase().includes(term)) ||
        (r.tipo && r.tipo.toLowerCase().includes(term))
    );
  }, [recursos, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
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
        <Text type="secondary" style={{ fontSize: 12 }}>
          Máquinas, matrizes e linhas de produção
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {filteredRecursos.map((recurso) => (
          <Col key={recurso.id} xs={24} sm={12} md={8} lg={6}>
            <RecursoCard recurso={recurso} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

function RecursoCard({ recurso }) {
  const isManutencao = recurso.status === 'manutencao' || recurso.status === 'manutenção';
  const capacidadeStr =
    recurso.capacidade != null && recurso.unidade
      ? `${recurso.capacidade} ${recurso.unidade}`
      : '-';

  const statusNode =
    recurso.status === 'operando' ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#52c41a', fontSize: 10, fontWeight: 500 }}>
        <CheckCircleOutlined />
        Operando
      </span>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff4d4f', fontSize: 10, fontWeight: 500 }}>
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
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        {recurso.tipo}
      </Text>
      <Text
        type="secondary"
        style={{
          display: 'block',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 4,
        }}
      >
        CAPACIDADE
      </Text>
      <Text strong style={{ fontSize: 15 }}>
        {capacidadeStr}
      </Text>
      {(recurso.previsaoRetorno || recurso.previsao_retorno) && (
        <>
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 12, marginBottom: 4 }}
          >
            Previsão de retorno
          </Text>
          <Text style={{ fontSize: 13 }}>
            {dayjs(recurso.previsaoRetorno || recurso.previsao_retorno).format('DD/MM/YYYY HH:mm')}
          </Text>
        </>
      )}
    </Card>
  );
}

export default RecursosProdutivos;
