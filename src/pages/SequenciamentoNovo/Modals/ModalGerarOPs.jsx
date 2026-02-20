import React, { useState } from 'react';
import { Button, DatePicker, InputNumber, Modal, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { gerarOPsPorDia } from '../../../helpers/gerarOPsPorDia';

const { Text } = Typography;

export default function ModalGerarOPs({ open, onClose }) {
  const [dataInicio, setDataInicio] = useState(dayjs());
  const [quantidadeDias, setQuantidadeDias] = useState(1);
  const [geradas, setGeradas] = useState([]);

  const handleGerar = () => {
    const list = gerarOPsPorDia({
      dataInicio,
      quantidadeDias: quantidadeDias || 1,
      minHoras: 4,
      maxHoras: 8,
      opsPorDia: 2,
    });
    setGeradas(list);
  };

  const columns = [
    { title: 'Dia', dataIndex: 'dia', key: 'dia', width: 120, render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-') },
    { title: 'Início', dataIndex: 'dataInicio', key: 'dataInicio', width: 140, render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-') },
    { title: 'Fim', dataIndex: 'dataFim', key: 'dataFim', width: 140, render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-') },
    { title: 'Duração (h)', dataIndex: 'duracaoHoras', key: 'duracaoHoras', width: 100 },
  ];

  return (
    <Modal
      title="Gerar OPs"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Fechar</Button>]}
      width={560}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Gera múltiplas OPs por dia (4 a 8 horas cada). Estrutura preparada para regras futuras de capacidade.
        </Text>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Data início</label>
            <DatePicker value={dataInicio} onChange={(d) => setDataInicio(d || dayjs())} format="DD/MM/YYYY" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>Quantidade de dias</label>
            <InputNumber min={1} max={31} value={quantidadeDias} onChange={(v) => setQuantidadeDias(v ?? 1)} />
          </div>
          <Button type="primary" onClick={handleGerar}>Gerar</Button>
        </div>
        {geradas.length > 0 && (
          <Table
            dataSource={geradas}
            columns={columns}
            rowKey={(_, i) => i}
            size="small"
            pagination={false}
            scroll={{ y: 240 }}
          />
        )}
      </div>
    </Modal>
  );
}
