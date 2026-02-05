import perfisMock from '../mocks/perfis/perfis.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...perfisMock.data];

    if (filtros.cod_perfil) {
      filteredData = filteredData.filter((p) =>
        p.cod_perfil?.toLowerCase().includes(String(filtros.cod_perfil).toLowerCase())
      );
    }
    if (filtros.descricao) {
      filteredData = filteredData.filter((p) =>
        p.descricao?.toLowerCase().includes(String(filtros.descricao).toLowerCase())
      );
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
    const item = perfisMock.data.find((p) => p.id === id);
    return {
      data: { data: item || null },
      success: !!item,
      message: item ? 'Success' : 'Perfil não encontrado',
    };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const existingIndex = perfisMock.data.findIndex((p) => p.id === payload.id);
    const newItem = {
      id: payload.id || Date.now(),
      cod_perfil: payload.cod_perfil || '',
      descricao: payload.descricao || '',
      gramatura: payload.gramatura ?? 0,
      peso_nominal: payload.peso_nominal ?? 0,
      caminho_desenho: payload.caminho_desenho || '',
      anexo_perfil: payload.anexo_perfil || '',
      embalamento: payload.embalamento || '',
      observacoes: payload.observacoes || '',
      dimensionais: Array.isArray(payload.dimensionais) ? payload.dimensionais : [],
    };
    if (existingIndex >= 0) {
      perfisMock.data[existingIndex] = { ...perfisMock.data[existingIndex], ...newItem };
    } else {
      perfisMock.data.push(newItem);
    }
    return {
      data: { data: newItem },
      success: true,
      message: payload.id ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso',
    };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? parseInt(endpoint.split('/').pop(), 10);
    const idx = perfisMock.data.findIndex((p) => p.id === id);
    if (idx >= 0) {
      perfisMock.data.splice(idx, 1);
    }
    return {
      data: { id },
      success: true,
      message: 'Perfil excluído com sucesso',
    };
  }

  return {
    data: null,
    success: false,
    message: 'Endpoint não implementado',
  };
};

const PerfisService = {
  getAll: async (requestData) => {
    try {
      return await getMockData('/perfis/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await getMockData(`/perfis/getById/${id}`);
    } catch (error) {
      throw error;
    }
  },

  upsert: async (payload) => {
    try {
      return await getMockData('/perfis/upsert', payload);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await getMockData('/perfis/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default PerfisService;
