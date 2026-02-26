import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Layout,
  message,
  Modal,
  Row,
  Select,
  Table,
  Tag,
} from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { AiOutlinePlus } from 'react-icons/ai';
import dayjs from 'dayjs';
import { ActionButtons, Card, LoadingSpinner } from '../../components';
import ExcecoesFerramentasService from '../../services/excecoesFerramentasService';
import FerramentasService from '../../services/ferramentasService';

const { Content } = Layout;

const ExcecoesFerramentas = () => {
  const [excecoes, setExcecoes] = useState([]);
  const [ferramentas, setFerramentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const loadExcecoes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ExcecoesFerramentasService.getAll({ page: 1, pageSize: 500 });
      setExcecoes(response.data?.data || []);
    } catch (error) {
      message.error('Erro ao carregar exceções.');
      setExcecoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFerramentas = useCallback(async () => {
    try {
      const response = await FerramentasService.getAll({ page: 1, pageSize: 500 });
      const list = response.data?.data ?? [];
      setFerramentas(Array.isArray(list) ? list : []);
    } catch (error) {
      setFerramentas([]);
    }
  }, []);

  useEffect(() => {
    loadExcecoes();
    loadFerramentas();
  }, [loadExcecoes, loadFerramentas]);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    form.setFieldsValue({
      ferramentaCodigo: undefined,
      quantidadeExtra: undefined,
      motivo: '',
      aprovadoPor: '',
      data: dayjs(),
    });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    (record) => {
      setEditingRecord(record);
      form.setFieldsValue({
        ferramentaCodigo: record.ferramentaCodigo || undefined,
        quantidadeExtra: record.quantidadeExtra,
        motivo: record.motivo || '',
        aprovadoPor: record.aprovadoPor || '',
        data: record.data ? dayjs(record.data) : dayjs(),
      });
      setModalOpen(true);
    },
    [form]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  }, [form]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const dataStr = values.data ? dayjs(values.data).format('YYYY-MM-DD') : null;
      if (!values.ferramentaCodigo || !values.quantidadeExtra || values.quantidadeExtra <= 0 || !values.motivo?.trim()) {
        message.error('Preencha ferramenta, quantidade extra e motivo.');
        return;
      }
      setSaving(true);
      const response = await ExcecoesFerramentasService.upsert({
        id: editingRecord?.id,
        ferramentaCodigo: values.ferramentaCodigo,
        quantidadeExtra: values.quantidadeExtra,
        motivo: values.motivo.trim(),
        aprovadoPor: (values.aprovadoPor || '').trim(),
        data: dataStr,
        ativo: editingRecord ? editingRecord.ativo : true,
      });
      if (response.success) {
        message.success(editingRecord ? 'Exceção atualizada com sucesso.' : 'Exceção de ferramenta adicionada.');
        handleCloseModal();
        loadExcecoes();
      } else {
        message.error(response.message || 'Erro ao salvar.');
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [form, editingRecord, loadExcecoes, handleCloseModal]);

  const handleToggleAtivo = useCallback(
    async (record) => {
      try {
        const response = await ExcecoesFerramentasService.upsert({
          ...record,
          ativo: !record.ativo,
        });
        if (response.success) {
          message.success('Status da exceção alterado.');
          loadExcecoes();
        } else {
          message.error(response.message || 'Erro ao alterar status.');
        }
      } catch (error) {
        message.error('Erro ao alterar status.');
      }
    },
    [loadExcecoes]
  );

  const handleDelete = useCallback(
    (record) => {
      Modal.confirm({
        title: 'Confirmar exclusão',
        content: 'Tem certeza de que deseja excluir esta exceção de ferramenta?',
        okText: 'Sim',
        okType: 'danger',
        cancelText: 'Não',
        onOk: async () => {
          try {
            await ExcecoesFerramentasService.delete(record.id);
            message.success('Exceção removida.');
            loadExcecoes();
          } catch (error) {
            message.error('Erro ao excluir exceção.');
          }
        },
      });
    },
    [loadExcecoes]
  );

  const ferramentaOptions = useMemo(() => {
    return (ferramentas || []).map((f) => ({
      value: f.codigo,
      label: `${f.codigo} — ${f.nitr_atual ?? 0}ª nitret. — Limite: ${f.nitr_limite ?? 0}`,
    }));
  }, [ferramentas]);

  const columns = useMemo(
    () => [
      {
        title: 'Ferramenta',
        dataIndex: 'ferramentaCodigo',
        key: 'ferramentaCodigo',
        width: 200,
        render: (codigo, record) => {
          const f = ferramentas.find((x) => x.codigo === codigo);
          return (
            <span>
              <span style={{ fontWeight: 600 }}>{codigo}</span>
              {f != null && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#8c8c8c' }}>
                  {f.nitr_atual ?? 0}ª nitret.
                </span>
              )}
            </span>
          );
        },
      },
      {
        title: 'Qtd Extra (kg)',
        dataIndex: 'quantidadeExtra',
        key: 'quantidadeExtra',
        width: 120,
        align: 'right',
        render: (v) => (v != null ? `+${Number(v).toLocaleString('pt-BR')} kg` : '-'),
      },
      { title: 'Motivo', dataIndex: 'motivo', key: 'motivo', ellipsis: true },
      { title: 'Aprovado por', dataIndex: 'aprovadoPor', key: 'aprovadoPor', width: 140, ellipsis: true },
      {
        title: 'Data',
        dataIndex: 'data',
        key: 'data',
        width: 110,
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
      },
      {
        title: 'Status',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        align: 'center',
        render: (ativo) => (
          <Tag color={ativo ? 'green' : 'default'}>{ativo ? 'Ativa' : 'Inativa'}</Tag>
        ),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_, record) => (
          <ActionButtons
            onEdit={() => handleEdit(record)}
            onDelete={() => handleDelete(record)}
            onActivate={() => handleToggleAtivo(record)}
            onDeactivate={() => handleToggleAtivo(record)}
            isActive={record.ativo}
            showView={false}
            showCopy={false}
            size="small"
          />
        ),
      },
    ],
    [ferramentas, handleEdit, handleDelete, handleToggleAtivo]
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Exceções de Ferramentas"
              icon={<SafetyOutlined />}
              subtitle="Autorize uso de ferramentas além do limite de nitretação"
              extra={
                <Button type="primary" icon={<AiOutlinePlus />} onClick={handleAdd} size="middle">
                  Nova Exceção
                </Button>
              }
            >
              <Table
                dataSource={excecoes}
                columns={columns}
                rowKey="id"
                loading={{ spinning: loading, indicator: <LoadingSpinner /> }}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
                locale={{ emptyText: 'Nenhuma exceção cadastrada.' }}
              />

              <div style={{ marginTop: 24 }}>
                <Card type="inner" title="Log de Auditoria" >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'monospace', color: '#8c8c8c', marginTop: 16 }}>
                    {excecoes.length === 0 ? (
                      <span>Nenhuma exceção cadastrada.</span>
                    ) : (
                      excecoes.map((exc) => (
                        <div key={exc.id}>
                          <span>{exc.data}</span>
                          <span> — </span>
                          <span>{exc.ferramentaCodigo}</span>
                          <span style={{ color: '#1890ff' }}> +{exc.quantidadeExtra}kg </span>
                          <span> por {exc.aprovadoPor || '-'} </span>
                          <span>({exc.motivo})</span>
                          <span style={exc.ativo ? { color: '#52c41a' } : {}}> [{exc.ativo ? 'ATIVA' : 'INATIVA'}]</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal
          title={editingRecord ? 'Editar Exceção de Ferramenta' : 'Nova Exceção de Ferramenta'}
          open={modalOpen}
          onCancel={handleCloseModal}
          footer={[
            <Button key="cancel" onClick={handleCloseModal}>
              Cancelar
            </Button>,
            <Button key="save" type="primary" onClick={() => form.submit()} loading={saving}>
              Salvar
            </Button>,
          ]}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="ferramentaCodigo" label="Ferramenta" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Select
                placeholder="Selecione..."
                allowClear
                showSearch
                optionFilterProp="label"
                options={ferramentaOptions}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="quantidadeExtra"
              label="Qtd Extra (kg)"
              rules={[{ required: true, message: 'Obrigatório' }, { type: 'number', min: 1, message: 'Mínimo 1' }]}
            >
              <InputNumber min={1} placeholder="250" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="motivo" label="Motivo" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Ex: Pedido urgente..." />
            </Form.Item>
            <Form.Item name="aprovadoPor" label="Aprovado por">
              <Input placeholder="Nome do aprovador" />
            </Form.Item>
            <Form.Item name="data" label="Data" rules={[{ required: true, message: 'Obrigatório' }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ExcecoesFerramentas;
