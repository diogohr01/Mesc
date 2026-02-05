import React, { memo, useCallback, useEffect, useState } from 'react';
import { Card, Col, Layout, Row, Space, Typography } from 'antd';
import { LoadingSpinner } from '../../components';
import FornoService from '../../services/fornoService';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Text } = Typography;

const STATUS = {
  ABAIXO_MIN: 'abaixo_min',   // vermelho: tempo < mínimo
  IDEAL: 'ideal',             // verde: mínimo <= tempo <= máximo
  ACIMA_MAX: 'acima_max',     // amarelo: tempo > máximo
};

const getStatus = (tempoDecorridoMin, tempoMin, tempoMax) => {
  if (tempoDecorridoMin < tempoMin) return STATUS.ABAIXO_MIN;
  if (tempoDecorridoMin > tempoMax) return STATUS.ACIMA_MAX;
  return STATUS.IDEAL;
};

const getStatusColor = (status) => {
  switch (status) {
    case STATUS.ABAIXO_MIN: return { border: '#ff4d4f', bg: '#fff2f0' };
    case STATUS.IDEAL: return { border: '#52c41a', bg: '#f6ffed' };
    case STATUS.ACIMA_MAX: return { border: '#faad14', bg: '#fffbe6' };
    default: return { border: '#d9d9d9', bg: '#fafafa' };
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case STATUS.ABAIXO_MIN: return 'Abaixo do mínimo';
    case STATUS.IDEAL: return 'Ideal';
    case STATUS.ACIMA_MAX: return 'Atenção (acima do máximo)';
    default: return '-';
  }
};

const FornoCard = memo(({ item }) => {
  const [now, setNow] = useState(() => dayjs());
  const dataEntrada = dayjs(item.data_entrada);
  const tempoDecorridoMin = now.diff(dataEntrada, 'minute');
  const tempoMin = item.tempo_previsto_min ?? 0;
  const tempoMax = item.tempo_previsto_max ?? 0;
  const status = getStatus(tempoDecorridoMin, tempoMin, tempoMax);
  const colors = getStatusColor(status);

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60000); // atualiza a cada 1 min
    return () => clearInterval(t);
  }, []);

  const tempoDecorridoStr = tempoDecorridoMin >= 60
    ? `${Math.floor(tempoDecorridoMin / 60)}h ${tempoDecorridoMin % 60}min`
    : `${tempoDecorridoMin} min`;

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{item.cod_ferramenta}</Text>
          <Text type="secondary">{item.descricao_ferramenta}</Text>
        </Space>
      }
      style={{ borderLeft: `4px solid ${colors.border}`, backgroundColor: colors.bg }}
    >
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Text type="secondary">Entrada: </Text>
          <Text>{dataEntrada.format('DD/MM/YYYY HH:mm')}</Text>
        </Col>
        <Col span={24}>
          <Text type="secondary">Tempo decorrido: </Text>
          <Text strong>{tempoDecorridoStr}</Text>
        </Col>
        <Col span={24}>
          <Text type="secondary">Faixa (min–max): </Text>
          <Text>{tempoMin} – {tempoMax} min</Text>
        </Col>
        <Col span={24}>
          <Text type="secondary">Status: </Text>
          <Text style={{ color: colors.border, fontWeight: 500 }}>{getStatusLabel(status)}</Text>
        </Col>
      </Row>
    </Card>
  );
});

FornoCard.displayName = 'FornoCard';

const GestaoForno = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FornoService.getAll();
      const data = res?.data?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Content style={{ padding: 24 }}>
      <Typography.Title level={4}>Gestão de Forno</Typography.Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Ferramentas em forno: status por tempo (vermelho &lt; mínimo, verde ideal, amarelo &gt; máximo).
      </Text>
      <Row gutter={[16, 16]}>
        {list.length === 0 ? (
          <Col span={24}>
            <Card><Text type="secondary">Nenhuma ferramenta em forno no momento.</Text></Card>
          </Col>
        ) : (
          list.map((item, idx) => (
            <Col key={item.cod_ferramenta || idx} xs={24} sm={12} md={8} lg={6}>
              <FornoCard item={item} />
            </Col>
          ))
        )}
      </Row>
    </Content>
  );
};

export default memo(GestaoForno);
