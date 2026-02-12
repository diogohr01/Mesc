import { Collapse } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles/colors';

const StyledWrapper = styled.div`
  .filter-collapse.ant-collapse {
    border: none !important;
    border-radius: 8px;
    background: ${colors.background} !important;
  }
  .filter-collapse.ant-collapse > .ant-collapse-item {
    border-bottom: none !important;
  }
  .filter-collapse.ant-collapse > .ant-collapse-item:last-child {
    border-bottom: none !important;
  }
  .filter-collapse .ant-collapse-header {
    border: none !important;
    background: transparent !important;
    padding: 8px 0 8px 12px !important;
  }
  .filter-collapse .ant-collapse-content {
    border-top: none !important;
  }
  .filter-collapse .ant-collapse-content-box {
    border: none !important;
    background: transparent !important;
  }
`;

/**
 * Collapse estilizado para secções de filtros (ex.: DynamicForm com collapseAsFilter).
 * Estilos e padrão de cor ficam no próprio componente.
 */
const FilterCollapse = ({
  children,
  header = 'Filtros',
  defaultOpen = true,
  className = '',
  ...rest
}) => (
  <StyledWrapper>
    <Collapse
      className={`filter-collapse ${className}`.trim()}
      defaultActiveKey={defaultOpen ? ['filtros'] : []}
      {...rest}
    >
      <Collapse.Panel header={header} key="filtros">
        {children}
      </Collapse.Panel>
    </Collapse>
  </StyledWrapper>
);

export default FilterCollapse;
