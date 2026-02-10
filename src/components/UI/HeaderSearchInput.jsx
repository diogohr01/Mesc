import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { colors } from '../../styles/colors';

const wrapperStyle = {
  width: 350,
  maxWidth: '100%',
  borderRadius: 8,
  boxShadow: 'none',
};

const inputStyles = {
  background: 'transparent',
  border: 'none',
  color: colors.white,
  fontSize: 14,
};

/**
 * Input de pesquisa no header (fundo primaryLight, texto/borda do layout).
 */
function HeaderSearchInput({ placeholder = 'Pesquisar', onSearch, value, onChange, style, ...rest }) {
  return (
    <Input
      className="header-search-input"
      placeholder={placeholder}
      prefix={<SearchOutlined style={{ color: colors.layout.headerText, fontSize: 14, marginRight: 7 }} />}
      onPressEnter={(e) => onSearch?.(e.target?.value)}
      value={value}
      onChange={onChange}
      allowClear={{ clearIcon: <span style={{ color: colors.layout.headerText }}>✕</span> }}
      style={{...wrapperStyle, ...style}}
      styles={{
        input: inputStyles,
      }}
      {...rest}
    />
  );
}

export default HeaderSearchInput;
