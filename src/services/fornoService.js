import fornoMock from '../mocks/forno/forno.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMockData = async (endpoint) => {
  await delay(200);
  if (endpoint.includes('getAll') || endpoint.includes('listar')) {
    const list = fornoMock.data || [];
    return {
      data: { data: list },
      success: true,
      message: 'Success',
    };
  }
  return { data: null, success: false, message: 'Endpoint não implementado' };
};

const FornoService = {
  getAll: async () => {
    try {
      return await getMockData('/forno/getAll');
    } catch (error) {
      throw error;
    }
  },
};

export default FornoService;
