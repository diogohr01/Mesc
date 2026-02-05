import React, { memo, useCallback, useState } from 'react';
import List from './List';
import View from './View';

const GestaoUsuarios = () => {
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

export default memo(GestaoUsuarios);
