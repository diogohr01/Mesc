import React from 'react';
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, HolderOutlined, LockOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import dayjs from 'dayjs';
import { getUrgencyLevel, urgencyColors } from '../../../helpers/urgency';

const { Text } = Typography;

/**
 * Lista da sequência do dia com drag-and-drop e filtro Todas/Casa/Cliente.
 * Apenas apresentação; handlers e estado vêm via props.
 */
export default function SequenciaDiaList({
  seqDiaAtiva,
  confirmada,
  diaSequenciamento,
  filtroTipo,
  setFiltroTipo,
  handleReorderDiaTab,
  handleRemoverDoDia,
  handleRemoverTodos,
  setModalDisponiveisOpen,
  setEditOPModal,
}) {
  const filtroLabel = filtroTipo === 'todos' ? 'Todos' : filtroTipo === 'casa' ? 'Casa' : 'Cliente';

  return (
    <Card
      title={
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          Sequência — {diaSequenciamento.format('DD/MM')} • {filtroLabel}
          <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
            ({seqDiaAtiva.length} OPs)
          </Text>
        </span>
      }
      size="small"
      bodyStyle={{ padding: '8px 12px' }}
      extra={
        <Space size="small">
          {!confirmada && (
            <>
              <Button type="primary" onClick={() => setModalDisponiveisOpen(true)}>
                Adicionar OPs ao dia
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleRemoverTodos}>
                Remover todos
              </Button>
            </>
          )}
          {confirmada && (
            <Tag icon={<LockOutlined />}>Confirmada</Tag>
          )}
        </Space>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {['todos', 'casa', 'cliente'].map((tipo) => (
          <Button
            key={tipo}
            type={filtroTipo === tipo ? 'primary' : 'default'}
            size="small"
            onClick={() => setFiltroTipo(tipo)}
          >
            {tipo === 'todos' ? 'Todas' : tipo === 'casa' ? 'Casa' : 'Cliente'}
          </Button>
        ))}
      </div>
      <DragDropContext onDragEnd={handleReorderDiaTab}>
        <Droppable droppableId="sequencia-dia-tab" isDropDisabled={confirmada}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 60 }}>
              {seqDiaAtiva.map((op, index) => (
                <Draggable
                  key={op.id}
                  draggableId={String(op.id)}
                  index={index}
                  isDragDisabled={confirmada || seqDiaAtiva.length === 1}
                >
                  {(prov, snap) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 6px',
                        marginBottom: 2,
                        borderRadius: 4,
                        border: '1px solid #f0f0f0',
                        backgroundColor: snap.isDragging ? '#fafafa' : '#fff',
                        fontSize: 12,
                        ...prov.draggableProps.style,
                      }}
                    >
                      {seqDiaAtiva.length > 1 && (
                        <span {...prov.dragHandleProps} style={{ cursor: confirmada ? 'default' : 'grab' }}>
                          <HolderOutlined style={{ color: '#999', fontSize: 12 }} />
                        </span>
                      )}
                      {seqDiaAtiva.length === 1 && <span style={{ width: 16, display: 'inline-block' }} />}
                      <span style={{ width: 20, fontSize: 11, color: '#666' }}>{index + 1}.</span>
                      <Text strong style={{ fontFamily: 'monospace', width: 72, fontSize: 12 }}>
                        {op.codigo || op.numeroOPERP || '-'}
                      </Text>
                      {op.contingencia && (
                        <Tooltip title="OP criada manualmente (contingência)">
                          <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Manual</Tag>
                        </Tooltip>
                      )}
                      <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                        {op.produto || op.itens?.[0]?.descricaoItem || '-'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {op.liga || '-'} / {op.tempera || '-'}
                      </Text>
                      <Text style={{ fontSize: 11 }}>
                        {(op.quantidade != null && op.quantidade !== ''
                          ? Number(op.quantidade)
                          : (op.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadePecas) || 0), 0)
                        ).toLocaleString('pt-BR')}{' '}
                        kg
                      </Text>
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
                      {!confirmada && (
                        <Space size={0}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditOPModal({
                                op,
                                quantidade:
                                  op.quantidade ??
                                  (op.itens || []).reduce((s, i) => s + (Number(i.quantidadePecas) || 0), 0),
                                ferramentaCodigo: op.ferramenta?.codigo || op.recurso || '',
                              });
                            }}
                            style={{ padding: '0 4px' }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoverDoDia(op.id)}
                            style={{ padding: '0 4px' }}
                          />
                        </Space>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Follow-up:{' '}
        </Text>
        <Space size="small">
          <Tag style={{ margin: 0, fontSize: 10 }}>Prensa</Tag>
          <Tag style={{ margin: 0, fontSize: 10 }}>Serra</Tag>
          <Tag style={{ margin: 0, fontSize: 10 }}>Forno</Tag>
          <Tag style={{ margin: 0, fontSize: 10 }}>Esticadeira</Tag>
          <Tag style={{ margin: 0, fontSize: 10 }}>Embalagem</Tag>
        </Space>
      </div>
    </Card>
  );
}
