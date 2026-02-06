import React, { useCallback, useRef } from 'react';
import { Button, Typography } from 'antd';
import { FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import { AiOutlineFolderOpen } from 'react-icons/ai';

/**
 * FileDisplayInput - Input dinâmico para exibir/selecionar arquivo (nome ou caminho).
 * Variante e estilos configuráveis via formConfig (DynamicForm).
 * @param {string} value - Nome do arquivo ou caminho
 * @param {function} onChange - Chamado com o nome do arquivo ao selecionar
 * @param {string} variant - 'drawing' (área horizontal) | 'attachment' (caixa PDF)
 * @param {string} placeholder - Texto quando vazio (ex.: "Nenhum arquivo selecionado", "SEM ARQUIVO")
 * @param {string} accept - Atributo accept do input file
 * @param {boolean} disabled
 * @param {string} size
 * @param {Object} style - Estilos do container
 * @param {string} className
 * @param {Object} boxStyle - Estilos da caixa de exibição
 * @param {Object} areaStyle - Estilos da área (variant drawing)
 */
const FileDisplayInput = ({
  value = '',
  onChange,
  variant = 'attachment',
  placeholder = 'SEM ARQUIVO',
  accept,
  disabled = false,
  size = 'middle',
  style,
  className,
  boxStyle,
  areaStyle,
  ...rest
}) => {
  const inputRef = useRef(null);

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e) => {
      const file = e?.target?.files?.[0];
      if (file && onChange) onChange(file.name);
      if (e?.target) e.target.value = '';
    },
    [onChange]
  );

  const displayText = value || placeholder;

  if (variant === 'drawing') {
    const areaMerge = {
      minHeight: 140,
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      padding: 12,
      background: '#fafafa',
      ...areaStyle,
    };
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, ...style }} className={className} {...rest}>
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
        />
        <div style={{ flex: 1, ...areaMerge }}>
          {value ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Typography.Text>{displayText}</Typography.Text>
            </div>
          ) : (
            <Typography.Text type="secondary">{displayText}</Typography.Text>
          )}
        </div>
        <Button type="default" icon={<AiOutlineFolderOpen />} onClick={handleClick} size={size} disabled={disabled} />
      </div>
    );
  }

  // variant === 'attachment'
  const boxMerge = {
    width: 100,
    height: 90,
    minWidth: 100,
    minHeight: 88,
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
    flexShrink: 0,
    ...boxStyle,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 88, ...style }} className={className} {...rest}>
      <input
        type="file"
        ref={inputRef}
        style={{ display: 'none' }}
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div style={boxMerge}>
        <FilePdfOutlined style={{ fontSize: 28, color: value ? '#1890ff' : '#bfbfbf' }} />
        <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
          {displayText}
        </Typography.Text>
      </div>
      <Button type="default" icon={<AiOutlineFolderOpen />} onClick={handleClick} size={size} disabled={disabled} />
    </div>
  );
};

export default React.memo(FileDisplayInput);
