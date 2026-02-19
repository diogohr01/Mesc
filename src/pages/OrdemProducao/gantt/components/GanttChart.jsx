import React, { memo, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Loading, StyledScroll } from '../../../../components';
import { getBarPosition, positionToDate } from '../../../../hooks/useGanttTime';

const LANE_HEIGHT = 76;
const HEADER_HEIGHT = 34;
const RESOURCE_COL_WIDTH = 180;

function getBarColor(filha, pai) {
  const today = dayjs();
  const dataFim = filha.dataFim ? dayjs(filha.dataFim) : null;
  const dataEntrega = filha.dataEntrega ? dayjs(filha.dataEntrega) : null;

  if (filha.status === 'concluida') return { bg: 'hsl(142, 50%, 35%)', label: 'No prazo' };
  if (filha.status === 'cancelada') return { bg: 'hsl(0, 10%, 30%)', label: 'Cancelada' };

  if (dataEntrega && dataFim && dataFim.isAfter(dataEntrega)) {
    return { bg: 'hsl(0, 72%, 48%)', label: 'Atrasada' };
  }
  if (dataEntrega && dataEntrega.isBefore(today)) {
    return { bg: 'hsl(0, 72%, 48%)', label: 'Atrasada' };
  }
  if (dataEntrega && dataFim) {
    const diffDays = dataEntrega.diff(dataFim, 'day', true);
    if (diffDays <= 2 && diffDays >= 0) {
      return { bg: 'hsl(38, 92%, 50%)', label: 'Risco' };
    }
  }
  if (['na_prensa', 'no_forno', 'na_embalagem'].includes(filha.status)) {
    return { bg: 'hsl(142, 71%, 40%)', label: 'Em produção' };
  }
  if (filha.status === 'programada') return { bg: 'hsl(210, 100%, 52%)', label: 'Programada' };
  return { bg: 'hsl(220, 10%, 40%)', label: 'Não programada' };
}

