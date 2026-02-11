import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Form, Input, Layout, message, Row, Slider, Space, Typography } from 'antd';
import { HolderOutlined, RollbackOutlined, SlidersOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Loading } from '../../../components';
import { AiOutlineArrowLeft, AiOutlineSave } from 'react-icons/ai';
import { toast } from '../../../helpers/toast';
import SequenciamentoService from '../../../services/sequenciamentoService';
import criteriosScoreMock from '../../../mocks/configuracoes/criteriosScore.json';
import { colors } from '../../../styles/colors';

const { Content } = Layout;
const { Text } = Typography;

const CRITERIOS_PADRAO = (criteriosScoreMock.data || []).map((c) => ({ ...c }));

function CriterioRow({ item, index, onValueChange }) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 6,
            border: `1px solid ${colors.backgroundGray}`,
            backgroundColor: snapshot.isDragging ? colors.backgroundGray : colors.background,
            boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
            userSelect: 'none',
            ...provided.draggableProps.style,
          }}
        >
          <span
            {...provided.dragHandleProps}
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
            title="Arraste para reordenar"
          >
            <HolderOutlined style={{ color: colors.text.secondary, fontSize: 16 }} />
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'monospace',
              color: colors.text.secondary,
              width: 20,
              flexShrink: 0,
            }}
          >
            {index + 1}.
          </span>
          <span
            style={{
              fontSize: 14,
              color: colors.text.primary,
              width: 140,
              flexShrink: 0,
            }}
          >
            {item.label}
          </span>
          <div
            style={{ flex: 1, minWidth: 0, padding: '0 8px' }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Slider
              min={0}
              max={50}
              value={item.value}
              onChange={(v) => onValueChange(item.id, v)}
              style={{ margin: 0 }}
            />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.primary,
              width: 36,
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {item.value}%
          </span>
        </div>
      )}
    </Draggable>
  );
}

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [criterios, setCriterios] = useState([]);

  const total = criterios.reduce((s, c) => s + c.value, 0);

  const handleValueChange = useCallback((id, newValue) => {
    setCriterios((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: newValue } : c))
    );
  }, []);

  const handleReset = useCallback(() => {
    setCriterios(CRITERIOS_PADRAO.map((c) => ({ ...c })));
    toast.success('Pesos resetados', 'Valores restaurados ao padrão.');
  }, []);

  const handleNormalize = useCallback(() => {
    if (total === 0) return;
    const factor = 100 / total;
    setCriterios((prev) => {
      const normalized = prev.map((c) => ({
        ...c,
        value: Math.round(c.value * factor),
      }));
      const sum = normalized.reduce((s, c) => s + c.value, 0);
      const diff = 100 - sum;
      if (diff !== 0 && normalized.length) {
        normalized[0].value += diff;
      }
      return normalized;
    });
    toast.success('Pesos normalizados', 'Total ajustado para 100%.');
  }, [total]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    setCriterios((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  }, []);

  const fetchRecordData = useCallback(async (recordId) => {
    setLoading(true);
    try {
      const result = await SequenciamentoService.getById(recordId);
      if (result.success && result.data?.data) {
        const r = result.data.data;
        form.setFieldsValue({
          nome: r.nome || '',
          descricao: r.descricao || '',
        });
        setCriterios(
          Array.isArray(r.criterios) && r.criterios.length
            ? r.criterios.map((c) => ({ id: c.id, label: c.label, value: c.value ?? 0 }))
            : CRITERIOS_PADRAO.map((c) => ({ ...c }))
        );
      }
    } catch (error) {
      message.error('Erro ao buscar o registro.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    if (editingRecord?.id) {
      setCriterios([]);
      fetchRecordData(editingRecord.id);
    } else {
      form.resetFields();
      setCriterios(CRITERIOS_PADRAO.map((c) => ({ ...c })));
    }
  }, [editingRecord, fetchRecordData, form]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (total !== 100) {
        message.warning('A soma dos pesos dos critérios deve ser 100%. Use "Normalizar" se desejar ajustar automaticamente.');
        return;
      }
      setLoading(true);
      const payload = {
        id: editingRecord?.id,
        nome: values.nome?.trim() || '',
        descricao: values.descricao?.trim() || '',
        criterios: criterios.map((c) => ({ id: c.id, label: c.label, value: c.value })),
      };
      const response = await SequenciamentoService.upsert(payload);
      if (response.success) {
        message.success(editingRecord ? 'Cenário atualizado com sucesso!' : 'Cenário criado com sucesso!');
        onSave();
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error('Erro ao salvar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [editingRecord, form, criterios, total, onSave]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title={editingRecord ? 'Editar Cenário' : 'Novo Cenário'}
              extra={
                <Button
                  type="default"
                  icon={<AiOutlineArrowLeft />}
                  onClick={onCancel}
                  disabled={loading}
                  size="middle"
                >
                  Voltar
                </Button>
              }
            >
              {loading && !criterios.length ? (
                <Loading />
              ) : (
                <div style={{ padding: '16px 0' }}>
                  <Form form={form} layout="vertical" style={{ marginBottom: 24 }}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="nome"
                          label="Nome"
                          rules={[{ required: true, message: 'Informe o nome.' }]}
                        >
                          <Input placeholder="Ex.: Foco em Entrega" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="descricao" label="Descrição">
                          <Input placeholder="Ex.: Prioriza prazo de entrega" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>

                  <Card
                    title={
                      <Space>
                        <SlidersOutlined style={{ color: colors.primary }} />
                        <span>Pesos dos critérios</span>
                      </Space>
                    }
                    extra={
                      <Space wrap>
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
                        {total !== 100 && (
                          <Button type="default" size="small" onClick={handleNormalize}>
                            Normalizar
                          </Button>
                        )}
                        <Button type="text" size="small" icon={<RollbackOutlined />} onClick={handleReset}>
                          Reset
                        </Button>
                      </Space>
                    }
                    style={{ borderColor: colors.backgroundGray, marginBottom: 16 }}
                  >
                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
                      Arraste para reordenar a prioridade. Ajuste os sliders para alterar os pesos.
                    </Text>
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="criterios">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                          >
                            {criterios.map((item, index) => (
                              <CriterioRow
                                key={item.id}
                                item={item}
                                index={index}
                                onValueChange={handleValueChange}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Card>

                  <Space>
                    <Button type="primary" icon={<AiOutlineSave />} onClick={handleSave} loading={loading}>
                      Salvar Cenário
                    </Button>
                    <Button onClick={onCancel}>Cancelar</Button>
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default AddEdit;
