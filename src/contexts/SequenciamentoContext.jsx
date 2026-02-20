import React, { createContext, useContext, useState } from 'react';

const SequenciamentoContext = createContext(null);

export function SequenciamentoProvider({ children }) {
  const [sequenciasPorDia, setSequenciasPorDia] = useState({});

  const value = {
    sequenciasPorDia,
    setSequenciasPorDia,
  };

  return (
    <SequenciamentoContext.Provider value={value}>
      {children}
    </SequenciamentoContext.Provider>
  );
}

export function useSequenciamento() {
  const ctx = useContext(SequenciamentoContext);
  if (!ctx) {
    throw new Error('useSequenciamento must be used within SequenciamentoProvider');
  }
  return ctx;
}
