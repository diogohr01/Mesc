import Api from './api';
import itensMock from '../mocks/itens/itens.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...itensMock.data];

    if (filtros.codigo) {
      filteredData = filteredData.filter((item) =>
        item.codigo?.toString().toLowerCase().includes(String(filtros.codigo).toLowerCase())
      );
    }
    if (filtros.descricao) {
      filteredData = filteredData.filter((item) =>
        item.descricao?.toLowerCase().includes(String(filtros.descricao).toLowerCase())
      );
    }
    if (filtros.unidade) {
      filteredData = filteredData.filter((item) =>
        item.unidade?.toString().toLowerCase().includes(String(filtros.unidade).toLowerCase())
      );
    }
    if (filtros.liga) {
      filteredData = filteredData.filter((item) =>
        String(item.liga || '').toLowerCase().includes(String(filtros.liga).toLowerCase())
      );
    }
    if (filtros.tempera) {
      filteredData = filteredData.filter((item) =>
        String(item.tempera || '').toLowerCase() === String(filtros.tempera).toLowerCase()
      );
    }
    if (typeof filtros.ativo === 'boolean') {
      filteredData = filteredData.filter((item) => item.ativo === filtros.ativo);
    }
    // Filtros por coluna (múltiplos valores): filter_liga, filter_tempera como arrays
    if (Array.isArray(filtros.filter_liga) && filtros.filter_liga.length > 0) {
      const set = new Set(filtros.filter_liga.map((v) => String(v).toLowerCase()));
      filteredData = filteredData.filter((item) => set.has(String(item.liga || '').toLowerCase()));
    }
    if (Array.isArray(filtros.filter_tempera) && filtros.filter_tempera.length > 0) {
      const set = new Set(filtros.filter_tempera.map((v) => String(v).toLowerCase()));
      filteredData = filteredData.filter((item) => set.has(String(item.tempera || '').toLowerCase()));
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredData.slice(start, end);

    return {
      data: {
        data: paginatedData,
        pagination: {
          totalRecords: filteredData.length,
          page,
          pageSize,
        },
      },
      success: true,
      message: 'Success',
    };
  }

  if (endpoint.includes('getById')) {
    const id = parseInt(endpoint.split('/').pop(), 10);
    const item = itensMock.data.find((i) => i.id === id);
    return {
      data: { data: item || null },
      success: !!item,
      message: item ? 'Success' : 'Item não encontrado',
    };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const existingIndex = itensMock.data.findIndex((i) => i.id === payload.id);
    const newItem = {
      id: payload.id || Date.now(),
      codigo: payload.codigo || '',
      cod_ferramenta: payload.cod_ferramenta || '',
      descricao: payload.descricao || '',
      liga: payload.liga || '',
      tempera: payload.tempera || '',
      unidade: payload.unidade || 'UN',
      observacoes: payload.observacoes || '',
      leadtime_producao: payload.leadtime_producao ?? 0,
      leadtime_entrega: payload.leadtime_entrega ?? 0,
      tipo_acabamento: payload.tipo_acabamento || 'nenhum',
      peso_unitario: payload.peso_unitario ?? 0,
      percentual_perda: payload.percentual_perda ?? payload.percentualPerda ?? 0,
      ativo: payload.ativo !== false,
    };
    if (existingIndex >= 0) {
      itensMock.data[existingIndex] = { ...itensMock.data[existingIndex], ...newItem };
    } else {
      itensMock.data.push(newItem);
    }
    return {
      data: { data: newItem },
      success: true,
      message: payload.id ? 'Item atualizado com sucesso' : 'Item criado com sucesso',
    };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? parseInt(endpoint.split('/').pop(), 10);
    const idx = itensMock.data.findIndex((i) => i.id === id);
    if (idx >= 0) {
      itensMock.data.splice(idx, 1);
    }
    return {
      data: { id },
      success: true,
      message: 'Item excluído com sucesso',
    };
  }

  return {
    data: null,
    success: false,
    message: 'Endpoint não implementado',
  };
};

/**
 * Devolve valores distintos de uma coluna (sobre o dataset completo). Para uso no filtro por coluna (PaginatedTable).
 * @param {string} columnKey - dataIndex da coluna (ex.: 'liga', 'tempera', 'unidade')
 * @returns {Promise<Array<{ text: string, value: string }>>}
 */
const getDistinctValues = async (columnKey) => {
  await delay(150);
  const list = itensMock.data || [];
  const key = String(columnKey || '').trim();
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const raw = item[key];
    const value = raw == null ? '' : String(raw).trim();
    const text = value || '(vazio)';
    if (seen.has(value)) continue;
    seen.add(value);
    out.push({ text, value });
  }
  out.sort((a, b) => a.text.localeCompare(b.text));
  return out;
};

const ItensService = {
  getAll: async (requestData) => {
    try {
      const mockResponse = await getMockData('/itens/getAll', requestData);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },

  getDistinctValues,

  getById: async (id) => {
    try {
      const mockResponse = await getMockData(`/itens/getById/${id}`);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },

  upsert: async (itemData) => {
    try {
      const mockResponse = await getMockData('/itens/upsert', itemData);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const mockResponse = await getMockData('/itens/delete', { id });
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },
};

export default ItensService;
