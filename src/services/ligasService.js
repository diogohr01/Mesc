import ligasMock from '../mocks/ligas/ligas.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...(ligasMock.data || [])];
    if (filtros.cod_liga) {
      filteredData = filteredData.filter((l) =>
        l.cod_liga?.toLowerCase().includes(String(filtros.cod_liga).toLowerCase())
      );
    }
    if (filtros.descricao) {
      filteredData = filteredData.filter((l) =>
        l.descricao?.toLowerCase().includes(String(filtros.descricao).toLowerCase())
      );
    }
    const start = (page - 1) * pageSize;
    const paginatedData = filteredData.slice(start, start + pageSize);
    return {
      data: { data: paginatedData, pagination: { totalRecords: filteredData.length, page, pageSize } },
      success: true,
      message: 'Success',
    };
  }

  if (endpoint.includes('getById')) {
    const id = parseInt(endpoint.split('/').pop(), 10);
    const item = ligasMock.data.find((l) => l.id === id);
    return { data: { data: item || null }, success: !!item, message: item ? 'Success' : 'Liga não encontrada' };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const existingIndex = ligasMock.data.findIndex((l) => l.id === payload.id);
    const newItem = {
      id: payload.id || Date.now(),
      cod_liga: payload.cod_liga || '',
      descricao: payload.descricao || '',
      composicao: payload.composicao || '',
      propriedades: payload.propriedades || '',
    };
    if (existingIndex >= 0) {
      ligasMock.data[existingIndex] = { ...ligasMock.data[existingIndex], ...newItem };
    } else {
      ligasMock.data.push(newItem);
    }
    return { data: { data: newItem }, success: true, message: payload.id ? 'Liga atualizada com sucesso' : 'Liga criada com sucesso' };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? parseInt(endpoint.split('/').pop(), 10);
    const idx = ligasMock.data.findIndex((l) => l.id === id);
    if (idx >= 0) ligasMock.data.splice(idx, 1);
    return { data: { id }, success: true, message: 'Liga excluída com sucesso' };
  }

  return { data: null, success: false, message: 'Endpoint não implementado' };
};

const LigasService = {
  getAll: async (requestData) => {
    try {
      return await getMockData('/ligas/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      return await getMockData(`/ligas/getById/${id}`);
    } catch (error) {
      throw error;
    }
  },
  upsert: async (payload) => {
    try {
      return await getMockData('/ligas/upsert', payload);
    } catch (error) {
      throw error;
    }
  },
  delete: async (id) => {
    try {
      return await getMockData('/ligas/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default LigasService;
