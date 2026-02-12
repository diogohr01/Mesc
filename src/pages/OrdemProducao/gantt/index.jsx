import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Select, Slider, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CalendarFilled,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ToolOutlined,
  WarningOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Layout } from 'antd';

const { Content } = Layout;
import OrdemProducaoService from '../../../services/ordemProducaoService';
import { statusLabels } from '../../../constants/ordemProducaoStatus';
import { StyledScroll } from '../../../components';
import GanttChart from './components/GanttChart';
import GanttLegend from './components/GanttLegend';
import GanttDetailPanel from './components/GanttDetailPanel';
import { useGanttTime } from '../../../hooks/useGanttTime';
import { toast } from '../../../helpers/toast';
import { colors } from '../../../styles/colors';

const zoomOptions = [
  { key: 'hora', label: 'Hora', icon: ClockCircleOutlined },
  { key: 'dia', label: 'Dia', icon: CalendarOutlined },
  { key: 'semana', label: 'Semana', icon: CalendarFilled },
  { key: 'mes', label: 'Mês', icon: CalendarOutlined },
];

function cloneOPs(ops) {
  return ops.map((op) => ({
    ...op,
    filhas: op.filhas.map((f) => ({ ...f })),
  }));
}

const SCALE_MIN = 0.1;
const SCALE_MAX = 6;
const SCALE_STEP = 0.2;

const zoomPresets = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
  { label: '200%', value: 2 },
  { label: '400%', value: 4 },
];

const statuses = [
  'todos',
  'rascunho',
  'sequenciada',
  'aguardando_confirmacao',
  'confirmada',
  'em_producao',
  'concluida',
];

