import React, { useCallback, useMemo } from 'react';
import { Button, Input, InputNumber, Table } from 'antd';
import { AiOutlinePlus } from 'react-icons/ai';

const defaultColumnsConfig = [
  { dataIndex: 'nome_cota', title: 'Nome da Cota', width: 200 },
  { dataIndex: 'cota_mm', title: 'Cota (mm)', width: 120 },
  { dataIndex: 'tolerancia_menos', title: 'Tolerância (-)', width: 120 },
  { dataIndex: 'tolerancia_mais', title: 'Tolerância (+)', width: 120 },
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
 */
const DimensionaisTableInput = ({
  value = [],
  onChange,
  disabled = false,
  columns: columnsConfig = defaultColumnsConfig,
  addButtonText = 'Adicionar linha',
  emptyText = 'Nenhuma cota. Clique em "Adicionar linha".',
  ...rest
}) => {
  const rows = useMemo(() => ensureKeys(value), [value]);

  const emitChange = useCallback(
    (nextRows) => {
      if (onChange) onChange(stripKeys(nextRows));
    },
    [onChange]
  );

  const addRow = useCallback(() => {
    const newRow = { nome_cota: '', cota_mm: 0, tolerancia_menos: 0, tolerancia_mais: 0 };
    emitChange([...rows, newRow]);
  }, [rows, emitChange]);

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
          <Button type="primary" icon={<AiOutlinePlus />} onClick={addRow} size="small">
            {addButtonText}
          </Button>
        </div>
      )}
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
