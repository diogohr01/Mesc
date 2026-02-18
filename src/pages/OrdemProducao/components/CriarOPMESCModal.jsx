import { Form, message, Modal, Tag, Typography } from 'antd';
import { DynamicForm } from '../../../components';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import FerramentasService from '../../../services/ferramentasService';

const { Text } = Typography;

const CriarOPMESCModal = ({ open, onClose, opPaiId, opPaiRecord, onSuccess }) => {
  const [form] = Form.useForm();
  const [saldo, setSaldo] = useState(null);
  const [ferramentasOptions, setFerramentasOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const isManual = opPaiId == null && !opPaiRecord;

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
      return;
    }
    if (isManual) {
      setSaldo(null);
      form.setFieldsValue({ dataOP: dayjs(), situacao: 'Em cadastro' });
      return;
    }
    const id = opPaiId ?? opPaiRecord?.id;
    if (!id) return;
    setLoading(true);
    OrdemProducaoService.getById(id)
      .then((res) => {
        if (res?.success && res?.data?.data) {
          const pai = res.data.data;
          const itens = pai.itens || [];
          const total = itens.reduce((sum, i) => sum + (parseFloat(i.quantidadePecas) || 0), 0);
          const programada = pai.qtdProgramada != null ? Number(pai.qtdProgramada) : 0;
          setSaldo(Math.max(0, total - programada));
        }
      })
      .catch(() => setSaldo(null))
      .finally(() => setLoading(false));
    form.setFieldsValue({ dataOP: dayjs(), situacao: 'Em cadastro' });
  }, [open, opPaiId, opPaiRecord, isManual, form]);

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
            label: 'Ferramenta',
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
            label: 'Quantidade a Produzir',
          },
          { type: 'textarea', id: 'observacoes', required: false, placeholder: 'Observações', label: 'Observações' },
        ],
      },
    ],
    [isManual, ferramentasOptions]
  );

  const handleSubmit = useCallback(
    async (values) => {
      const id = opPaiId ?? opPaiRecord?.id;
      if (!isManual && !id) {
        message.error('OP Pai não informada.');
        return;
      }
      try {
        const serializeDate = (v) => (!v ? null : typeof v === 'string' ? v : dayjs(v).format('YYYY-MM-DD'));
        let opPai = opPaiRecord || null;
        if (!isManual && id && !opPai) {
          const resPai = await OrdemProducaoService.getById(id);
          if (resPai?.success && resPai?.data?.data) opPai = resPai.data.data;
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

  return (
    <Modal
      title={isManual ? 'Criar OP Manual' : 'Criar OP MESC'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      {isManual && (
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">OP Manual</Tag>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>Sem vínculo com OP Totvs</Text>
        </div>
      )}
      {!isManual && saldo != null && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 8 }}>
          <Text strong>Saldo disponível: {saldo.toLocaleString('pt-BR')} peças</Text>
        </div>
      )}
      <DynamicForm
        formConfig={formConfig}
        formInstance={form}
        onSubmit={handleSubmit}
        onClose={onClose}
        submitText={isManual ? 'Criar OP Manual' : 'Criar OP MESC'}
        submitOnSide={true}
      />
    </Modal>
  );
};

export default CriarOPMESCModal;
