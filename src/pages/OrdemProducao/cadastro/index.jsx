import React, { useState, useCallback, memo } from 'react';
import List from './List';
import AddEdit from './AddEdit';
import View from './View';

const OrdemProducaoCadastro = () => {
  const [view, setView] = useState('list');
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setViewingRecord(null);
    setView('form');
  }, []);

  const handleEdit = useCallback((record) => {
    setEditingRecord(record);
    setViewingRecord(null);
    setView('form');
  }, []);

  const handleView = useCallback((record) => {
    setViewingRecord(record);
    setEditingRecord(null);
    setView('view');
  }, []);

  const handleCancel = useCallback(() => {
    setView('list');
    setEditingRecord(null);
    setViewingRecord(null);
  }, []);

  const handleSave = useCallback(() => {
    setView('list');
    setEditingRecord(null);
    setViewingRecord(null);
  }, []);

  const handleCopy = useCallback((copiedRecord) => {
    setEditingRecord(copiedRecord);
    setViewingRecord(null);
    setView('form');
  }, []);

  const handleAtivarDesativar = useCallback(() => {
    // Recarregar lista se necessário
    setView('list');
    setEditingRecord(null);
    setViewingRecord(null);
  }, []);

  return (
    <>
      {view === 'list' && (
        <List 
          onAdd={handleAdd} 
          onEdit={handleEdit}
          onView={handleView}
        />
      )}
      {view === 'form' && (
        <AddEdit
          editingRecord={editingRecord}
          onCancel={handleCancel}
          onSave={handleSave}
          onEdit={handleEdit}
          onView={handleView}
        />
      )}
      {view === 'view' && (
        <View
          record={viewingRecord}
          onEdit={() => handleEdit(viewingRecord)}
          onCancel={handleCancel}
          onCopy={handleCopy}
          onAtivarDesativar={handleAtivarDesativar}
        />
      )}
    </>
  );
};

export default memo(OrdemProducaoCadastro);
