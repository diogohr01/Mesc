import React from 'react';
import { Input, Modal, Typography } from 'antd';

const { Text } = Typography;

/**
 * Modal de justificativa ao reordenar contra urgência (OP com entrega mais próxima movida para baixo).
 * Apenas apresentação; onConfirm/onCancel vêm do hook.
 */
export default function JustificativaModal({
  visible,
  justificativaModal,
  justificativaTexto,
  setJustificativaTexto,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title="Justificativa — alteração de prioridade"
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Registrar"
      cancelText="Cancelar"
    >
      {justificativaModal && (
        <>
          <p style={{ marginBottom: 8 }}>
            A OP <Text strong>{justificativaModal.op?.codigo || justificativaModal.op?.numeroOPERP}</Text> (entrega
            mais próxima) foi movida da posição {justificativaModal.fromIndex} para {justificativaModal.toIndex}.
          </p>
          <p style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>Informe a justificativa (opcional):</p>
          <Input.TextArea
            rows={3}
            value={justificativaTexto}
            onChange={(e) => setJustificativaTexto(e.target.value)}
            placeholder="Justificativa para alteração de prioridade..."
          />
        </>
      )}
    </Modal>
  );
}
