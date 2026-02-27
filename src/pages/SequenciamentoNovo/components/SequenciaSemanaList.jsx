import React from 'react';
import { Button, Card, Tag, Tooltip, Typography } from 'antd';
import { HolderOutlined, LockOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import { getUrgencyLevel, urgencyColors } from '../../../helpers/urgency';

const { Text } = Typography;

/**
 * Lista da sequência da semana (visão 7 dias). Com drag quando filtroTipo === 'todos'.
 * Apenas apresentação; handlers e estado vêm via props.
 */
export default function SequenciaSemanaList({
  diaSequenciamento,
  filtroTipo,
  opsSemanaOrdenadas,
  opsSemanaFiltradas,
  diasDaSemana,
  semanaTemOPs,
  handleReorderSemana,
  setModalDisponiveisOpen,
}) {
  const filtroLabel = filtroTipo === 'todos' ? 'Todos' : filtroTipo === 'casa' ? 'Casa' : 'Cliente';
  const inicioSemana = dayjs(diaSequenciamento).startOf('week');
  const fimSemana = inicioSemana.add(6, 'day');

  return (
    <Card
      title={
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          Sequência da semana — {inicioSemana.format('DD/MM')} - {fimSemana.format('DD/MM')} • {filtroLabel}
          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
            ({opsSemanaFiltradas.length} OPs)
          </Text>
        </span>
      }
      size="small"
      bodyStyle={{ padding: '8px 12px' }}
      extra={
        <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
          Adicionar OPs ao dia
        </Button>
      }
    >
      <div style={{ minHeight: 40 }}>
        {semanaTemOPs && (
          <div style={{ marginBottom: 8, fontSize: 11 }}>
            {diasDaSemana.some((d) => d.confirmada) ? (
              <span style={{ marginRight: 12 }}>
                <LockOutlined style={{ marginRight: 4 }} />
                Confirmados: {diasDaSemana.filter((d) => d.confirmada).map((d) => d.dia.format('ddd DD/MM')).join(', ')}
              </span>
            ) : (
              <span style={{ marginRight: 12, color: '#666' }}>
                <LockOutlined style={{ marginRight: 4 }} />
                Confirmados: nenhum
              </span>
            )}
            {diasDaSemana.some((d) => !d.confirmada && (d.ops?.length ?? 0) > 0) && (
              <span style={{ color: '#666' }}>
                Não confirmados:{' '}
                {diasDaSemana
                  .filter((d) => !d.confirmada && (d.ops?.length ?? 0) > 0)
                  .map((d) => d.dia.format('ddd DD/MM'))
                  .join(', ')}
              </span>
            )}
          </div>
        )}
        {opsSemanaFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 12 }}>
            {filtroTipo === 'todos' || opsSemanaOrdenadas.length === 0
              ? 'Nenhuma OP sequenciada nesta semana.'
              : `Nenhuma OP de ${filtroTipo === 'casa' ? 'Casa' : 'Cliente'} nesta semana.`}
          </div>
        ) : filtroTipo === 'todos' ? (
          <DragDropContext onDragEnd={handleReorderSemana}>
            <Droppable droppableId="sequencia-semana" isDropDisabled={false}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 40 }}>
                  {opsSemanaOrdenadas.map((op, index) => (
                    <Draggable
                      key={`${op.dateKeyAssignado}-${op.id}-${index}`}
                      draggableId={`semana-${op.id}`}
                      index={index}
                      isDragDisabled={op.diaConfirmado}
                    >
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 6px',
                            marginBottom: 2,
                            borderRadius: 4,
                            border: '1px solid #f0f0f0',
                            fontSize: 12,
                            backgroundColor: snap.isDragging ? '#fafafa' : '#fff',
                            cursor: op.diaConfirmado ? 'default' : 'grab',
                            ...prov.draggableProps.style,
                          }}
                        >
                          <HolderOutlined style={{ color: op.diaConfirmado ? '#d9d9d9' : '#999', fontSize: 12 }} />
                          <span style={{ width: 72, fontSize: 11, color: '#666' }}>
                            {op.diaAssignado ? dayjs(op.diaAssignado).format('ddd DD/MM') : '-'}
                          </span>
                          {op.diaConfirmado ? (
                            <Tag icon={<LockOutlined />} color="success" style={{ fontSize: 10 }}>
                              Confirmado
                            </Tag>
                          ) : (
                            <Tag color="default" style={{ fontSize: 10 }}>
                              Aguardando confirmação
                            </Tag>
                          )}
                          <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>
                            {op.codigo || '-'}
                          </Text>
                          {op.contingencia && (
                            <Tooltip title="OP criada manualmente (contingência)">
                              <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                            </Tooltip>
                          )}
                          <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                            {op.produto || '-'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {op.liga || '-'} / {op.tempera || '-'}
                          </Text>
                          <Text style={{ fontSize: 11 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                          <span style={{ fontSize: 11 }}>
                            {(op.tipo || 'cliente') === 'casa' ? (
                              <Tag color="blue" style={{ margin: 0 }}>Casa</Tag>
                            ) : (
                              <Tag style={{ margin: 0 }}>Cliente</Tag>
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color:
                                urgencyColors[
                                  getUrgencyLevel(
                                    op.dataEntrega ?? op.itens?.[0]?.dataEntrega,
                                    op.status,
                                    op.diasToleranciaAtraso
                                  )
                                ] ?? undefined,
                            }}
                          >
                            {(op.dataEntrega ?? op.itens?.[0]?.dataEntrega)
                              ? dayjs(op.dataEntrega ?? op.itens?.[0]?.dataEntrega).format('DD/MM')
                              : '-'}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <>
            {opsSemanaFiltradas.map((op, index) => (
              <div
                key={`${op.dateKeyAssignado}-${op.id}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 6px',
                  marginBottom: 2,
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  fontSize: 12,
                  backgroundColor: '#fff',
                }}
              >
                <span style={{ width: 72, fontSize: 11, color: '#666' }}>
                  {op.diaAssignado ? dayjs(op.diaAssignado).format('ddd DD/MM') : '-'}
                </span>
                {op.diaConfirmado ? (
                  <Tag icon={<LockOutlined />} color="success" style={{ fontSize: 10 }}>
                    Confirmado
                  </Tag>
                ) : (
                  <Tag color="default" style={{ fontSize: 10 }}>
                    Aguardando confirmação
                  </Tag>
                )}
                <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>
                  {op.codigo || '-'}
                </Text>
                {op.contingencia && (
                  <Tooltip title="OP criada manualmente (contingência)">
                    <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                  </Tooltip>
                )}
                <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                  {op.produto || '-'}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {op.liga || '-'} / {op.tempera || '-'}
                </Text>
                <Text style={{ fontSize: 11 }}>{(Number(op.quantidade) || 0).toLocaleString('pt-BR')} kg</Text>
                <span style={{ fontSize: 11 }}>
                  {(op.tipo || 'cliente') === 'casa' ? (
                    <Tag color="blue" style={{ margin: 0 }}>Casa</Tag>
                  ) : (
                    <Tag style={{ margin: 0 }}>Cliente</Tag>
                  )}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color:
                      urgencyColors[
                        getUrgencyLevel(
                          op.dataEntrega ?? op.itens?.[0]?.dataEntrega,
                          op.status,
                          op.diasToleranciaAtraso
                        )
                      ] ?? undefined,
                  }}
                >
                  {(op.dataEntrega ?? op.itens?.[0]?.dataEntrega)
                    ? dayjs(op.dataEntrega ?? op.itens?.[0]?.dataEntrega).format('DD/MM')
                    : '-'}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}
