import React, { memo } from 'react';
import { Card as AntCard, Typography } from 'antd';
import { colors } from '../../../styles/colors.js';

const { Text } = Typography;

const DEFAULT_HEADER_STYLE = {
  padding: '16px 24px',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
};

/**
 * Card unificado: header padrão (title, subtitle, extra) e repasse de props ao Ant Design Card.
 * Qualquer alteração de visual do header fica só aqui.
 * @param {React.ReactNode} [props.title] - Título (string ou ReactNode)
 * @param {React.ReactNode|string} [props.subtitle] - Subtítulo
 * @param {React.ReactNode} [props.extra] - Conteúdo à direita do header (botões, etc.)
 * @param {Object} [props.styles] - Merge com estilos padrão (ex.: styles.header)
 * @param {string} [props.variant] - 'default' | 'borderless' | 'outlined' (default: 'borderless')
 */
const Card = memo(({
  children,
  title,
  subtitle,
  extra,
  header,
  footer,
  loading = false,
  bordered = false,
  hoverable = false,
  size = 'default',
  variant = 'borderless',
  style = {},
  className = '',
  onClick,
  clickable = false,
  icon,
  description,
  styles: stylesProp,
  ...rest
}) => {
  const hasHeader = !!(title != null && title !== '' || extra || header);

  const mergedStyles = {
    ...(stylesProp || {}),
    header: hasHeader
      ? { ...DEFAULT_HEADER_STYLE, ...(stylesProp?.header || {}) }
      : (stylesProp?.header || {}),
  };

  const titleNode =
    header ||
    (title != null && title !== '') ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ color: colors.primary }}>{icon}</span>}
          {typeof title === 'string' ? (
            <span style={{ fontSize: 18, fontWeight: 600, color: colors.text.primary }}>{title}</span>
          ) : (
            title
          )}
        </div>
        {(subtitle != null && subtitle !== '') && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {subtitle}
          </Text>
        )}
        {(description != null && description !== '' && subtitle == null) && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Text>
        )}
      </div>
    ) : undefined;

  return (
    <AntCard
      title={header ? header : (titleNode != null ? titleNode : (extra ? '' : undefined))}
      extra={extra}
      loading={loading}
      bordered={bordered}
      hoverable={hoverable}
      size={size}
      variant={variant}
      style={style}
      className={className}
      onClick={onClick}
      styles={mergedStyles}
      {...rest}
    >
      {footer ? (
        <>
          <div style={{ minHeight: '40px' }}>{children}</div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            {footer}
          </div>
        </>
      ) : (
        children
      )}
    </AntCard>
  );
});

Card.displayName = 'Card';

export default Card;
