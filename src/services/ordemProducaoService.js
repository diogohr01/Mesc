import Api from './api';
import ordensProducaoMock from '../mocks/ordemProducao/ordensProducao.json';
import historicoAlteracoesMock from '../mocks/ordemProducao/historicoAlteracoes.json';

// Função auxiliar para simular delay da API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para buscar dados mockados
const getMockData = async (endpoint, data) => {
    await delay(300); // Simula delay de rede
    
    if (endpoint.includes('getAll')) {
        const { page = 1, pageSize = 10, ...filtros } = data || {};
        let filteredData = [...ordensProducaoMock.data];
        
        // Aplicar filtros
        if (filtros.numeroOPERP) {
            filteredData = filteredData.filter(item => 
                item.numeroOPERP?.toString().includes(filtros.numeroOPERP.toString())
            );
        }
        if (filtros.cliente) {
            filteredData = filteredData.filter(item => 
                item.cliente?.nome?.toLowerCase().includes(filtros.cliente.toLowerCase())
            );
        }
        if (filtros.situacao) {
            filteredData = filteredData.filter(item => item.situacao === filtros.situacao);
        }
        if (filtros.tipoOp) {
            filteredData = filteredData.filter(item => item.tipoOp === filtros.tipoOp);
        }
        if (filtros.opPaiId != null) {
            filteredData = filteredData.filter(item => item.opPaiId === filtros.opPaiId);
        }
        
        // Paginação
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = filteredData.slice(start, end);
        
        return {
            data: {
                data: paginatedData,
                pagination: {
                    totalRecords: filteredData.length,
                    page,
                    pageSize
                }
            },
            success: true,
            message: "Success"
        };
    }
    
    if (endpoint.includes('getById')) {
        const id = parseInt(endpoint.split('/').pop());
        const item = ordensProducaoMock.data.find(op => op.id === id);
        
        if (item) {
            // Adicionar histórico de alterações
            const historico = historicoAlteracoesMock.data.filter(h => h.ordemProducaoId === id);
            return {
                data: {
                    ...item,
                    historicoAlteracoes: historico
                },
                success: true,
                message: "Success"
            };
        }
        
        return {
            data: null,
            success: false,
            message: "Ordem de produção não encontrada"
        };
    }
    
    if (endpoint.includes('buscarOPDoERP')) {
        const { numeroOP } = data || {};
        // Simular busca no ERP - retorna dados mockados
        const mockOP = {
            numeroOPERP: numeroOP,
            dataOP: new Date().toISOString().split('T')[0],
            cliente: {
                codigo: "95556",
                nome: "METALURGICA MOR"
            },
            itens: [
                {
                    codigoItem: "707395",
                    descricaoItem: "TUBO RETANG ALUM 20X35X1,00X2070 MM",
                    codigoItemCliente: "TUB-001",
                    quantidadePecas: 4500,
                    quantidadeKg: 1250.5,
                    dataEntrega: "2024-02-20",
                    acabamento: "Anodizado"
                }
            ]
        };
        
        return {
            data: mockOP,
            success: true,
            message: "OP encontrada no ERP"
        };
    }
    
    if (endpoint.includes('upsert')) {
        const payload = data || {};
        const existingIndex = ordensProducaoMock.data.findIndex(op => op.id === payload.id);
        if (existingIndex >= 0) {
            ordensProducaoMock.data[existingIndex] = { ...ordensProducaoMock.data[existingIndex], ...payload };
        } else {
            const newOp = { ...payload, id: payload.id || Date.now() };
            ordensProducaoMock.data.push(newOp);
        }
        return {
            data: { data: payload },
            success: true,
            message: payload.id ? "Ordem atualizada com sucesso" : "Ordem criada com sucesso"
        };
    }
    
    if (endpoint.includes('ativarDesativar')) {
        return {
            data: { id: data.id, ativo: data.ativo },
            success: true,
            message: data.ativo ? "Ordem ativada com sucesso" : "Ordem desativada com sucesso"
        };
    }
    
    if (endpoint.includes('copiar')) {
        const original = ordensProducaoMock.data.find(op => op.id === data.id);
        if (original) {
            const copia = {
                ...original,
                id: Date.now(),
                numeroOPERP: `${original.numeroOPERP}-COPIA`,
                ativo: true
            };
            return {
                data: copia,
                success: true,
                message: "Ordem copiada com sucesso"
            };
        }
    }
    
    if (endpoint.includes('gerarOPsMESC')) {
        return {
            data: {
                opsMESC: [
                    {
                        id: Date.now(),
                        numeroOPMESC: "29948",
                        status: "Em produção",
                        quantidade: 2000,
                        data: new Date().toISOString().split('T')[0]
                    }
                ]
            },
            success: true,
            message: "OPs do MESC geradas com sucesso"
        };
    }
    
    if (endpoint.includes('exportar')) {
        return {
            data: ordensProducaoMock.data,
            success: true,
            message: "Dados exportados com sucesso"
        };
    }
    
    return {
        data: null,
        success: false,
        message: "Endpoint não implementado"
    };
};

const OrdemProducaoService = {
    // Buscar todas as ordens de produção (com filtros e paginação)
    getAll: async (requestData) => {
        try {
            // Por enquanto, usar mock. Quando a API estiver pronta, descomentar:
            // const response = await Api.post('/ordemProducao/getAll', requestData);
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/getAll', requestData);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Buscar ordem por ID
    getById: async (id) => {
        try {
            // const response = await Api.get(`/ordemProducao/getById/${id}`);
            // return response.data;
            
            const mockResponse = await getMockData(`/ordemProducao/getById/${id}`);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Buscar OP do ERP (TOTVS)
    buscarOPDoERP: async (numeroOP) => {
        try {
            // const response = await Api.post('/ordemProducao/buscarOPDoERP', { numeroOP });
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/buscarOPDoERP', { numeroOP });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Inserir ou atualizar ordem
    upsert: async (ordemData) => {
        try {
            // const response = await Api.post('/ordemProducao/upsert', ordemData);
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/upsert', ordemData);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Deletar ordem
    delete: async (id) => {
        try {
            const response = await Api.delete(`/ordemProducao/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Ativar/Desativar ordem
    ativarDesativar: async (id, ativo) => {
        try {
            // const response = await Api.post('/ordemProducao/ativarDesativar', { id, ativo });
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/ativarDesativar', { id, ativo });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Copiar ordem (duplicar)
    copiar: async (id) => {
        try {
            // const response = await Api.post('/ordemProducao/copiar', { id });
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/copiar', { id });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Gerar OPs do MESC
    gerarOPsMESC: async (ordemId) => {
        try {
            // const response = await Api.post('/ordemProducao/gerarOPsMESC', { ordemId });
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/gerarOPsMESC', { ordemId });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Exportar dados
    exportar: async (filtros) => {
        try {
            // const response = await Api.post('/ordemProducao/exportar', filtros);
            // return response.data;
            
            const mockResponse = await getMockData('/ordemProducao/exportar', filtros);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    }
};

export default OrdemProducaoService;
