import { Form, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo } from 'react';
import { DynamicForm } from '../../../components';

const CONTROLE_OPCOES = [
    { label: 'Peça', value: 'PEÇA' },
    { label: 'Peso', value: 'PESO' },
];

const formConfig = [
    {
        title: 'Configuração do item',
        columns: 2,
        questions: [
            {
                type: 'integer',
                id: 'codigo',
                required: false,
                label: 'Código',
                disabled: true,
            },
            {
                type: 'text',
                id: 'item',
                required: true,
                placeholder: 'Código do item',
                label: 'Item',
            },
            {
                type: 'text',
                id: 'descricao',
                required: false,
                placeholder: 'Descrição',
                label: 'Descrição',
                disabled: true,
            },
            {
                type: 'radio',
                id: 'controle_tipo',
                required: true,
                label: 'Controle',
                options: CONTROLE_OPCOES,
            },
            {
                type: 'integer',
                id: 'quantidadeUn',
                required: true,
                placeholder: 'Quantidade',
                label: 'Quantidade (un)',
            },
            {
                type: 'decimal',
                id: 'pesoKg',
                required: false,
                placeholder: 'Peso (kg)',
                label: 'PL (kg)',
                precision: 2,
            },
            {
                type: 'date',
                id: 'dataEntrega',
                required: false,
                placeholder: 'Data de entrega',
                label: 'Data entrega',
                format: 'DD/MM/YYYY',
            },
            {
                type: 'date',
                id: 'data_limite_prod',
                required: false,
                placeholder: 'Data limite produção',
                label: 'Data limite produção',
                format: 'DD/MM/YYYY',
            },
            {
                type: 'textarea',
                id: 'observacao',
                required: false,
                placeholder: 'Observação do item',
                label: 'Observação',
            },
        ],
    },
];

const PedidoItemConfigModal = ({ open, item, onClose, onSave }) => {
    const [form] = Form.useForm();

    const initialValues = useMemo(() => {
        if (!item) return null;
        return {
            codigo: item.codigo,
            item: item.item || '',
            descricao: item.descricao || '',
            controle_tipo: item.controle_tipo || 'PEÇA',
            quantidadeUn: item.quantidadeUn ?? 0,
            pesoKg: item.pesoKg ?? 0,
            dataEntrega: item.dataEntrega
                ? (dayjs.isDayjs(item.dataEntrega) ? item.dataEntrega : dayjs(item.dataEntrega))
                : null,
            data_limite_prod: item.data_limite_prod
                ? (dayjs.isDayjs(item.data_limite_prod) ? item.data_limite_prod : dayjs(item.data_limite_prod))
                : null,
            observacao: item.observacao || '',
        };
    }, [item]);

    useEffect(() => {
        if (open && initialValues) {
            form.setFieldsValue(initialValues);
        }
        if (!open) {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    const handleSubmit = useCallback(
        (values) => {
            if (!item) return;
            const updatedItem = {
                ...item,
                item: values.item,
                controle_tipo: values.controle_tipo || 'PEÇA',
                quantidadeUn: values.quantidadeUn ?? 0,
                pesoKg: values.pesoKg ?? 0,
                dataEntrega: values.dataEntrega
                    ? (dayjs.isDayjs(values.dataEntrega)
                          ? values.dataEntrega.format('YYYY-MM-DD')
                          : dayjs(values.dataEntrega).format('YYYY-MM-DD'))
                    : null,
                data_limite_prod: values.data_limite_prod
                    ? (dayjs.isDayjs(values.data_limite_prod)
                          ? values.data_limite_prod.format('YYYY-MM-DD')
                          : dayjs(values.data_limite_prod).format('YYYY-MM-DD'))
                    : null,
                observacao: values.observacao || '',
            };
            onSave?.(updatedItem);
            onClose?.();
        },
        [item, onSave, onClose]
    );

    return (
        <Modal
            title="Configurar item do pedido"
            open={open}
            onCancel={onClose}
            footer={null}
            width={640}
            destroyOnClose
        >
            <DynamicForm
                formConfig={formConfig}
                formInstance={form}
                onSubmit={handleSubmit}
                onClose={onClose}
                submitText="Salvar"
                submitOnSide={true}
            />
        </Modal>
    );
};

export default PedidoItemConfigModal;
