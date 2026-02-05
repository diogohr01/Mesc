import usuariosMock from '../mocks/usuarios/usuarios.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(300);

  if (endpoint.includes('getAll')) {
    const { page = 1, pageSize = 10, ...filtros } = data || {};
    let filteredData = [...(usuariosMock.data || [])];
    if (filtros.nome) {
      filteredData = filteredData.filter((u) =>
        u.nome?.toLowerCase().includes(String(filtros.nome).toLowerCase())
      );
    }
    if (filtros.email) {
      filteredData = filteredData.filter((u) =>
        u.email?.toLowerCase().includes(String(filtros.email).toLowerCase())
      );
    }
    if (filtros.perfil) {
      filteredData = filteredData.filter((u) => u.perfil === filtros.perfil);
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
    const item = usuariosMock.data.find((u) => u.id === id);
    return { data: { data: item || null }, success: !!item, message: item ? 'Success' : 'Usuário não encontrado' };
  }

  return { data: null, success: false, message: 'Endpoint não implementado' };
};

const UsuariosService = {
  getAll: async (requestData) => {
    try {
      return await getMockData('/usuarios/getAll', requestData);
    } catch (error) {
      throw error;
    }
  },
  getById: async (id) => {
    try {
      return await getMockData(`/usuarios/getById/${id}`);
    } catch (error) {
      throw error;
    }
  },
};

export default UsuariosService;
