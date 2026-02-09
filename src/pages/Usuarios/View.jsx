import React, { memo } from 'react';
import { Button, Col, Layout, Row, Space, Tag, Typography } from 'antd';
import { Card } from '../../components';
import { AiOutlineArrowLeft } from 'react-icons/ai';

const { Content } = Layout;
const { Text } = Typography;

const View = ({ record, onCancel }) => {
  if (!record) return null;

  const formConfig = [
    {
      sectionTitle: 'Dados do usuário',
      questions: [
        { id: 'nome', label: 'Nome', type: 'text', value: record.nome },
        { id: 'email', label: 'E-mail', type: 'text', value: record.email },
        { id: 'perfil', label: 'Perfil', type: 'text', value: record.perfil },
        {
          id: 'modulos',
          label: 'Módulos',
          render: () =>
            Array.isArray(record.modulos) ? (
              <Space size={[0, 4]} wrap>
                {record.modulos.map((m) => (
                  <Tag key={m}>{m}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">-</Text>
            ),
        },
      ],
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<AiOutlineArrowLeft />} onClick={onCancel}>
            Voltar
          </Button>
        </Space>
        <Card title="Usuário">
          {formConfig.map((section) => (
            <div key={section.sectionTitle} style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>{section.sectionTitle}</Text>
              <Row gutter={[16, 8]}>
                {section.questions.map((q) => (
                  <Col xs={24} sm={12} md={8} key={q.id}>
                    <Text type="secondary">{q.label}: </Text>
                    {q.render ? q.render() : <Text>{q.value ?? '-'}</Text>}
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Card>
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          Integração com API Identity será feita em fase futura. Dados exibidos são mockados.
        </Text>
      </Content>
    </Layout>
  );
};

export default memo(View);
