import React, { useCallback } from 'react';
import { Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

/**
 * Navegador de data com setas esquerda/direita para alterar o dia ou semana.
 * Reutilizável (ex.: Fila de Produção, Sequenciamento).
 *
 * @param {string} value - dateKey no formato 'YYYY-MM-DD'
 * @param {function} onChange - (newDateKey: string) => void
 * @param {string} mode - 'dia' (navega dia a dia) | 'semana' (navega semana a semana)
 * @param {string} format - formato de exibição no modo 'dia' (default: 'dddd DD/MM/YYYY')
 * @param {object} style - estilos adicionais
 */
const DateNavStepper = ({ value, onChange, mode = 'dia', format = 'dddd DD/MM/YYYY', style }) => {
  const dateKey = value || dayjs().format('YYYY-MM-DD');
  const d = dayjs(dateKey);

  const isSemana = mode === 'semana';

  const handlePrev = useCallback(() => {
    const next = isSemana ? d.subtract(1, 'week') : d.subtract(1, 'day');
    onChange?.(next.format('YYYY-MM-DD'));
  }, [dateKey, onChange, isSemana]);

  const handleNext = useCallback(() => {
    const next = isSemana ? d.add(1, 'week') : d.add(1, 'day');
    onChange?.(next.format('YYYY-MM-DD'));
  }, [dateKey, onChange, isSemana]);

  const displayText = d.isValid()
    ? isSemana
      ? `${d.startOf('week').format('DD/MM')} - ${d.startOf('week').add(6, 'day').format('DD/MM/YYYY')}`
      : d.format(format)
    : dateKey;

  return (
    <Space size={0} style={style}>
      <Button type="text" icon={<LeftOutlined />} onClick={handlePrev} aria-label={isSemana ? 'Semana anterior' : 'Dia anterior'} />
      <Typography.Text strong style={{ minWidth: 180, textAlign: 'center', display: 'inline-block' }}>
        {displayText}
      </Typography.Text>
      <Button type="text" icon={<RightOutlined />} onClick={handleNext} aria-label={isSemana ? 'Próxima semana' : 'Próximo dia'} />
    </Space>
  );
};

export default DateNavStepper;
