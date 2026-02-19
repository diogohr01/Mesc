import dayjs from 'dayjs';
import excecoesCapacidadeMock from '../mocks/excecoesCapacidade/excecoesCapacidade.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const CONFIG_CAPACIDADE = { casaPctPadrao: 70, clientePctPadrao: 30 };

const toDataStr = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return dayjs(v).format('YYYY-MM-DD');
};

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getById')) {
    const id = data ?? endpoint.split('/').pop();
    const item = excecoesCapacidadeMock.data.find((l) => l.id === id);
    return { data: { data: item || null }, success: !!item, message: item ? 'Success' : 'Exceção não encontrada' };
  }

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10 } = data || {};
    const raw = [...(excecoesCapacidadeMock.data || [])];
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
    const dataStr = toDataStr(payload.data);
    if (!dataStr || !payload.motivo) {
      return { data: null, success: false, message: 'Data e motivo são obrigatórios.' };
    }
    const casaPct = Number(payload.casaPct) ?? CONFIG_CAPACIDADE.casaPctPadrao;
    const clientePct = 100 - casaPct;
    const newItem = {
      id: payload.id || `ec${Date.now()}`,
      data: dataStr,
      casaPct,
      clientePct,
      motivo: payload.motivo || '',
    };
    const existingIndex = excecoesCapacidadeMock.data.findIndex((l) => l.id === payload.id);
    if (existingIndex >= 0) {
      excecoesCapacidadeMock.data[existingIndex] = { ...excecoesCapacidadeMock.data[existingIndex], ...newItem };
    } else {
      excecoesCapacidadeMock.data.push(newItem);
    }
    return { data: { data: newItem }, success: true, message: payload.id ? 'Exceção atualizada com sucesso' : 'Exceção criada com sucesso' };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? (typeof endpoint.split('/').pop() === 'string' ? endpoint.split('/').pop() : null);
    const idx = excecoesCapacidadeMock.data.findIndex((l) => l.id === id);
    if (idx >= 0) excecoesCapacidadeMock.data.splice(idx, 1);
    return { data: { id }, success: true, message: 'Exceção excluída com sucesso' };
  }

  return { data: null, success: false, message: 'Endpoint não implementado' };
};

const ExcecoesCapacidadeService = {
  getById: async (id) => {
    try {
      return await getMockData(`/excecoesCapacidade/getById/${id}`, id);
    } catch (error) {
      throw error;
    }
  },
  getAll: async (requestData) => {
    try {
      return await getMockData('/excecoesCapacidade/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },
  upsert: async (payload) => {
    try {
      return await getMockData('/excecoesCapacidade/upsert', payload);
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      return await getMockData('/excecoesCapacidade/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default ExcecoesCapacidadeService;
