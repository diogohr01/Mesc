import dayjs from 'dayjs';
import excecoesFerramentasMock from '../mocks/excecoesFerramentas/excecoesFerramentas.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toDataStr = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return dayjs(v).format('YYYY-MM-DD');
};

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getById')) {
    const id = data ?? endpoint.split('/').pop();
    const item = excecoesFerramentasMock.data.find((l) => l.id === id);
    return { data: { data: item || null }, success: !!item, message: item ? 'Success' : 'Exceção não encontrada' };
  }

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10 } = data || {};
    const raw = [...(excecoesFerramentasMock.data || [])];
    const start = (page - 1) * pageSize;
    const paginatedData = raw.slice(start, start + pageSize);
    return {
      data: { data: paginatedData, pagination: { totalRecords: raw.length, page, pageSize } },
      success: true,
      message: 'Success',
    };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const dataStr = toDataStr(payload.data) || (payload.id ? null : new Date().toISOString().slice(0, 10));
    if (!payload.ferramentaCodigo || payload.quantidadeExtra == null || payload.quantidadeExtra <= 0 || !payload.motivo?.trim()) {
      return { data: null, success: false, message: 'Ferramenta, quantidade extra e motivo são obrigatórios.' };
    }
    const newItem = {
      id: payload.id || `ef${Date.now()}`,
      ferramentaCodigo: payload.ferramentaCodigo,
      quantidadeExtra: Number(payload.quantidadeExtra) || 0,
      motivo: (payload.motivo || '').trim(),
      aprovadoPor: (payload.aprovadoPor || '').trim(),
      data: dataStr || new Date().toISOString().slice(0, 10),
      ativo: payload.ativo !== false && payload.ativo !== 'false',
    };
    const existingIndex = excecoesFerramentasMock.data.findIndex((l) => l.id === payload.id);
    if (existingIndex >= 0) {
      excecoesFerramentasMock.data[existingIndex] = { ...excecoesFerramentasMock.data[existingIndex], ...newItem };
    } else {
      excecoesFerramentasMock.data.push(newItem);
    }
    return { data: { data: newItem }, success: true, message: payload.id ? 'Exceção atualizada com sucesso' : 'Exceção criada com sucesso' };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? (typeof endpoint.split('/').pop() === 'string' ? endpoint.split('/').pop() : null);
    const idx = excecoesFerramentasMock.data.findIndex((l) => l.id === id);
    if (idx >= 0) excecoesFerramentasMock.data.splice(idx, 1);
    return { data: { id }, success: true, message: 'Exceção excluída com sucesso' };
  }

  return { data: null, success: false, message: 'Endpoint não implementado' };
};

const ExcecoesFerramentasService = {
  getById: async (id) => {
    try {
      return await getMockData(`/excecoesFerramentas/getById/${id}`, id);
    } catch (error) {
      throw error;
    }
  },
  getAll: async (requestData) => {
    try {
      return await getMockData('/excecoesFerramentas/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },
  upsert: async (payload) => {
    try {
      return await getMockData('/excecoesFerramentas/upsert', payload);
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      return await getMockData('/excecoesFerramentas/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default ExcecoesFerramentasService;
