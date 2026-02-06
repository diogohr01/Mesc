import React, { useCallback, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Table } from 'antd';
import { AiOutlinePlus } from 'react-icons/ai';

const DynamicForm = React.lazy(() =>
  import('../../../components/Data/Form').then((m) => ({ default: m.default }))
);

const defaultColumnsConfig = [
  { dataIndex: 'nome_cota', title: 'Nome da Cota', width: 200 },
  { dataIndex: 'cota_mm', title: 'Cota (mm)', width: 120 },
  { dataIndex: 'tolerancia_menos', title: 'Tolerância (-)', width: 120 },
  { dataIndex: 'tolerancia_mais', title: 'Tolerância (+)', width: 120 },
];

const initialFormRow = { nome_cota: '', cota_mm: 0, tolerancia_menos: 0, tolerancia_mais: 0 };

const modalFormConfig = [
  {
    columns: 1,
    questions: [
      { type: 'text', id: 'nome_cota', label: 'Nome da Cota', required: true, placeholder: 'Nome da cota' },
      { type: 'decimal', id: 'cota_mm', label: 'Cota (mm)', precision: 2, step: 0.01, questionProps: { min: 0 } },
      { type: 'decimal', id: 'tolerancia_menos', label: 'Tolerância (-)', precision: 2, step: 0.01 },
      { type: 'decimal', id: 'tolerancia_mais', label: 'Tolerância (+)', precision: 2, step: 0.01 },
    ],
  },
];

const ensureKeys = (arr) =>
  (Array.isArray(arr) ? arr : []).map((row, i) => ({
    ...row,
    key: row.key != null ? row.key : `dim-${i}`,
  }));

const stripKeys = (arr) =>
  (Array.isArray(arr) ? arr : []).map(({ key, ...rest }) => rest);

/**
 * DimensionaisTableInput - Tabela editável de dimensionais.
 * value: array de { nome_cota, cota_mm, tolerancia_menos, tolerancia_mais }
 * onChange: chamado com array atualizado (sem keys). Compatível com Form.Item.
 * "Adicionar linha" abre um modal para preencher a nova cota.
 */
const DimensionaisTableInput = ({
  value = [],
  onChange,
  disabled = false,
  columns: columnsConfig = defaultColumnsConfig,
  addButtonText = 'Adicionar linha',
  emptyText = 'Nenhuma cota. Clique em "Adicionar linha".',
  modalTitle = 'Adicionar cota',
  ...rest
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const rows = useMemo(() => ensureKeys(value), [value]);

  const emitChange = useCallback(
    (nextRows) => {
      if (onChange) onChange(stripKeys(nextRows));
    },
    [onChange]
  );

  const openAddModal = useCallback(() => {
    form.setFieldsValue({ ...initialFormRow });
    setModalOpen(true);
  }, [form]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    form.resetFields();
  }, [form]);

  const submitAddRow = useCallback(
    (values) => {
      const newRow = {
        nome_cota: values.nome_cota ?? '',
        cota_mm: values.cota_mm ?? 0,
        tolerancia_menos: values.tolerancia_menos ?? 0,
        tolerancia_mais: values.tolerancia_mais ?? 0,
      };
      emitChange([...rows, newRow]);
      closeModal();
    },
    [rows, emitChange, closeModal]
  );

  const removeRow = useCallback(
    (key) => {
      emitChange(rows.filter((r) => r.key !== key));
    },
    [rows, emitChange]
  );

  const updateCell = useCallback(
    (key, field, cellValue) => {
      const next = rows.map((r) => (r.key === key ? { ...r, [field]: cellValue } : r));
      emitChange(next);
    },
    [rows, emitChange]
  );

  const columns = useMemo(() => {
    return columnsConfig.map((col) => ({
      ...col,
      align: col.dataIndex === 'nome_cota' ? 'left' : 'right',
      render: disabled
        ? (val) => (val != null && val !== '' ? String(val) : '-')
        : (val, record) => {
            if (col.dataIndex === 'nome_cota') {
              return (
                <Input
                  size="small"
                  placeholder="Nome"
                  value={val}
                  onChange={(e) => updateCell(record.key, 'nome_cota', e.target.value)}
                />
              );
            }
            return (
              <InputNumber
                size="small"
                min={col.dataIndex === 'cota_mm' ? 0 : undefined}
                step={0.01}
                style={{ width: '100%' }}
                value={val}
                onChange={(v) => updateCell(record.key, col.dataIndex, v ?? 0)}
              />
            );
          },
    }));
  }, [columnsConfig, disabled, updateCell]);

  const actionsColumn = useMemo(() => {
    if (disabled) return null;
    return {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button type="text" danger size="small" onClick={() => removeRow(record.key)}>
          Remover
        </Button>
      ),
    };
  }, [disabled, removeRow]);

  const tableColumns = useMemo(() => {
    const cols = [...columns];
    if (actionsColumn) cols.push(actionsColumn);
    return cols;
  }, [columns, actionsColumn]);

  return (
    <div {...rest}>
      {!disabled && (
        <div style={{ marginBottom: 8 }}>
          <Button type="primary" icon={<AiOutlinePlus />} onClick={openAddModal}>
            {addButtonText}
          </Button>
        </div>
      )}
      <Modal
        title={modalTitle}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={440}
      >
        <React.Suspense fallback={null}>
          <DynamicForm
            formConfig={modalFormConfig}
            formInstance={form}
            onSubmit={submitAddRow}
            onClose={closeModal}
            submitText="Adicionar"
          />
        </React.Suspense>
      </Modal>
      <Table
        dataSource={rows}
        columns={tableColumns}
        rowKey="key"
        pagination={false}
        size="small"
        bordered
        locale={{ emptyText }}
      />
    </div>
  );
};

export default React.memo(DimensionaisTableInput);
