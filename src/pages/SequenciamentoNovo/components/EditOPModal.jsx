import React from 'react';
import { Form, Input, Modal, Select, Typography } from 'antd';

const { Text } = Typography;

/**
 * Modal para editar quantidade e ferramenta de uma OP do dia.
 * editOPModal: { op, quantidade, ferramentaCodigo }. setEditOPModal e handleConfirmEditOP vêm do hook.
 */
export default function EditOPModal({
  editOPModal,
  setEditOPModal,
  ferramentasOptions,
  handleConfirmEditOP,
}) {
  if (!editOPModal) return null;

  return (
    <Modal
      title={`Editar OP ${editOPModal.op?.codigo || editOPModal.op?.numeroOPERP || ''}`}
      open={!!editOPModal}
      onCancel={() => setEditOPModal(null)}
      onOk={handleConfirmEditOP}
      okText="Confirmar"
      cancelText="Cancelar"
      destroyOnClose
    >
      <div style={{ marginTop: 8 }}>
        <p style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
          {editOPModal.op?.produto || editOPModal.op?.itens?.[0]?.descricaoItem || '-'} • {editOPModal.op?.liga || '-'}{' '}
          • {editOPModal.op?.tempera || '-'}
        </p>
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Quantidade (kg)">
            <Input
              type="number"
              min={1}
              value={editOPModal.quantidade}
              onChange={(e) => setEditOPModal((prev) => ({ ...prev, quantidade: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="Ferramenta">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Selecione a ferramenta"
              value={editOPModal.ferramentaCodigo || undefined}
              onChange={(v) => setEditOPModal((prev) => ({ ...prev, ferramentaCodigo: v || '' }))}
              options={ferramentasOptions}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
