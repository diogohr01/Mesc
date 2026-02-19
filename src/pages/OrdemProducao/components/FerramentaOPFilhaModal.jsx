import { Form, message, Modal } from 'antd';
import { DynamicForm } from '../../../components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineSave } from 'react-icons/ai';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import FerramentasService from '../../../services/ferramentasService';

const FerramentaOPFilhaModal = ({ open, onClose, ordemData, onSuccess }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [ferramentasOptions, setFerramentasOptions] = useState([]);
  const [ferramentasList, setFerramentasList] = useState([]);

  useEffect(() => {
    const loadFerramentas = async () => {
      try {
        const res = await FerramentasService.getAll({ page: 1, pageSize: 500 });
        if (res?.data?.data) {
          const list = res.data.data;
          setFerramentasList(list);
          setFerramentasOptions(
            list.map((f) => ({
              label: f.descricao ? `${f.codigo} - ${f.descricao}` : f.codigo,
              value: f.codigo,
            }))
          );
        }
      } catch (e) {
        console.error('Erro ao carregar ferramentas:', e);
      }
    };
    if (open) loadFerramentas();
  }, [open]);

  const formConfig = useMemo(
    () => [
      {
        title: 'Configuração da Ferramenta da OP MESC',
        columns: 2,
        questions: [
          { type: 'select', id: 'codigoFerramenta', label: 'Cód. da Ferramenta', required: false, placeholder: 'Selecione a ferramenta', options: ferramentasOptions, showSearch: true },
          { type: 'integer', id: 'numeroCortes', label: 'Número de cortes (NC)', required: false, placeholder: '0' },
          { type: 'integer', id: 'numeroBillets', label: "Nº de Billet's (NB)", required: false, placeholder: '0' },
          { type: 'decimal', id: 'puxada', label: 'Puxada (m)', required: false, placeholder: '0' },
          { type: 'decimal', id: 'tamanhoBillet', label: 'Tam. Billet (mm)', required: false, placeholder: '0' },
          { type: 'decimal', id: 'pesoLiquido', label: 'Peso Líquido (kg)', required: false, placeholder: '0' },
          { type: 'decimal', id: 'pesoExtrudido', label: 'Peso Extrud. (kg)', required: false, placeholder: '0' },
          { type: 'decimal', id: 'pesoTotal', label: 'Peso Total (kg)', required: false, placeholder: '0' },
          { type: 'decimal', id: 'rendimentoMetalico', label: 'Rend. metálico (%)', required: false, placeholder: '0' },
          { type: 'integer', id: 'numeroPecasOP', label: 'Nº pç da OP (un)', required: false, placeholder: '0' },
          { type: 'textarea', id: 'observacaoProgramacao', label: 'Observação da programação', required: false, placeholder: '' },
        ],
      },
    ],
    [ferramentasOptions]
  );

  const setFormValuesFromOrdem = useCallback(() => {
    if (!ordemData) return;
    const f = ordemData.ferramenta || {};
    form.setFieldsValue({
      codigoFerramenta: f.codigo ?? ordemData.codigoFerramenta ?? '',
      numeroCortes: ordemData.numeroCortes ?? f.numeroCortes ?? undefined,
      numeroBillets: ordemData.numeroBillets ?? f.numeroBillets ?? undefined,
      puxada: ordemData.puxada ?? f.puxada ?? undefined,
      tamanhoBillet: ordemData.tamanhoBillet ?? f.tamanhoBillet ?? undefined,
      pesoLiquido: ordemData.pesoLiquido ?? f.pesoLiquido ?? undefined,
      pesoExtrudido: ordemData.pesoExtrudido ?? f.pesoExtrudido ?? undefined,
      pesoTotal: ordemData.pesoTotal ?? f.pesoTotal ?? undefined,
      rendimentoMetalico: ordemData.rendimentoMetalico ?? f.rendimentoMetalico ?? undefined,
      numeroPecasOP: ordemData.numeroPecasOP ?? f.numeroPecasOP ?? undefined,
      observacaoProgramacao: ordemData.observacaoProgramacao ?? ordemData.observacoes ?? '',
    });
  }, [ordemData, form]);

  useEffect(() => {
    if (open && ordemData) {
      setFormValuesFromOrdem();
    }
    if (!open) {
      form.resetFields();
    }
  }, [open, ordemData, form, setFormValuesFromOrdem]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!ordemData?.id) {
        message.error('OP MESC não identificada.');
        return;
      }
      setSaving(true);
      try {
        const op = ordemData.numeroOPERP || ordemData.id;
        const codigoFerr = values.codigoFerramenta ?? '';
        const ferr = ferramentasList.find((f) => f.codigo === codigoFerr);
        const ferramenta = {
          codigo: codigoFerr,
          descricao: ferr?.descricao ?? codigoFerr,
        };
        const ferramentas = [
          {
            op: String(op),
            codigoFerramenta: values.codigoFerramenta ?? '',
            nc: values.numeroCortes,
            nb: values.numeroBillets,
            puxada: values.puxada,
            billet: values.tamanhoBillet,
            np: values.numeroPecasOP,
            npr: values.rendimentoMetalico,
          },
        ];
        const updatedOP = {
          ...ordemData,
          ferramenta,
          ferramentas,
          numeroCortes: values.numeroCortes,
          numeroBillets: values.numeroBillets,
          puxada: values.puxada,
          tamanhoBillet: values.tamanhoBillet,
          pesoLiquido: values.pesoLiquido,
          pesoExtrudido: values.pesoExtrudido,
          pesoTotal: values.pesoTotal,
          rendimentoMetalico: values.rendimentoMetalico,
          numeroPecasOP: values.numeroPecasOP,
          observacaoProgramacao: values.observacaoProgramacao,
          observacoes: values.observacaoProgramacao ?? ordemData.observacoes ?? '',
        };
        const response = await OrdemProducaoService.upsert(updatedOP);
        if (response?.success) {
          message.success('Configuração da ferramenta salva com sucesso.');
          onSuccess?.(updatedOP);
          onClose?.();
        } else {
          message.error(response?.message || 'Erro ao salvar.');
        }
      } catch (error) {
        message.error('Erro ao salvar configuração da ferramenta.');
        console.error(error);
      } finally {
        setSaving(false);
      }
    },
    [ordemData, onSuccess, onClose, form, ferramentasList]
  );

  return (
    <Modal
      title="Configurar ferramenta da OP MESC"
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
        submitText="Salvar configuração"
        submitIcon={<AiOutlineSave />}
        submitOnSide={true}
      />
    </Modal>
  );
};

export default FerramentaOPFilhaModal;
