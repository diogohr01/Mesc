import React, { forwardRef } from 'react';

/**
 * Container com barra de rolagem estilizada (maior, visível).
 * Use em qualquer div que precise de scroll (Gantt, tabelas, etc.).
 * Aceita as mesmas props de um div (style, className, children, etc.) e encaminha ref.
 */
const StyledScroll = forwardRef(({ className = '', style, children, ...rest }, ref) => (
  <div
    ref={ref}
    className={`app-styled-scroll ${className}`.trim()}
    style={style}
    {...rest}
  >
    {children}
  </div>
));

StyledScroll.displayName = 'StyledScroll';

export default StyledScroll;
