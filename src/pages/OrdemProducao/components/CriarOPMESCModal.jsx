import { Button, DatePicker, Form, Input, message, Modal, Select, Space, Tag, Typography } from 'antd';
import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { DynamicForm } from '../../../components';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import FerramentasService from '../../../services/ferramentasService';
import ItensService from '../../../services/itensService';

const { Text } = Typography;

const CriarOPMESCModal = ({ open, onClose, opPaiId, opPaiRecord, onSuccess }) => {
  const [form] = Form.useForm();
  const [saldo, setSaldo] = useState(null);
  const [opPaiResumo, setOpPaiResumo] = useState(null);
  const [opPaiDisplay, setOpPaiDisplay] = useState(null);
  const [itemMatch, setItemMatch] = useState(null);
  const [ferramentasOptions, setFerramentasOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const quantidadeAProduzir = Form.useWatch('quantidadeAProduzir', form) ?? 0;
  const isManual = opPaiId == null && !opPaiRecord;

  const unidade = opPaiResumo?.useKg ? 'kg' : 'peças';
  const perdaPct = itemMatch ? (itemMatch.percentual_perda ?? itemMatch.percentualPerda ?? 0) : 0;
  const qtdIdeal = perdaPct > 0 && quantidadeAProduzir > 0 ? Math.ceil(Number(quantidadeAProduzir) / (1 - perdaPct / 100)) : 0;

  useEffect(() => {
    if (!open) return;
    FerramentasService.getAll({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.data?.data) {
        setFerramentasOptions(res.data.data.map((f) => ({ value: f.id, label: `${f.codigo} - ${f.descricao || ''}` })));
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSaldo(null);
      setOpPaiResumo(null);
      setOpPaiDisplay(null);
      setItemMatch(null);
      return;
    }
    if (isManual) {
      setSaldo(null);
      setOpPaiResumo(null);
      setOpPaiDisplay(null);
      setItemMatch(null);
      form.setFieldsValue({ dataOP: dayjs(), situacao: 'Em cadastro' });
      return;
    }
    const id = opPaiId ?? opPaiRecord?.id;
    if (opPaiRecord) {
      setOpPaiDisplay({
        codigo: opPaiRecord.numeroOPERP || opPaiRecord.codigo || '',
        produto: opPaiRecord.produto || opPaiRecord.itens?.[0]?.item?.descricao || '',
      });
    }
    if (!id) return;
    setLoading(true);
    OrdemProducaoService.getById(id)
      .then((res) => {
        const pai = res?.data?.data ?? res?.data;
        if (res?.success && pai) {
          setOpPaiDisplay((prev) => prev || {
            codigo: pai.numeroOPERP || pai.codigo || '',
            produto: pai.produto || pai.itens?.[0]?.item?.descricao || '',
          });
          const itens = pai.itens || [];
          const total = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
          const programada = pai.qtdProgramada != null ? Number(pai.qtdProgramada) : 0;
          const saldoVal = Math.max(0, total - programada);
          const totalKg = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadeKg) || 0), 0);
          const useKg = totalKg > 0;
          setSaldo(saldoVal);
          setOpPaiResumo({
            total,
            programada,
            saldo: saldoVal,
            totalKg,
            useKg,
          });
          form.setFieldsValue({ quantidadeAProduzir: saldoVal, dataOP: dayjs(), situacao: 'Em cadastro', numeroOPERP: pai.numeroOPERP || '' });
          if (pai.liga && pai.tempera) {
            ItensService.getAll({ liga: pai.liga, tempera: pai.tempera, pageSize: 1 })
              .then((r) => {
                const list = r?.data?.data ?? [];
                setItemMatch(list[0] || null);
              })
              .catch(() => setItemMatch(null));
          } else {
            setItemMatch(null);
          }
        }
      })
      .catch(() => {
        setSaldo(null);
        setOpPaiResumo(null);
        setItemMatch(null);
      })
      .finally(() => setLoading(false));
    form.setFieldsValue({ dataOP: dayjs(), situacao: 'Em cadastro' });
  }, [open, opPaiId, opPaiRecord, isManual, form]);

  useEffect(() => {
    if (open && !isManual && opPaiResumo?.saldo != null) {
      form.setFieldsValue({ quantidadeAProduzir: opPaiResumo.saldo });
    }
  }, [open, isManual, opPaiResumo?.saldo, form]);

  const formConfig = useMemo(
    () => [
      {
        title: isManual ? 'Criar OP Manual (sem pai Totvs)' : 'Criar OP MESC',
        columns: 2,
        questions: [
          ...(isManual
            ? [
                {
                  type: 'select',
                  id: 'tipo',
                  required: true,
                  placeholder: 'Selecione o tipo',
                  label: 'Tipo',
                  options: [
                    { label: 'Casa', value: 'casa' },
                    { label: 'Cliente', value: 'cliente' },
                  ],
                },
                {
                  type: 'checkbox',
                  id: 'contingencia',
                  required: false,
                  label: 'Marcar OP como Contingência',
                },
              ]
            : []),
          { type: 'text', id: 'numeroOPERP', required: true, placeholder: 'Número da OP do ERP', label: 'Número da OP (EMS/TOTVS)' },
          { type: 'date', id: 'dataOP', required: true, placeholder: 'Data', label: 'Data do Registro', format: 'DD/MM/YYYY' },
          {
            type: 'select',
            id: 'ferramentaId',
            required: true,
            placeholder: 'Selecione a ferramenta',
            label: 'Ferramenta disponível',
            options: ferramentasOptions,
            showSearch: true,
            filterOption: (input, opt) => (opt?.label ?? '').toLowerCase().includes((input || '').toLowerCase()),
          },
          {
            type: 'select',
            id: 'situacao',
            required: true,
            placeholder: 'Situação',
            label: 'Situação',
            options: [
              { label: 'Em cadastro', value: 'Em cadastro' },
              { label: 'Liberada', value: 'Liberada' },
              { label: 'Programada', value: 'Programada' },
              { label: 'Encerrada', value: 'Encerrada' },
              { label: 'Cancelada', value: 'Cancelada' },
            ],
          },
          {
            type: 'integer',
            id: 'quantidadeAProduzir',
            required: false,
            placeholder: 'Quantidade (parcial permitida)',
            label: `Quantidade a programar (${opPaiResumo?.useKg ? 'kg' : 'peças'})`,
          },
          { type: 'textarea', id: 'observacoes', required: false, placeholder: 'Observações', label: 'Observações' },
        ],
      },
    ],
    [isManual, ferramentasOptions, opPaiResumo?.useKg]
  );

  const handleSubmit = useCallback(
    async (values) => {
      const id = opPaiId ?? opPaiRecord?.id;
      if (!isManual && !id) {
        message.error('OP Totvs não informada.');
        return;
      }
      if (!isManual && (values.quantidadeAProduzir == null || Number(values.quantidadeAProduzir) <= 0)) {
        message.error('Informe uma quantidade válida para programar.');
        return;
      }
      try {
        const serializeDate = (v) => (!v ? null : typeof v === 'string' ? v : dayjs(v).format('YYYY-MM-DD'));
        let opPai = opPaiRecord || null;
        if (!isManual && id && !opPai) {
          const resPai = await OrdemProducaoService.getById(id);
          if (resPai?.success) opPai = resPai?.data?.data ?? resPai?.data;
        }
        const quantidade = values.quantidadeAProduzir ?? (opPai?.itens?.[0]?.quantidadePecas ?? 0);
        const itensPai = opPai?.itens || [];
        const itensFilha = itensPai.length
          ? itensPai.map((item, idx) => ({
              ...item,
              id: item.id ?? idx + 1,
              quantidadePecas: idx === 0 ? quantidade : (item.quantidadePecas ?? 0),
            }))
          : [{ quantidadePecas: quantidade, itemId: values.ferramentaId }];
        const ordemData = {
          tipoOp: 'FILHA',
          opPaiId: isManual ? null : id,
          numeroOPERP: values.numeroOPERP || '',
          dataOP: serializeDate(values.dataOP),
          situacao: values.situacao || 'Em cadastro',
          cliente: opPai?.cliente || {},
          numeroPedidoCliente: opPai?.numeroPedidoCliente ?? '',
          observacoes: values.observacoes || '',
          itens: itensFilha,
          informacoesComplementares: {},
          ativo: true,
          ferramentaId: values.ferramentaId,
          ...(isManual && {
            tipo: values.tipo || 'cliente',
            contingencia: !!values.contingencia,
          }),
        };
        const response = await OrdemProducaoService.upsert(ordemData);
        if (response.success) {
          message.success(isManual ? 'OP Manual cadastrada com sucesso!' : 'OP MESC cadastrada com sucesso!');
          onSuccess?.();
          onClose?.();
          form.resetFields();
        } else {
          message.error(response.message || 'Erro ao cadastrar.');
        }
      } catch (error) {
        message.error('Erro ao cadastrar OP.');
        console.error(error);
      }
    },
    [opPaiId, opPaiRecord, isManual, onSuccess, onClose, form]
  );

  const renderCriarOPMESCBody = () => {
    if (isManual) {
      return (
        <>
          <div style={{ marginBottom: 12 }}>
            <Tag color="blue">OP Manual</Tag>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>Sem vínculo com OP Totvs</Text>
          </div>
          <DynamicForm
            formConfig={formConfig}
            formInstance={form}
            onSubmit={handleSubmit}
            onClose={onClose}
            submitText="Criar OP Manual"
            submitOnSide={true}
          />
        </>
      );
    }
    if (loading) {
      return <div style={{ padding: 24, textAlign: 'center', color: 'rgba(0,0,0,0.65)' }}>A carregar...</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {opPaiDisplay && (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
            OP Totvs: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{opPaiDisplay.codigo}</span> — {opPaiDisplay.produto}
          </p>
        )}
        {opPaiResumo != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>
            <span>Total: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'rgba(0,0,0,0.88)' }}>{opPaiResumo.useKg ? `${opPaiResumo.totalKg.toLocaleString('pt-BR')} kg` : `${opPaiResumo.total.toLocaleString('pt-BR')} peças`}</span></span>
            <span>Programada: <span style={{ fontFamily: 'monospace', color: 'rgba(0,0,0,0.88)' }}>{opPaiResumo.programada.toLocaleString('pt-BR')} peças</span></span>
            <span>Saldo: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: opPaiResumo.saldo > 0 ? '#52c41a' : '#faad14' }}>{opPaiResumo.saldo.toLocaleString('pt-BR')} peças</span></span>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="quantidadeAProduzir" label={`Quantidade a programar (${unidade})`}>
            <Input type="number" min={0} placeholder="Quantidade (parcial permitida)" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          {saldo != null && Number(quantidadeAProduzir) > saldo && saldo > 0 && (
            <p style={{ margin: '0 0 12px', fontSize: 11, color: '#faad14', display: 'flex', alignItems: 'center', gap: 4 }}>
              <WarningOutlined style={{ fontSize: 12 }} /> Excede o saldo disponível em {(Number(quantidadeAProduzir) - saldo).toLocaleString('pt-BR')} {unidade}
            </p>
          )}
          {perdaPct > 0 && Number(quantidadeAProduzir) > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 12px',
                marginBottom: 12,
                borderRadius: 6,
                background: 'rgba(22, 119, 255, 0.05)',
                border: '1px solid rgba(22, 119, 255, 0.2)',
              }}
            >
              <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14, marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.88)' }}>
                <p style={{ margin: 0 }}>Item com <span style={{ fontWeight: 600, color: '#1677ff' }}>{perdaPct}% de perda</span> cadastrada</p>
                <p style={{ margin: '4px 0 0', color: 'rgba(0,0,0,0.65)' }}>Quantidade solicitada: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>{Number(quantidadeAProduzir).toLocaleString('pt-BR')} {unidade}</span></p>
                <p style={{ margin: '2px 0 0', color: 'rgba(0,0,0,0.65)' }}>Quantidade ideal a produzir: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1677ff' }}>{qtdIdeal.toLocaleString('pt-BR')} {unidade}</span></p>
              </div>
            </div>
          )}
          <Form.Item name="ferramentaId" label="Ferramenta disponível" rules={[{ required: true, message: 'Selecione a ferramenta' }]}>
            <Select placeholder="Selecione a ferramenta" options={ferramentasOptions} showSearch optionFilterProp="label" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="numeroOPERP" label="Número da OP (EMS/TOTVS)" rules={[{ required: true }]}>
            <Input placeholder="Número da OP do ERP" />
          </Form.Item>
          <Form.Item name="dataOP" label="Data do Registro" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="situacao" label="Situação" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'Em cadastro', value: 'Em cadastro' },
                { label: 'Liberada', value: 'Liberada' },
                { label: 'Programada', value: 'Programada' },
                { label: 'Encerrada', value: 'Encerrada' },
                { label: 'Cancelada', value: 'Cancelada' },
              ]}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea placeholder="Observações" rows={2} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" htmlType="submit" disabled={Number(quantidadeAProduzir) <= 0}>
              Criar OP MESC
            </Button>
          </div>
        </Form>
      </div>
    );
  };

  return (
    <Modal
      title={isManual ? 'Criar OP Manual' : 'Criar OP MESC'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={isManual ? 720 : 480}
      destroyOnClose
    >
      {renderCriarOPMESCBody()}
    </Modal>
  );
};

export default CriarOPMESCModal;
