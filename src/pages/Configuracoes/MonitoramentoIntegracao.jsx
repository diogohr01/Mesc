import React from 'react';
import { Typography } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { Card } from '../../components';
import { colors } from '../../styles/colors';

const { Title, Text } = Typography;

const MonitoramentoIntegracao = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <Title level={4} style={{ margin: 0, color: colors.text?.primary || '#262626', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ApiOutlined style={{ color: colors.primary }} />
        Monitoramento de Integração
      </Title>
      <Text type="secondary" style={{ fontSize: 13 }}>
        Acompanhamento de integrações com sistemas externos
      </Text>
    </div>
    <Card variant="borderless" title="Em construção" subtitle="Esta tela será implementada em breve.">
      <Text type="secondary">Módulo de monitoramento de integração em desenvolvimento.</Text>
    </Card>
  </div>
);

export default MonitoramentoIntegracao;
