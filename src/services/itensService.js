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
    if (typeof filtros.ativo === 'boolean') {
      filteredData = filteredData.filter((item) => item.ativo === filtros.ativo);
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
      descricao: payload.descricao || '',
      unidade: payload.unidade || 'UN',
      observacoes: payload.observacoes || '',
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

const ItensService = {
  getAll: async (requestData) => {
    try {
      const mockResponse = await getMockData('/itens/getAll', requestData);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },

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
