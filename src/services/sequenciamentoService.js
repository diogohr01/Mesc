import sequenciamentosMock from '../mocks/sequenciamento/sequenciamentos.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(300);
  const dataSource = sequenciamentosMock.data;

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...dataSource];

    if (filtros.nome) {
      filteredData = filteredData.filter((item) =>
        item.nome?.toLowerCase().includes(String(filtros.nome).toLowerCase())
      );
    }
    if (filtros.descricao) {
      filteredData = filteredData.filter((item) =>
        item.descricao?.toLowerCase().includes(String(filtros.descricao).toLowerCase())
      );
    }
    if (filtros.search) {
      const term = String(filtros.search).toLowerCase().trim();
      if (term) {
        filteredData = filteredData.filter(
          (item) =>
            item.nome?.toLowerCase().includes(term) ||
            item.descricao?.toLowerCase().includes(term)
        );
      }
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
    const item = dataSource.find((i) => i.id === id);
    return {
      data: { data: item ? { ...item } : null },
      success: !!item,
      message: item ? 'Success' : 'Cenário não encontrado',
    };
  }

  if (endpoint.includes('upsert')) {
    const payload = data || {};
    const existingIndex = dataSource.findIndex((i) => i.id === payload.id);
    const newItem = {
      id: payload.id || Date.now(),
      nome: payload.nome || '',
      descricao: payload.descricao || '',
      criterios: Array.isArray(payload.criterios) && payload.criterios.length
        ? payload.criterios.map((c) => ({ id: c.id, label: c.label, value: c.value ?? 0 }))
        : payload.criterios || [],
    };
    if (existingIndex >= 0) {
      dataSource[existingIndex] = { ...dataSource[existingIndex], ...newItem };
    } else {
      dataSource.push(newItem);
    }
    return {
      data: { data: newItem },
      success: true,
      message: payload.id ? 'Cenário atualizado com sucesso' : 'Cenário criado com sucesso',
    };
  }

  if (endpoint.includes('delete')) {
    const id = data?.id ?? parseInt(endpoint.split('/').pop(), 10);
    const idx = dataSource.findIndex((i) => i.id === id);
    if (idx >= 0) {
      dataSource.splice(idx, 1);
    }
    return {
      data: { id },
      success: true,
      message: 'Cenário excluído com sucesso',
    };
  }

  return {
    data: null,
    success: false,
    message: 'Endpoint não implementado',
  };
};

const SequenciamentoService = {
  getAll: async (requestData) => {
    try {
      return await getMockData('/sequenciamento/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await getMockData(`/sequenciamento/getById/${id}`);
    } catch (error) {
      throw error;
    }
  },

  upsert: async (payload) => {
    try {
      return await getMockData('/sequenciamento/upsert', payload);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await getMockData('/sequenciamento/delete', { id });
    } catch (error) {
      throw error;
    }
  },
};

export default SequenciamentoService;
