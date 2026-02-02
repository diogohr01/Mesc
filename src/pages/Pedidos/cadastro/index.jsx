import React, { useState, useCallback, memo } from 'react';
import List from './List';
import AddEdit from './AddEdit';
import View from './View';

const PedidosCadastro = () => {
  const [view, setView] = useState('list');
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

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
    setView('list');
    setEditingRecord(null);
    setViewingRecord(null);
  }, []);

  return (
    <>
      {view === 'list' && (
        <List
          onEdit={handleEdit}
          onView={handleView}
        />
      )}
      {view === 'form' && (
        <AddEdit 
          editingRecord={editingRecord}
          onCancel={handleCancel}
          onSave={handleSave}
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

export default memo(PedidosCadastro);
