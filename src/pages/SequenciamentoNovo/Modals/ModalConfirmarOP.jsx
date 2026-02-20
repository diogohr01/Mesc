import React from 'react';
import { Button, DatePicker, Modal } from 'antd';

export default function ModalConfirmarOP({ open, onClose }) {
  const handleConfirm = () => {
    onClose();
  };

  return (
    <Modal
      title="Confirmar OP"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>Confirmar</Button>,
      ]}
      width={400}
    >
      <p style={{ marginBottom: 16 }}>Sequenciei a semana toda</p>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Liberar OPs até</label>
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </div>
    </Modal>
  );
}
