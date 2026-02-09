/**
 * Mock de OPs e status para o Dashboard do Planejador.
 * Estrutura alinhada à visão de sequenciamento (status, score, dataEntrega).
 */

export const statusLabels = {
  rascunho: 'Rascunho',
  sequenciada: 'Sequenciada',
  confirmada: 'Confirmada',
  em_producao: 'Em Produção',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

/** Cores para Tag do Ant Design (success, processing, warning, error, default) ou uso em estilo */
export const statusColors = {
  rascunho: 'default',
  sequenciada: 'processing',
  confirmada: 'blue',
  em_producao: 'orange',
  concluida: 'success',
  cancelada: 'default',
};

export const mockOPs = [
  { id: 1, codigo: 'OP-001', status: 'em_producao', dataEntrega: '2025-02-15', score: 92, produto: 'Tubo Retang. 20x35', cliente: 'Cliente A' },
  { id: 2, codigo: 'OP-002', status: 'sequenciada', dataEntrega: '2025-02-18', score: 88, produto: 'Perfil 6063 T6', cliente: 'Cliente B' },
  { id: 3, codigo: 'OP-003', status: 'confirmada', dataEntrega: '2025-02-10', score: 45, produto: 'Barra 10mm', cliente: 'Cliente C' },
  { id: 4, codigo: 'OP-004', status: 'concluida', dataEntrega: '2025-02-01', score: 78, produto: 'Cantoneira', cliente: 'Cliente A' },
  { id: 5, codigo: 'OP-005', status: 'em_producao', dataEntrega: '2025-02-20', score: 95, produto: 'Tubo Quadrado', cliente: 'Cliente D' },
  { id: 6, codigo: 'OP-006', status: 'rascunho', dataEntrega: '2025-03-01', score: 70, produto: 'Perfil Especial', cliente: 'Cliente B' },
  { id: 7, codigo: 'OP-007', status: 'sequenciada', dataEntrega: '2025-02-12', score: 82, produto: 'Barra 12mm', cliente: 'Cliente C' },
  { id: 8, codigo: 'OP-008', status: 'concluida', dataEntrega: '2025-01-28', score: 90, produto: 'Tubo 25mm', cliente: 'Cliente A' },
  { id: 9, codigo: 'OP-009', status: 'em_producao', dataEntrega: '2025-02-08', score: 62, produto: 'Perfil 6082', cliente: 'Cliente D' },
  { id: 10, codigo: 'OP-010', status: 'confirmada', dataEntrega: '2025-02-22', score: 75, produto: 'Cantoneira L', cliente: 'Cliente B' },
];
