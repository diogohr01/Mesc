import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, DatePicker, Modal, Progress, Row, Slider, Space, Typography } from 'antd';
import { HomeOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { PaginatedTable, LoadingSpinner } from '../../../components';
import { colors } from '../../../styles/colors';

const { Text } = Typography;

const TABLE_PAGE_SIZE = 10;

export default function ModalSequenciarOP({
  open,
  onClose,
  cenarios,
  cenarioAtivoId,
  setCenarioAtivo,
  filtroTipo,
  setFiltroTipo,
  casaPct,
  setCasaPct,
  columns,
  fetchDataForSequenciarModal,
  onRow,
}) {
  const [cenarioLocal, setCenarioLocal] = useState(cenarioAtivoId ?? null);
  const [filtroLocal, setFiltroLocal] = useState(filtroTipo);
  const [casaPctLocal, setCasaPctLocal] = useState(casaPct);
  const tableRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCenarioLocal(cenarioAtivoId ?? cenarios?.[0]?.id ?? null);
      setFiltroLocal(filtroTipo);
      setCasaPctLocal(casaPct);
    }
  }, [open, cenarioAtivoId, filtroTipo, casaPct, cenarios]);

  useEffect(() => {
    if (open && tableRef.current) {
      tableRef.current.reloadTable();
    }
  }, [open, cenarioLocal, filtroLocal]);

  const fetchData = useCallback(
    (page, pageSize) => fetchDataForSequenciarModal(page, pageSize, cenarioLocal, filtroLocal),
    [cenarioLocal, filtroLocal, fetchDataForSequenciarModal]
  );

  const cenarioSelecionado = (cenarios || []).find((c) => c.id === cenarioLocal);

  const handleConfirm = () => {
    setCenarioAtivo(cenarioLocal);
    setFiltroTipo(filtroLocal);
    setCasaPct(casaPctLocal);
    onClose();
  };

  return (
    <Modal
      title="Sequenciar OP"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>Confirmar</Button>,
      ]}
      width={1200}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Divisão de capacidade</Text>
          <Space wrap>
            {['todos', 'casa', 'cliente'].map((f) => (
              <Button
                key={f}
                type={filtroLocal === f ? 'primary' : 'default'}
                icon={f === 'casa' ? <HomeOutlined /> : f === 'cliente' ? <TeamOutlined /> : null}
                onClick={() => setFiltroLocal(f)}
              >
                {f === 'todos' ? 'Todos' : f === 'casa' ? 'Casa' : 'Cliente'}
              </Button>
            ))}
          </Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Casa {casaPctLocal}%</Text>
            <Slider min={0} max={100} step={5} value={casaPctLocal} onChange={setCasaPctLocal} style={{ flex: 1, margin: 0 }} />
            <Text type="secondary" style={{ fontSize: 11 }}>Cliente {100 - casaPctLocal}%</Text>
          </div>
        </div>
        <div>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Cenário de priorização</Text>
          <Space wrap>
            {(cenarios || []).map((c) => (
              <Button
                key={c.id}
                type={cenarioLocal === c.id ? 'primary' : 'default'}
                onClick={() => setCenarioLocal(c.id)}
              >
                {c.nome}
              </Button>
            ))}
          </Space>
        </div>
        {cenarioSelecionado && (cenarioSelecionado.criterios?.length ?? 0) > 0 && (
          <div style={{ padding: '12px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <InfoCircleOutlined style={{ color: colors.text.secondary }} />
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pesos do cenário: {cenarioSelecionado.nome}
              </Text>
            </Space>
            <Row gutter={[12, 8]}>
              {(cenarioSelecionado.criterios || []).map((cr) => (
                <Col key={cr.id} xs={24} sm={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                    <Text type="secondary" style={{ fontSize: 11, minWidth: 58, flexShrink: 0 }} ellipsis title={cr.label}>{cr.label}</Text>
                    <Progress percent={cr.value ?? 0} size="small" showInfo={false} style={{ flex: 1, marginBottom: 0, minWidth: 40 }} />
                    <Text style={{ fontSize: 11, fontFamily: 'monospace', width: 26, flexShrink: 0 }}>{cr.value ?? 0}%</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
        <div>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Sequenciar até uma data</Text>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </div>
        {columns && fetchDataForSequenciarModal && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
              Pré-visualização da fila. Arraste para reordenar (esta página).
            </Text>
            <PaginatedTable
              ref={tableRef}
              fetchData={fetchData}
              initialPageSize={TABLE_PAGE_SIZE}
              columns={columns}
              rowKey="id"
              loadingIcon={<LoadingSpinner />}
              scroll={{ x: 'max-content', y: 280 }}
              onRow={onRow}
              reorderable
            />
          </div>
        )}
      </Space>
    </Modal>
  );
}
