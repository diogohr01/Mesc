import React, { useState, useEffect, useCallback } from 'react';
import { Slider, Typography } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '../../../../styles/colors';

const { Text } = Typography;

const ZoomControlWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: ${colors.backgroundGray || '#f0f0f0'};
  border-radius: 8px;

  .ant-slider-rail {
    background: ${colors.backgroundGray} !important;
  }
  .ant-slider-track {
    background: ${colors.primary} !important;
  }
  .ant-slider-handle {
    background: ${colors.primary} !important;
    border-color: ${colors.primary} !important;
  }
  .ant-slider-handle:hover,
  .ant-slider-handle:focus {
    border-color: ${colors.primary} !important;
    box-shadow: 0 0 0 2px ${colors.primary}33 !important;
  }
`;

const MIN = 1;   // 100%
const MAX = 4;   // 400%
const STEP = 0.1;

/**
 * Controle de zoom estilo pill: ícones zoom out/in, slider e percentagem.
 * Track azul escuro (primary), handle circular, container cinza claro arredondado.
 */
function GanttZoomPresets({ zoomScale, onZoomScaleChange, min = MIN, max = MAX, step = STEP }) {
  const [localScale, setLocalScale] = useState(zoomScale);

  useEffect(() => {
    setLocalScale(zoomScale);
  }, [zoomScale]);

  const percent = Math.round(localScale * 100);

  const handleZoomOut = useCallback(() => {
    const next = Math.max(min, localScale - STEP);
    setLocalScale(next);
    onZoomScaleChange(next);
  }, [localScale, min, onZoomScaleChange]);

  const handleZoomIn = useCallback(() => {
    const next = Math.min(max, localScale + STEP);
    setLocalScale(next);
    onZoomScaleChange(next);
  }, [localScale, max, onZoomScaleChange]);

  return (
    <ZoomControlWrapper>
      <ZoomOutOutlined
        style={{ fontSize: 14, color: colors.text.secondary, cursor: 'pointer' }}
        onClick={handleZoomOut}
      />
      <Slider
        min={min}
        max={max}
        step={step}
        value={localScale}
        onChange={setLocalScale}
        onAfterChange={(v) => onZoomScaleChange(v)}
        style={{ width: 120, margin: 0, flexShrink: 0 }}
        tooltip={{ formatter: (v) => `${Math.round(Number(v) * 100)}%` }}
      />
      <ZoomInOutlined
        style={{ fontSize: 14, color: colors.text.secondary, cursor: 'pointer' }}
        onClick={handleZoomIn}
      />
      <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace', minWidth: 36 }}>
        {percent}%
      </Text>
    </ZoomControlWrapper>
  );
}

export default GanttZoomPresets;