const GanttProducao = () => {
  const [zoom, setZoom] = useState('dia');
  const [showSetups, setShowSetups] = useState(true);
  const [showExcecoes, setShowExcecoes] = useState(true);
  const [onlyConfirmadas, setOnlyConfirmadas] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [recursoFilter, setRecursoFilter] = useState('todos');
  const [selectedOP, setSelectedOP] = useState(null);
  const [opsData, setOpsData] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [loadingBars, setLoadingBars] = useState(false);
  const [manutencoes, setManutencoes] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const ganttAreaRef = useRef(null);

  useEffect(() => {
    setLoadingBars(true);
    OrdemProducaoService.getDadosGantt().then((res) => {
      if (res.success && res.data) {
        setOpsData(res.data.opsGantt ? cloneOPs(res.data.opsGantt) : []);
        setRecursos(res.data.recursos || []);
        setManutencoes(res.data.manutencoes || []);
        setLoadingBars(false);
      }
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomScale((s) => Math.min(Math.round((s + SCALE_STEP) * 100) / 100, SCALE_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((s) => Math.max(Math.round((s - SCALE_STEP) * 100) / 100, SCALE_MIN));
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomScale((s) => {
        const next = Math.round((s + delta) * 100) / 100;
        return Math.max(SCALE_MIN, Math.min(SCALE_MAX, next));
      });
    }
  }, []);

  const handleClosePanel = useCallback(() => setSelectedOP(null), []);

  const scalePercent = Math.round(zoomScale * 100);

  const { rangeStart, rangeEnd } = useMemo(() => {
    let min = dayjs();
    let max = dayjs();
    opsData.forEach((op) => {
      op.filhas.forEach((f) => {
        if (f.dataInicio) {
          const d = dayjs(f.dataInicio);
          if (d.isBefore(min)) min = d;
        }
        if (f.dataFim) {
          const d = dayjs(f.dataFim);
          if (d.isAfter(max)) max = d;
        }
      });
    });
    return { rangeStart: min.subtract(2, 'day'), rangeEnd: max.add(3, 'day') };
  }, [opsData]);

  const timeConfig = useGanttTime(zoom, rangeStart, rangeEnd, zoomScale);

  const filteredRecursos = useMemo(() => {

    if (recursoFilter === 'todos') return recursos;
    return recursos.filter((r) => r.id === recursoFilter);
  }, [recursoFilter, recursos]);

  const barras = useMemo(() => {
    return opsData.flatMap((op) =>
      op.filhas
        .filter((f) => {
          if (onlyConfirmadas && f.status !== 'confirmada' && f.status !== 'em_producao')
            return false;
          if (statusFilter !== 'todos' && f.status !== statusFilter) return false;
          if (recursoFilter !== 'todos') {
            const recurso = recursos.find((r) => r.id === recursoFilter);
            if (recurso && f.recurso !== recurso.nome) return false;
          }
          return f.dataInicio && f.dataFim;
        })
        .map((f) => ({ filha: f, pai: op }))
    );
  }, [opsData, onlyConfirmadas, statusFilter, recursoFilter]);

  const selectedData = useMemo(() => {
    if (!selectedOP) return null;
    for (const op of opsData) {
      const filha = op.filhas.find((f) => f.id === selectedOP);
      if (filha) return { filha, pai: op };
    }
    return null;
  }, [selectedOP, opsData]);

  const recalculateDownstream = useCallback((ops, movedFilhaId, recurso) => {
    const allFilhas = [];
    ops.forEach((op, opIdx) => {
      op.filhas.forEach((f, filhaIdx) => {
        if (f.recurso === recurso && f.dataInicio && f.dataFim) {
          allFilhas.push({ filha: f, opIdx, filhaIdx });
        }
      });
    });

    allFilhas.sort((a, b) => {
      const aStart = dayjs(a.filha.dataInicio).valueOf();
      const bStart = dayjs(b.filha.dataInicio).valueOf();
      return aStart - bStart;
    });

    for (let i = 0; i < allFilhas.length - 1; i++) {
      const current = allFilhas[i];
      const next = allFilhas[i + 1];
      const currentEnd = dayjs(current.filha.dataFim);
      const currentSetup = current.filha.setupMinutos || 0;
      const nextStart = dayjs(next.filha.dataInicio);
      const nextDuration = dayjs(next.filha.dataFim).valueOf() - nextStart.valueOf();
      const minNextStart = currentEnd.add(currentSetup * 60 * 1000, 'millisecond');

      if (nextStart.isBefore(minNextStart)) {
        const newNextStart = minNextStart;
        const newNextEnd = newNextStart.add(nextDuration, 'millisecond');
        ops[next.opIdx].filhas[next.filhaIdx].dataInicio = newNextStart.format('YYYY-MM-DD');
        ops[next.opIdx].filhas[next.filhaIdx].dataFim = newNextEnd.format('YYYY-MM-DD');
      }
    }
    return ops;
  }, []);

  const handleMoveOP = useCallback(
    (filhaId, newStart, newEnd) => {
      setOpsData((prev) => {
        const ops = cloneOPs(prev);
        let movedRecurso = '';
        for (const op of ops) {
          const filha = op.filhas.find((f) => f.id === filhaId);
          if (filha) {
            filha.dataInicio = dayjs(newStart).format('YYYY-MM-DD');
            filha.dataFim = dayjs(newEnd).format('YYYY-MM-DD');
            movedRecurso = filha.recurso;
            break;
          }
        }
        if (movedRecurso) {
          recalculateDownstream(ops, filhaId, movedRecurso);
        }
        return ops;
      });
      toast.info('OP re-sequenciada', 'OPs subsequentes foram recalculadas.');
    },
    [recalculateDownstream]
  );

  const handleUpdateOP = useCallback(
    (filhaId, updates) => {
      setOpsData((prev) => {
        const ops = cloneOPs(prev);
        for (const op of ops) {
          const filha = op.filhas.find((f) => f.id === filhaId);
          if (filha) {
            Object.assign(filha, updates);
            if (updates.dataInicio || updates.dataFim) {
              recalculateDownstream(ops, filhaId, filha.recurso);
            }
            break;
          }
        }
        return ops;
      });
    },
    [recalculateDownstream]
  );

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
    ...(isFullscreen
      ? {
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          backgroundColor: colors.background,
          padding: 16,
        }
      : {}),
  };

  return (
    <Layout>
      <Content>
        <div style={containerStyle} ref={ganttAreaRef} onWheel={handleWheel}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: colors.text.primary, fontSize: 20 }}>
                Gantt de Produção
              </Typography.Title>
              {!isFullscreen && (
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  Arraste as OPs para re-sequenciar • Clique para editar
                </Typography.Text>
              )}
            </div>
            <Space size="middle" wrap>
            
              <Space size={8}>
                {zoomPresets.map((p) => (
                  <Button
                    key={p.value}
                    type={Math.abs(zoomScale - p.value) < 0.05 ? 'primary' : 'default'}
                    size="middle"
                    onClick={() => setZoomScale(p.value)}
                    style={{ fontSize: 13, fontFamily: 'monospace', padding: '4px 10px' }}
                  >
                    {p.label}
                  </Button>
                ))}
              </Space>
              <Button
                size="middle"
                icon={isFullscreen ? <FullscreenExitOutlined style={{ fontSize: 16 }} /> : <FullscreenOutlined style={{ fontSize: 16 }} />}
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Sair do fullscreen' : 'Tela cheia'}
                style={{ padding: '4px 12px' }}
              >
                {isFullscreen ? 'Sair' : 'Tela cheia'}
              </Button>
            </Space>
          </div>

          <Space size="middle" wrap style={{ flexShrink: 0 }}>
            <Button.Group size="middle">
              {zoomOptions.map((z) => {
                const Icon = z.icon;
                return (
                  <Button
                    key={z.key}
                    type={zoom === z.key ? 'primary' : 'default'}
                    icon={<Icon style={{ fontSize: 18 }} />}
                    onClick={() => setZoom(z.key)}
                    style={{ padding: '4px 14px', fontSize: 14 }}
                  >
                    {z.label}
                  </Button>
                );
              })}
            </Button.Group>
            <Button
              size="middle"
              type={showSetups ? 'default' : 'text'}
              icon={<ToolOutlined style={{ fontSize: 16 }} />}
              onClick={() => setShowSetups(!showSetups)}
              style={{ padding: '4px 14px', fontSize: 14 }}
            >
              Setups
            </Button>
            <Button
              size="middle"
              type={showExcecoes ? 'default' : 'text'}
              icon={<WarningOutlined style={{ fontSize: 16 }} />}
              onClick={() => setShowExcecoes(!showExcecoes)}
              style={{ padding: '4px 14px', fontSize: 14 }}
            >
              Exceções
            </Button>
            <Button
              size="middle"
              type={onlyConfirmadas ? 'primary' : 'default'}
              icon={onlyConfirmadas ? <EyeOutlined style={{ fontSize: 16 }} /> : <EyeInvisibleOutlined style={{ fontSize: 16 }} />}
              onClick={() => setOnlyConfirmadas(!onlyConfirmadas)}
              style={{ padding: '4px 14px', fontSize: 14 }}
            >
              Só Confirmadas
            </Button>
            <Space.Compact size="middle">
              <FilterOutlined style={{ color: colors.text.secondary, fontSize: 18, marginRight: 4 }} />
              <Select
                value={recursoFilter}
                onChange={setRecursoFilter}
                style={{ width: 200, fontSize: 14 }}
                size="middle"
                options={[
                  { value: 'todos', label: 'Todos os recursos' },
                  ...recursos.map((r) => ({ value: r.id, label: r.nome })),
                ]}
              />
            </Space.Compact>
          </Space>

          <Space size={8} wrap style={{ flexShrink: 0 }}>
            {statuses.map((s) => (
              <Button
                key={s}
                size="middle"
                type={statusFilter === s ? 'primary' : 'default'}
                onClick={() => setStatusFilter(s)}
                style={{ padding: '4px 14px', fontSize: 14 }}
              >
                {s === 'todos' ? 'Todos' : statusLabels[s] || s}
              </Button>
            ))}
          </Space>

          <div
            style={{
              display: 'flex',
              gap: 0,
              overflow: 'hidden',
              flex: isFullscreen ? 1 : undefined,
              minHeight: isFullscreen ? 0 : 'calc(100vh - 300px)',
            }}
          >
            <StyledScroll style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
              <GanttChart
                recursos={filteredRecursos}
                barras={barras}
                manutencoes={manutencoes}
                timeConfig={timeConfig}
                loadingBars={loadingBars}
                showSetups={showSetups}
                showExcecoes={showExcecoes}
                selectedOP={selectedOP}
                onSelectOP={setSelectedOP}
                onMoveOP={handleMoveOP}
              />
            </StyledScroll>
            <AnimatePresence mode="wait">
              {selectedData && (
                <motion.div
                  key={selectedData.filha.id}
                  initial={{ x: 24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 24, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  style={{ flexShrink: 0 }}
                >
                  <GanttDetailPanel
                    filha={selectedData.filha}
                    pai={selectedData.pai}
                    onClose={handleClosePanel}
                    onUpdate={handleUpdateOP}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flexShrink: 0 }}>
            <GanttLegend />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default GanttProducao;