const GanttBar = memo(function GanttBar({
  filha,
  pai,
  timeConfig,
  showSetups,
  selectedOP,
  onSelectOP,
  onMoveOP,
  handleMouseDown,
}) {
  const barStart = dayjs(filha.dataInicio);
  const barEnd = dayjs(filha.dataFim);
  const pos = getBarPosition(
    timeConfig.startDate,
    barStart,
    barEnd,
    timeConfig.totalWidth,
    timeConfig.endDate
  );
  const { bg: barColor, label: riskLabel } = getBarColor(filha, pai);
  const isSelected = selectedOP === filha.id;
  const isLate = riskLabel === 'Atrasada';
  const isRisk = riskLabel === 'Risco';

  const totalDays =
    timeConfig.endDate.valueOf() - timeConfig.startDate.valueOf()
      ? (timeConfig.endDate.valueOf() - timeConfig.startDate.valueOf()) / (1000 * 60 * 60 * 24)
      : 1;
  const setupWidth =
    showSetups && filha.setupMinutos && filha.setupMinutos > 0
      ? Math.max(
          (filha.setupMinutos / (24 * 60)) * (timeConfig.totalWidth / totalDays),
          4
        )
      : 0;

  const deadlinePos = filha.dataEntrega
    ? getBarPosition(
        timeConfig.startDate,
        dayjs(filha.dataEntrega),
        dayjs(filha.dataEntrega),
        timeConfig.totalWidth,
        timeConfig.endDate
      )
    : null;

  const tooltipTitle = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{filha.codigo}</span>
        <span
          style={{
            fontSize: 8,
            padding: '2px 6px',
            borderRadius: 2,
            fontWeight: 700,
            backgroundColor: `${barColor}40`,
            color: isLate ? 'hsl(0, 72%, 60%)' : barColor,
          }}
        >
          {riskLabel}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 10 }}>
        <span style={{ color: '#8c8c8c' }}>OP Totvs:</span>
        <span style={{ fontFamily: 'monospace' }}>{pai.codigo}</span>
        <span style={{ color: '#8c8c8c' }}>Produto:</span>
        <span>{pai.produto}</span>
        <span style={{ color: '#8c8c8c' }}>Liga/Têmpera:</span>
        <span style={{ fontFamily: 'monospace' }}>{pai.liga}/{pai.tempera}</span>
        <span style={{ color: '#8c8c8c' }}>Qtd:</span>
        <span style={{ fontFamily: 'monospace' }}>{filha.quantidade.toLocaleString()}</span>
        <span style={{ color: '#8c8c8c' }}>Entrega:</span>
        <span style={{ fontFamily: 'monospace', fontWeight: isLate ? 700 : 400, color: isLate ? '#ff4d4f' : 'inherit' }}>
          {filha.dataEntrega || '—'}
        </span>
        <span style={{ color: '#8c8c8c' }}>Início:</span>
        <span style={{ fontFamily: 'monospace' }}>{filha.dataInicio}</span>
        <span style={{ color: '#8c8c8c' }}>Fim:</span>
        <span style={{ fontFamily: 'monospace' }}>{filha.dataFim}</span>
        <span style={{ color: '#8c8c8c' }}>Score:</span>
        <span style={{ fontWeight: 700 }}>{filha.score}</span>
      </div>
      {isLate && (
        <p style={{ fontSize: 9, color: '#ff4d4f', fontWeight: 700, margin: '8px 0 0 0' }}>
          PROGRAMAÇÃO NÃO ATINGE DATA DE ENTREGA
        </p>
      )}
      <p style={{ fontSize: 8, color: '#8c8c8c', margin: '8px 0 0 0', fontStyle: 'italic' }}>
        Arraste para re-sequenciar • Clique para editar
      </p>
    </div>
  );

  return (
    <div>
      {setupWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: pos.left - setupWidth,
            width: setupWidth,
            height: LANE_HEIGHT - 24,
            borderRadius: 2,
            zIndex: 2,
            backgroundColor: 'rgba(0,0,0,0.08)',
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 6px)',
          }}
          title={`Setup: ${filha.setupTipo} (${filha.setupMinutos}min)`}
        />
      )}

      <Tooltip title={tooltipTitle} placement="top">
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: pos.left,
            width: Math.max(pos.width, 24),
            height: LANE_HEIGHT - 16,
            backgroundColor: barColor,
            borderRadius: 4,
            cursor: 'grab',
            userSelect: 'none',
            zIndex: 3,
            boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none',
            boxSizing: 'border-box',
            borderLeft:
              isLate
                ? '3px solid hsl(0, 90%, 60%)'
                : isRisk
                  ? '3px solid hsl(38, 92%, 60%)'
                  : 'none',
            transition: 'box-shadow 0.15s ease-out',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectOP(isSelected ? null : filha.id);
          }}
          onMouseDown={(e) => handleMouseDown(e, filha)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              paddingLeft: 8,
              paddingRight: 8,
              overflow: 'hidden',
              gap: 6,
            }}
          >
            {(isLate || isRisk) && (
              <span style={{ fontSize: 11, flexShrink: 0 }}>⚠</span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 1px rgba(0,0,0,0.2)',
              }}
            >
              {filha.codigo.split('-').slice(-1)[0]}
            </span>
            {pos.width > 70 && (
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                }}
              >
                {pai.liga}
              </span>
            )}
            {pos.width > 110 && (
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  marginLeft: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {filha.quantidade.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Tooltip>

      {deadlinePos && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: deadlinePos.left,
            width: 2,
            zIndex: 2,
            pointerEvents: 'none',
            backgroundColor: isLate ? 'hsl(0, 72%, 55%)' : 'rgba(0,0,0,0.15)',
            opacity: 0.7,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: -3,
              width: 8,
              height: 8,
              transform: 'rotate(45deg)',
              backgroundColor: isLate ? 'hsl(0, 72%, 55%)' : 'rgba(0,0,0,0.2)',
            }}
          />
        </div>
      )}
    </div>
  );
});

