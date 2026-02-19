import React, { useState, memo } from 'react';
import { Button, DatePicker, InputNumber, Modal } from 'antd';
import {
  CloseOutlined,
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  AppstoreOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { ScoreBadge, StatusBadge } from '../../../../components';
import { toast } from '../../../../helpers/toast';

dayjs.locale('pt-br');

function InfoRow({ icon: Icon, label, value, mono, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {Icon && <Icon style={{ fontSize: 8, color: '#8c8c8c', flexShrink: 0 }} />}
      <span style={{ fontSize: 8, color: '#8c8c8c', width: 72, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 8,
          color: highlight ? '#ff4d4f' : '#262626',
          fontWeight: highlight ? 700 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: mono ? 'nowrap' : 'normal',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DateField({ label, icon: Icon, date, onChange, highlight }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 8, color: '#8c8c8c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon style={{ fontSize: 8 }} />}
        {label}
      </label>
      <DatePicker
        value={date ? (dayjs.isDayjs(date) ? date : dayjs(date)) : null}
        onChange={(d) => onChange(d || undefined)}
        format="DD/MM/YYYY"
        style={{
          width: '100%',
          borderColor: highlight ? '#ff4d4f' : undefined,
        }}
      />
    </div>
  );
}

function GanttDetailPanel({ filha, pai, onClose, onUpdate }) {
  const [modalConfirmarOpen, setModalConfirmarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDataEntrega, setEditDataEntrega] = useState(
    filha.dataEntrega ? dayjs(filha.dataEntrega) : undefined
  );
  const [editDataInicio, setEditDataInicio] = useState(
    filha.dataInicio ? dayjs(filha.dataInicio) : undefined
  );
  const [editDataFim, setEditDataFim] = useState(
    filha.dataFim ? dayjs(filha.dataFim) : undefined
  );
  const [editQuantidade, setEditQuantidade] = useState(filha.quantidade);

  const isLate =
    filha.dataEntrega &&
    filha.dataFim &&
    dayjs(filha.dataFim).isAfter(dayjs(filha.dataEntrega));
  const isOverdue =
    filha.dataEntrega &&
    dayjs(filha.dataEntrega).isBefore(dayjs(), 'day') &&
    filha.status !== 'concluida' &&
    filha.status !== 'cancelada';
  const showRisk = isLate || isOverdue;

  const handleSave = () => {
    const updates = {};
    if (editDataEntrega) updates.dataEntrega = dayjs(editDataEntrega).format('YYYY-MM-DD');
    if (editDataInicio) updates.dataInicio = dayjs(editDataInicio).format('YYYY-MM-DD');
    if (editDataFim) updates.dataFim = dayjs(editDataFim).format('YYYY-MM-DD');
    if (editQuantidade !== filha.quantidade) updates.quantidade = editQuantidade;
    onUpdate(filha.id, updates);
    setEditing(false);
    toast.success('OP atualizada', `${filha.codigo} foi atualizada com sucesso.`);
  };

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 8, color: '#8c8c8c', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
            Detalhes da OP
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#262626', margin: 0 }}>
            {filha.codigo}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {!editing ? (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 13 }} />}
              onClick={() => setEditing(true)}
              title="Editar"
            />
          ) : (
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined style={{ fontSize: 13, color: '#52c41a' }} />}
              onClick={handleSave}
              title="Salvar"
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
            title="Fechar"
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge status={filha.status} />
        <ScoreBadge score={filha.score} />
        {showRisk && (
          <span
            style={{
              fontSize: 8,
              backgroundColor: 'rgba(255,77,79,0.2)',
              color: '#ff4d4f',
              padding: '2px 8px',
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            ATRASO
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <InfoRow icon={AppstoreOutlined} label="Produto" value={pai.produto} />
        <InfoRow icon={UserOutlined} label="Cliente" value={pai.cliente} />
        <InfoRow icon={AppstoreOutlined} label="OP Totvs" value={pai.codigo} mono />
        <InfoRow icon={ThunderboltOutlined} label="Liga / Têmpera" value={`${pai.liga} / ${pai.tempera}`} mono />
        <InfoRow icon={ThunderboltOutlined} label="Recurso" value={filha.recurso} />

        {editing ? (
          <>
            <div>
              <label style={{ fontSize: 8, color: '#8c8c8c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AppstoreOutlined style={{ fontSize: 8 }} /> Quantidade
              </label>
              <InputNumber
                value={editQuantidade}
                onChange={(v) => setEditQuantidade(v ?? 0)}
                min={1}
                style={{ width: '100%' }}
                size="small"
              />
            </div>
            <DateField
              label="Data de Entrega"
              icon={CalendarOutlined}
              date={editDataEntrega}
              onChange={setEditDataEntrega}
              highlight={!!showRisk}
            />
            <DateField label="Data Início" icon={CalendarOutlined} date={editDataInicio} onChange={setEditDataInicio} />
            <DateField label="Data Fim" icon={CalendarOutlined} date={editDataFim} onChange={setEditDataFim} />
          </>
        ) : (
          <>
            <InfoRow icon={AppstoreOutlined} label="Quantidade" value={filha.quantidade.toLocaleString()} mono />
            <InfoRow
              icon={CalendarOutlined}
              label="Entrega"
              value={filha.dataEntrega || '—'}
              mono
              highlight={!!showRisk}
            />
            <InfoRow icon={CalendarOutlined} label="Início" value={filha.dataInicio || '—'} mono />
            <InfoRow icon={CalendarOutlined} label="Fim" value={filha.dataFim || '—'} mono />
          </>
        )}

        {filha.setupMinutos != null && filha.setupMinutos > 0 && (
          <InfoRow
            icon={ToolOutlined}
            label="Setup"
            value={`${filha.setupTipo || 'Setup'} (${filha.setupMinutos}min)`}
          />
        )}
      </div>

      <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 8, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
          Ações Rápidas
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button type="primary" size="small" block onClick={() => setModalConfirmarOpen(true)}>
            Confirmar OP
          </Button>
          <Button size="small" block>
            Re-sequenciar
          </Button>
          <Button danger size="small" block>
            Cancelar OP
          </Button>
        </div>
      </div>
      <Modal
        title="Confirmar OP"
        open={modalConfirmarOpen}
        onCancel={() => setModalConfirmarOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalConfirmarOpen(false)}>Cancelar</Button>,
          <Button key="confirm" type="primary" onClick={() => setModalConfirmarOpen(false)}>Confirmar</Button>,
        ]}
        width={400}
      >
        <p style={{ marginBottom: 16 }}>Sequenciei a semana toda</p>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Liberar OPs até</label>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </div>
      </Modal>
    </div>
  );
}

export default memo(GanttDetailPanel);
