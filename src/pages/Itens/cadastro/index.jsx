import React, { useState, useCallback, memo } from 'react';
import List from './List';
import View from './View';

// Itens vêm do TOTVS: apenas visualização (sem novo/editar/excluir).
const ItensCadastro = () => {
  const [view, setView] = useState('list');
  const [viewingRecord, setViewingRecord] = useState(null);

  const handleView = useCallback((record) => {
    setViewingRecord(record);
    setView('view');
  }, []);

  const handleCancel = useCallback(() => {
    setView('list');
    setViewingRecord(null);
  }, []);

  return (
    <>
      {view === 'list' && <List onView={handleView} />}
      {view === 'view' && (
        <View record={viewingRecord} onCancel={handleCancel} />
      )}
    </>
  );
};

export default memo(ItensCadastro);
