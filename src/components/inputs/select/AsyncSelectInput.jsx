import React, { useCallback, useState } from 'react';
import { Select } from 'antd';

/**
 * Select que carrega opções ao pesquisar (busca sob demanda).
 * Não carrega valores no mount; opções vêm apenas após o usuário digitar em onSearch.
 */
const AsyncSelectInput = ({
  value = null,
  onChange,
  placeholder = 'Pesquise para carregar opções...',
  disabled = false,
  size = 'middle',
  allowClear = true,
  showSearch = true,
  fetchOptionsOnSearch = async () => [],
  style,
  className,
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    async (term) => {
      if (term == null || String(term).trim() === '') {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchOptionsOnSearch(String(term).trim());
        setOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('AsyncSelectInput fetch error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchOptionsOnSearch]
  );

  const handleChange = (val) => {
    if (onChange) onChange(val);
  };

  // Se há valor mas não está nas opções (ex.: valor vindo do backend), exibir o valor como única opção
  const displayOptions =
    value != null && value !== '' && !options.some((o) => o.value === value)
      ? [{ label: String(value), value }, ...options]
      : options;

  return (
    <Select
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      size={size}
      style={{ width: '100%', ...style }}
      className={className}
      options={displayOptions}
      allowClear={allowClear}
      showSearch={showSearch}
      filterOption={false}
      onSearch={handleSearch}
      loading={loading}
      notFoundContent={loading ? 'Carregando...' : 'Digite para pesquisar'}
      {...props}
    />
  );
};

export default AsyncSelectInput;
