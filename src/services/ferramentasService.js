import ferramentasMock from '../mocks/ferramentas/ferramentas.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(200);

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...(ferramentasMock.data || [])];

    if (filtros.codigo) {
      filteredData = filteredData.filter((f) =>
        f.codigo?.toLowerCase().includes(String(filtros.codigo).toLowerCase())
      );
    }
    if (filtros.descricao) {
      filteredData = filteredData.filter((f) =>
        f.descricao?.toLowerCase().includes(String(filtros.descricao).toLowerCase())
      );
    }
    if (filtros.cod_perfil) {
      filteredData = filteredData.filter((f) => f.cod_perfil === filtros.cod_perfil);
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
    const item = ferramentasMock.data.find((f) => f.id === id);
    return {
      data: { data: item || null },
      success: !!item,
      message: item ? 'Success' : 'Ferramenta não encontrada',
    };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const existingIndex = ferramentasMock.data.findIndex((f) => f.id === payload.id);
    const newItem = {
      id: payload.id || Date.now(),
      codigo: payload.codigo || '',
      cod_perfil: payload.cod_perfil || '',
      descricao: payload.descricao || '',
      num_cavidades: payload.num_cavidades ?? 1,
      peso_real: payload.peso_real ?? 0,
      nitr_atual: payload.nitr_atual ?? 0,
      nitr_limite: payload.nitr_limite ?? 0,
      tempo_forno_min: payload.tempo_forno_min ?? 0,
      tempo_forno_max: payload.tempo_forno_max ?? 0,
      acompanhamento: payload.acompanhamento === true,
      motivo_acomp: payload.motivo_acomp || '',
    };
    if (existingIndex >= 0) {
      ferramentasMock.data[existingIndex] = { ...ferramentasMock.data[existingIndex], ...newItem };
    } else {
      ferramentasMock.data.push(newItem);
    }
    return {
      data: { data: newItem },
      success: true,
      message: payload.id ? 'Ferramenta atualizada com sucesso' : 'Ferramenta criada com sucesso',
    };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? parseInt(endpoint.split('/').pop(), 10);
    const idx = ferramentasMock.data.findIndex((f) => f.id === id);
    if (idx >= 0) {
      ferramentasMock.data.splice(idx, 1);
    }
    return {
      data: { id },
      success: true,
      message: 'Ferramenta excluída com sucesso',
    };
  }

  return {
    data: null,
    success: false,
    message: 'Endpoint não implementado',
  };
};

const FerramentasService = {
  getAll: async (requestData) => {
    try {
      return await getMockData('/ferramentas/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await getMockData(`/ferramentas/getById/${id}`);
    } catch (error) {
      throw error;
    }
  },

  upsert: async (payload) => {
    try {
      return await getMockData('/ferramentas/upsert', payload);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await getMockData('/ferramentas/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default FerramentasService;
