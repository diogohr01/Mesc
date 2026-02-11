import React, { memo, useState } from 'react';
import { Button, DatePicker, Popover, Space } from 'antd';
import { CalendarOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { colors } from '../../styles/colors';

dayjs.locale('pt-br');

const TIPOS = ['todos', 'hoje', 'semana', 'mes'];
const LABELS = { todos: 'Todos', hoje: 'Hoje', semana: 'Semana', mes: 'Mês' };

const defaultValue = { tipo: 'todos', range: null };

/**
 * Retorna dataInicio e dataFim (YYYY-MM-DD) a partir do value do period para enviar à API.
 * @param {{ tipo: string, range: [dayjs, dayjs] | null }} period
 * @returns {{ dataInicio: string | undefined, dataFim: string | undefined }}
 */
export function periodToDataRange(period) {
  if (!period || period.tipo === 'todos' || !period.range || !Array.isArray(period.range)) {
    return { dataInicio: undefined, dataFim: undefined };
  }
  const [from, to] = period.range;
  if (!from || !to) return { dataInicio: undefined, dataFim: undefined };
  return {
    dataInicio: dayjs(from).format('YYYY-MM-DD'),
    dataFim: dayjs(to).format('YYYY-MM-DD'),
  };
}

const PeriodFilter = memo(({ value = defaultValue, onChange }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const activeTipo = value?.tipo ?? 'todos';
  const range = value?.range ?? null;

  const handlePeriodClick = (tipo) => {
    if (tipo === 'personalizado') {
      setPopoverOpen(true);
      return;
    }
    const today = dayjs();
    let newRange = null;
    if (tipo === 'hoje') {
      newRange = [today.startOf('day'), today.endOf('day')];
    } else if (tipo === 'semana') {
      newRange = [today.startOf('week'), today.endOf('week')];
    } else if (tipo === 'mes') {
      newRange = [today.startOf('month'), today.endOf('month')];
    }
    onChange?.({ tipo, range: newRange });
  };

  const handleCustomSelect = (dates) => {
    if (!dates || !dates[0] || !dates[1]) return;
    onChange?.({ tipo: 'personalizado', range: [dates[0], dates[1]] });
    setPopoverOpen(false);
  };

  const customLabel =
    activeTipo === 'personalizado' && range?.[0] && range?.[1]
      ? `${dayjs(range[0]).format('DD/MM')} — ${dayjs(range[1]).format('DD/MM')}`
      : 'Período';

  const content = (
    <DatePicker.RangePicker
      value={range}
      onChange={handleCustomSelect}
      locale={undefined}
      style={{ margin: 8 }}
      allowClear={false}
    />
  );

  return (
    <Space size="small" wrap style={{ alignItems: 'center' }}>
      {TIPOS.map((tipo) => (
        <Button
          key={tipo}
          type={activeTipo === tipo ? 'primary' : 'default'}
          onClick={() => handlePeriodClick(tipo)}
          style={activeTipo === tipo ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
        >
          {LABELS[tipo]}
        </Button>
      ))}
      <Popover
        content={content}
        trigger="click"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
      >
        <Button
          type={activeTipo === 'personalizado' ? 'primary' : 'default'}
          size="middle"
          icon={<DownOutlined />}
          onClick={() => setPopoverOpen(true)}
          style={activeTipo === 'personalizado' ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
        >
          {customLabel}
        </Button>
      </Popover>
    </Space>
  );
});

PeriodFilter.displayName = 'PeriodFilter';

export default PeriodFilter;
