import ferramentasMock from '../mocks/ferramentas/ferramentas.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint, data) => {
  await delay(200);

  if (endpoint.includes('getAll')) {
    const list = ferramentasMock.data || [];
    return {
      data: {
        data: list,
        pagination: {
          totalRecords: list.length,
          page: 1,
          pageSize: list.length,
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

  return {
    data: null,
    success: false,
    message: 'Endpoint não implementado',
  };
};

const FerramentasService = {
  getAll: async (requestData) => {
    try {
      const mockResponse = await getMockData('/ferramentas/getAll', requestData);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const mockResponse = await getMockData(`/ferramentas/getById/${id}`);
      return mockResponse;
    } catch (error) {
      throw error;
    }
  },
};

export default FerramentasService;
