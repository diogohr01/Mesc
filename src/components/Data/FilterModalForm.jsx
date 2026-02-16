import React from 'react';
import { Button, Modal } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { AiOutlineSearch } from 'react-icons/ai';
import DynamicForm from './Form';

/**
 * Botão "Filtrar" + Modal com DynamicForm (padrão Kanban).
 * Estado do modal é controlado pelo pai (open, onOpenChange).
 */
const FilterModalForm = ({
  open,
  onOpenChange,
  formConfig,
  formInstance,
  onSubmit,
  isPrimary = true,
  secondaryButton = null,
  submitText = 'Aplicar',
  submitIcon = <AiOutlineSearch />,
  buttonText = 'Filtrar',
  buttonIcon = <FilterOutlined />,
}) => (
  <>
    <Button type={isPrimary ? 'primary' : 'default'} icon={buttonIcon} onClick={() => onOpenChange(true)}>
      {buttonText}
    </Button>
    <Modal
      title="Filtrar"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={800}
      destroyOnClose
    >
      <DynamicForm
        formConfig={formConfig}
        formInstance={formInstance}
        submitText={submitText}
        submitIcon={submitIcon}
        submitOnSide
        onClose={null}
        onSubmit={onSubmit}
        secondaryButton={secondaryButton}
      />
    </Modal>
  </>
);

export default FilterModalForm;
