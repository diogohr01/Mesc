import { Form, message, Modal } from 'antd';
import { DynamicForm } from '../../../components';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo } from 'react';
import OrdemProducaoService from '../../../services/ordemProducaoService';

const NovaOPFilhaModal = ({ open, onClose, opPaiId, clientesOptions = [], onSuccess }) => {
  const [form] = Form.useForm();

  const formConfig = useMemo(
    () => [
      {
        title: 'Nova OP Filha',
        columns: 2,
        questions: [
          {
            type: 'text',
            id: 'numeroOPERP',
            required: true,
            placeholder: 'Número da OP do ERP',
            label: 'Número da OP (EMS/TOTVS)',
          },
          {
            type: 'date',
            id: 'dataOP',
            required: true,
            placeholder: 'Data',
            label: 'Data do Registro',
            format: 'DD/MM/YYYY',
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
            placeholder: 'Quantidade',
            label: 'Quantidade a Produzir',
          },
          {
            type: 'textarea',
            id: 'observacoes',
            required: false,
            placeholder: 'Observações',
            label: 'Observações',
          },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        dataOP: dayjs(),
        situacao: 'Em cadastro',
      });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = useCallback(
    async (values) => {
      if (opPaiId == null) return;
      try {
        const serializeDate = (v) =>
          !v ? null : typeof v === 'string' ? v : dayjs(v).format('YYYY-MM-DD');
        let opPai = null;
        try {
          const resPai = await OrdemProducaoService.getById(opPaiId);
          if (resPai?.success && resPai?.data?.data) {
            opPai = resPai.data.data;
          }
        } catch (e) {
          console.warn('Não foi possível carregar OP Pai:', e);
        }
        if (!opPai) {
          message.error('Não foi possível carregar dados da OP Pai.');
          return;
        }
        const itensPai = opPai.itens || [];
        const quantidade = values.quantidadeAProduzir ?? itensPai[0]?.quantidadePecas ?? 0;
        const itensFilha = itensPai.map((item, idx) => ({
          ...item,
          id: item.id ?? idx + 1,
          quantidadePecas: idx === 0 ? quantidade : (item.quantidadePecas ?? 0),
        }));
        const ordemData = {
          tipoOp: 'FILHA',
          opPaiId,
          numeroOPERP: values.numeroOPERP || '',
          dataOP: serializeDate(values.dataOP),
          situacao: values.situacao || 'Em cadastro',
          cliente: opPai.cliente || {},
          numeroPedidoCliente: opPai.numeroPedidoCliente ?? '',
          observacoes: values.observacoes || '',
          itens: itensFilha,
          informacoesComplementares: {},
          ativo: true,
        };
        const response = await OrdemProducaoService.upsert(ordemData);
        if (response.success) {
          message.success('OP Filha cadastrada com sucesso!');
          onSuccess?.();
          onClose?.();
        } else {
          message.error(response.message || 'Erro ao cadastrar OP Filha.');
        }
      } catch (error) {
        message.error('Erro ao cadastrar OP Filha.');
        console.error(error);
      }
    },
    [opPaiId, onSuccess, onClose]
  );

  return (
    <Modal
      title="Nova OP Filha"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <DynamicForm
        formConfig={formConfig}
        formInstance={form}
        onSubmit={handleSubmit}
        onClose={onClose}
        submitText="Cadastrar OP Filha"
        submitOnSide={true}
      />
    </Modal>
  );
};

export default NovaOPFilhaModal;