function GanttChart({
  recursos,
  barras,
  manutencoes,
  timeConfig,
  showSetups,
  showExcecoes,
  loadingBars,
  selectedOP,
  onSelectOP,
  onMoveOP,
}) {
  const scrollRef = useRef(null);
  const timelineRef = useRef(null);
  const overlayRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const lastDragOffsetRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef(null);

  const todayPos = useMemo(() => {
    const now = dayjs();
    return getBarPosition(
      timeConfig.startDate,
      now,
      now,
      timeConfig.totalWidth,
      timeConfig.endDate
    );
  }, [timeConfig]);

  const barsByRecurso = useMemo(
    () =>
      recursos.map((recurso) => ({
        recurso,
        bars: barras.filter((b) => b.filha.recurso === recurso.nome),
        manutencoes: manutencoes.filter((m) => m.recursoId === recurso.id),
      })),
    [barras, manutencoes, recursos]
  );

  const headerHeight = timeConfig.hasSubHeader ? HEADER_HEIGHT * 2 : HEADER_HEIGHT + 8;

  const handleMouseDown = useCallback(
    (e, filha) => {
      if (!filha.dataInicio || !filha.dataFim) return;
      e.preventDefault();
      e.stopPropagation();
      const barStart = dayjs(filha.dataInicio);
      const barEnd = dayjs(filha.dataFim);
      const pos = getBarPosition(
        timeConfig.startDate,
        barStart,
        barEnd,
        timeConfig.totalWidth,
        timeConfig.endDate
      );
      const recursoIdx = recursos.findIndex((r) => r.nome === filha.recurso);
      setDragging({
        filhaId: filha.id,
        startX: e.clientX,
        startY: e.clientY,
        originalLeft: pos.left,
        barWidth: pos.width,
        originalStart: barStart,
        originalEnd: barEnd,
        originalRecurso: filha.recurso,
        currentRecursoIdx: recursoIdx,
      });
      lastDragOffsetRef.current = { x: 0, y: 0 };
    },
    [timeConfig, recursos]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragging.startX;
      lastDragOffsetRef.current = { x: dx, y: e.clientY - dragging.startY };
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (overlayRef.current) {
            overlayRef.current.style.transform = `translateX(${lastDragOffsetRef.current.x}px)`;
          }
          rafIdRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      const dx = lastDragOffsetRef.current.x;
      const newLeftPx = dragging.originalLeft + dx;
      const newStart = positionToDate(
        newLeftPx,
        timeConfig.startDate,
        timeConfig.totalWidth,
        timeConfig.endDate
      );
      const durationMs = dragging.originalEnd.valueOf() - dragging.originalStart.valueOf();
      const newEnd = newStart.add(durationMs, 'millisecond');
      onMoveOP(dragging.filhaId, newStart, newEnd);
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, timeConfig, onMoveOP]);


  if (loadingBars) {
    return <Loading small useSkeleton message="Carregando barras..." />;
  }
  
  return (
    <div
      style={{
        display: 'flex',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          borderRight: '1px solid #f0f0f0',
          zIndex: 10,
          backgroundColor: '#fff',
          width: RESOURCE_COL_WIDTH,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 8,
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: 'rgba(0,0,0,0.02)',
            height: headerHeight,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recurso
          </span>
        </div>
        {recursos.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 16,
              paddingRight: 16,
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              height: LANE_HEIGHT,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#262626', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.nome}
              </p>
              <p style={{ fontSize: 11, color: '#8c8c8c', margin: 0 }}>{r.capacidade}</p>
            </div>
            {r.status === 'manutencao' && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  backgroundColor: 'rgba(255,77,79,0.2)',
                  color: '#ff4d4f',
                  padding: '4px 6px',
                  borderRadius: 2,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                MAINT
              </span>
            )}
          </div>
        ))}
      </div>

      <StyledScroll style={{ overflowX: 'auto', flex: 1 }} ref={scrollRef}>
        <div style={{ position: 'relative', width: timeConfig.totalWidth, minWidth: '100%' }} ref={timelineRef}>
          <div
            style={{
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: 'rgba(0,0,0,0.02)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              height: headerHeight,
            }}
          >
            {timeConfig.hasSubHeader && timeConfig.dayGroups && timeConfig.dayGroups.length > 0 && (
              <div style={{ display: 'flex', height: HEADER_HEIGHT }}>
                {timeConfig.dayGroups.map((group, i) => (
                  <div
                    key={i}
                    style={{
                      borderRight: '1px solid rgba(0,0,0,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      width: group.colSpan * timeConfig.cellWidth,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#262626', textTransform: 'capitalize' }}>
                      {group.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                height: timeConfig.hasSubHeader ? HEADER_HEIGHT : headerHeight,
              }}
            >
              {timeConfig.columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    width: timeConfig.cellWidth,
                  }}
                >
                  <span style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>{col.label}</span>
                  {col.subLabel && (
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{col.subLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {dragging && (() => {
            const barEntry = barras.find((b) => b.filha.id === dragging.filhaId);
            if (!barEntry) return null;
            const { filha, pai } = barEntry;
            const { bg: barColor, label: riskLabel } = getBarColor(filha, pai);
            const isLate = riskLabel === 'Atrasada';
            const isRisk = riskLabel === 'Risco';
            return (
              <div
                ref={overlayRef}
                style={{
                  position: 'absolute',
                  left: dragging.originalLeft,
                  top: headerHeight + dragging.currentRecursoIdx * LANE_HEIGHT + 8,
                  width: Math.max(dragging.barWidth, 24),
                  height: LANE_HEIGHT - 16,
                  backgroundColor: barColor,
                  borderRadius: 4,
                  zIndex: 20,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 8,
                  paddingRight: 8,
                  overflow: 'hidden',
                  gap: 6,
                  boxSizing: 'border-box',
                  borderLeft: isLate ? '3px solid hsl(0, 90%, 60%)' : isRisk ? '3px solid hsl(38, 92%, 60%)' : 'none',
                }}
              >
                {(isLate || isRisk) && <span style={{ fontSize: 11, flexShrink: 0 }}>⚠</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                  {filha.codigo.split('-').slice(-1)[0]}
                </span>
                {dragging.barWidth > 70 && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {pai.liga}
                  </span>
                )}
              </div>
            );
          })()}

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: todayPos.left,
              width: 2,
              height: headerHeight + recursos.length * LANE_HEIGHT,
              backgroundColor: '#385E9D',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -22,
                left: -14,
                fontSize: 11,
                fontWeight: 700,
                color: '#385E9D',
                backgroundColor: 'rgba(56,94,157,0.2)',
                padding: '4px 6px',
                borderRadius: 2,
              }}
            >
              HOJE
            </div>
          </div>

          {barsByRecurso.map(({ recurso, bars: laneBars, manutencoes: laneManutencoes }, recursoIdx) => (
              <div
                key={recurso.id}
                style={{
                  position: 'relative',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  height: LANE_HEIGHT,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    pointerEvents: 'none',
                  }}
                >
                  {timeConfig.columns.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        borderRight: '1px solid rgba(0,0,0,0.04)',
                        flexShrink: 0,
                        height: '100%',
                        width: timeConfig.cellWidth,
                      }}
                    />
                  ))}
                </div>

                {showExcecoes &&
                  laneManutencoes.map((m) => {
                    const mStart = dayjs(m.dataInicio);
                    const mEnd = dayjs(m.dataFim);
                    const pos = getBarPosition(
                      timeConfig.startDate,
                      mStart,
                      mEnd,
                      timeConfig.totalWidth,
                      timeConfig.endDate
                    );
                    return (
                      <Tooltip
                        key={m.id}
                        title={
                          <div>
                            <p style={{ fontWeight: 600, color: m.tipo === 'excecao' ? '#faad14' : '#ff4d4f', margin: '0 0 4px 0' }}>
                              {m.tipo === 'excecao' ? 'Exceção de calendário' : m.tipo === 'manutencao' ? 'Manutenção' : 'Parada'}
                            </p>
                            <p style={{ margin: 0, fontSize: 11 }}>{m.descricao}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: 11, fontFamily: 'monospace' }}>
                              {m.dataInicio} → {m.dataFim}
                            </p>
                          </div>
                        }
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 4,
                            bottom: 4,
                            left: pos.left,
                            width: Math.max(pos.width, 8),
                            borderRadius: 2,
                            opacity: 0.3,
                            zIndex: 1,
                            backgroundColor: m.tipo === 'excecao' ? 'hsl(38, 92%, 50%)' : m.tipo === 'manutencao' ? 'hsl(0, 72%, 48%)' : 'hsl(38, 92%, 50%)',
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 6px)',
                          }}
                        />
                      </Tooltip>
                    );
                  })}

                {laneBars.map(({ filha, pai }) => {
                  if (!filha.dataInicio || !filha.dataFim) return null;
                  if (dragging?.filhaId === filha.id) return null;
                  return (
                    <GanttBar
                      key={filha.id}
                      filha={filha}
                      pai={pai}
                      timeConfig={timeConfig}
                      showSetups={showSetups}
                      selectedOP={selectedOP}
                      onSelectOP={onSelectOP}
                      onMoveOP={onMoveOP}
                      handleMouseDown={handleMouseDown}
                    />
                  );
                })}
              </div>
          ))}
        </div>
      </StyledScroll>
    </div>
  );
}

export default memo(GanttChart);
