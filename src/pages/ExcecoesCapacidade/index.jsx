import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Layout, message, Modal, Row, Slider, Space, Table } from 'antd';
import { SlidersOutlined } from '@ant-design/icons';
import { AiOutlinePlus } from 'react-icons/ai';
import dayjs from 'dayjs';
import { ActionButtons, Card, LoadingSpinner } from '../../components';
import ExcecoesCapacidadeService, { CONFIG_CAPACIDADE } from '../../services/excecoesCapacidadeService';
import { colors } from '../../styles/colors';

const { Content } = Layout;

const ExcecoesCapacidade = () => {
  const [excecoes, setExcecoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ExcecoesCapacidadeService.getAll({ page: 1, pageSize: 500 });
      setExcecoes(response.data?.data || []);
    } catch (error) {
      message.error('Erro ao carregar exceções.');
      setExcecoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    form.setFieldsValue({
      data: null,
      casaPct: CONFIG_CAPACIDADE.casaPctPadrao,
      clientePct: CONFIG_CAPACIDADE.clientePctPadrao,
      motivo: '',
    });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback(
    async (record) => {
      setEditingRecord(record);
      form.setFieldsValue({
        data: record.data ? dayjs(record.data) : null,
        casaPct: record.casaPct ?? CONFIG_CAPACIDADE.casaPctPadrao,
        clientePct: record.clientePct ?? CONFIG_CAPACIDADE.clientePctPadrao,
        motivo: record.motivo || '',
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
      if (!dataStr || !values.motivo?.trim()) {
        message.error('Preencha data e motivo.');
        return;
      }
      setSaving(true);
      const response = await ExcecoesCapacidadeService.upsert({
        id: editingRecord?.id,
        data: dataStr,
        casaPct: values.casaPct ?? CONFIG_CAPACIDADE.casaPctPadrao,
        motivo: values.motivo.trim(),
      });
      if (response.success) {
        message.success(editingRecord ? 'Exceção atualizada com sucesso.' : 'Exceção de capacidade adicionada.');
        handleCloseModal();
        loadData();
      } else {
        message.error(response.message || 'Erro ao salvar.');
      }
    } catch (err) {
      if (err.errorFields) return;
      message.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [form, editingRecord, loadData, handleCloseModal]);

  const handleDelete = useCallback((record) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza de que deseja excluir esta exceção de capacidade?',
      okText: 'Sim',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        try {
          await ExcecoesCapacidadeService.delete(record.id);
          message.success('Exceção removida.');
          loadData();
        } catch (error) {
          message.error('Erro ao excluir exceção.');
        }
      },
    });
  }, [loadData]);

  const columns = useMemo(
    () => [
      {
        title: 'Data',
        dataIndex: 'data',
        key: 'data',
        width: 140,
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
      },
      {
        title: 'Casa %',
        dataIndex: 'casaPct',
        key: 'casaPct',
        width: 100,
        align: 'center',
        render: (v) => `${v ?? 0}%`,
      },
      {
        title: 'Cliente %',
        dataIndex: 'clientePct',
        key: 'clientePct',
        width: 100,
        align: 'center',
        render: (v) => `${v ?? 0}%`,
      },
      { title: 'Motivo', dataIndex: 'motivo', key: 'motivo', ellipsis: true },
      {
        title: 'Ações',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_, record) => (
          <ActionButtons
            onEdit={() => handleEdit(record)}
            onDelete={() => handleDelete(record)}
            showView={false}
            showCopy={false}
            showActivate={false}
            showDeactivate={false}
            size="small"
          />
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title="Exceções de Capacidade"
              icon={<SlidersOutlined />}
              subtitle={`Divisão Casa/Cliente por dia. Padrão: ${CONFIG_CAPACIDADE.casaPctPadrao}% Casa / ${CONFIG_CAPACIDADE.clientePctPadrao}% Cliente.`}
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
                locale={{ emptyText: 'Nenhuma exceção cadastrada' }}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          title={editingRecord ? 'Editar Exceção de Capacidade' : 'Nova Exceção de Capacidade'}
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
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            onValuesChange={(changed, all) => {
              if (changed.casaPct != null) form.setFieldValue('clientePct', 100 - all.casaPct);
            }}
          >
            <Form.Item name="data" label="Data" rules={[{ required: true, message: 'Obrigatório' }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="casaPct" label="% Casa" initialValue={CONFIG_CAPACIDADE.casaPctPadrao}>
              <Slider min={0} max={100} step={5} />
            </Form.Item>
            <Form.Item name="clientePct" label="% Cliente">
              <Input readOnly addonAfter="%" style={{ background: colors.backgroundGray }} />
            </Form.Item>
            <Form.Item name="motivo" label="Motivo" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Ex: Alta demanda interna" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ExcecoesCapacidade;
