import React, { createContext, useContext, useState } from 'react';

/**
 * Contexto de sequenciamento por dia.
 * Formato de sequenciasPorDia[dateKey]: { ops: Array, preview?: Array<PreviewItem>, casaPct?: number, confirmada: boolean }
 * PreviewItem: id, opTotvsId, opPaiId?, opTotvsQuantidadeOriginal?, opTotvsCodigo, produto, cliente, liga, tempera, tipo, dataEntrega, quantidade, ferramentaSugerida, ferramentaManual?, semFerramenta
 */
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
