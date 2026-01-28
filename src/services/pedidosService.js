import Api from './api';
import pedidosMock from '../mocks/pedidos/pedidos.json';
import dayjs from 'dayjs';

// Função auxiliar para simular delay da API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para buscar dados mockados
const getMockData = async (endpoint, data) => {
    await delay(300);
    
    if (endpoint.includes('getAll')) {
        const { page = 1, pageSize = 10, ...filtros } = data || {};
        let filteredData = [...pedidosMock.data];
        
        if (filtros.codigo) {
            filteredData = filteredData.filter(item => 
                item.codigo?.toString().includes(filtros.codigo.toString())
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
        if (filtros.pedidoNumero) {
            filteredData = filteredData.filter(item => 
                item.pedidoNumero?.toString().includes(filtros.pedidoNumero.toString())
            );
        }
        if (filtros.dataInicio) {
            filteredData = filteredData.filter(item => {
                const itemData = dayjs(item.data);
                return itemData.isSameOrAfter(dayjs(filtros.dataInicio), 'day');
            });
        }
        if (filtros.dataFim) {
            filteredData = filteredData.filter(item => {
                const itemData = dayjs(item.data);
                return itemData.isSameOrBefore(dayjs(filtros.dataFim), 'day');
            });
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
                    pageSize
                }
            },
            success: true,
            message: "Success"
        };
    }
    
    if (endpoint.includes('getById')) {
        const id = parseInt(endpoint.split('/').pop());
        const item = pedidosMock.data.find(p => p.id === id);
        
        return {
            data: {
                data: item || null
            },
            success: !!item,
            message: item ? "Success" : "Pedido não encontrado"
        };
    }
    
    if (endpoint.includes('buscarPedidoDoTotvs')) {
        const { pedidoNumero } = data || {};
        // Simular busca no Totvs - retorna dados mockados
        const mockPedido = {
            codigo: `PED-${Date.now()}`,
            data: new Date().toISOString().split('T')[0],
            situacao: "NÃO INICIADA",
            pedidoNumero: pedidoNumero,
            cliente: {
                codigo: "95556",
                nome: "METALURGICA MOR"
            },
            observacao: "Pedido importado do Totvs",
            itens: [
                {
                    codigo: 1,
                    item: "90100002",
                    descricao: "MTR-027 6063 T6F 19,05X1,20X6000 MM SEQUE",
                    quantidadeUn: 400,
                    pesoKg: 436.80,
                    dataEntrega: "2024-02-20"
                },
                {
                    codigo: 2,
                    item: "90100002",
                    descricao: "MTR-027 6063 T6F 19,05X1,20X6000 MM SEQUE",
                    quantidadeUn: 400,
                    pesoKg: 436.80,
                    dataEntrega: "2024-03-02"
                }
            ]
        };
        
        return {
            data: mockPedido,
            success: true,
            message: "Pedido encontrado no Totvs"
        };
    }
    
    if (endpoint.includes('cadastrarOP')) {
        // Simular criação de OPs do MESC a partir do pedido
        return {
            data: {
                opsCriadas: [
                    {
                        id: Date.now(),
                        numeroOPMESC: "29948",
                        status: "Em cadastro",
                        quantidade: 1000,
                        data: new Date().toISOString().split('T')[0]
                    }
                ]
            },
            success: true,
            message: "OPs do MESC cadastradas com sucesso"
        };
    }
    
    if (endpoint.includes('upsert')) {
        return {
            data: {
                data: data
            },
            success: true,
            message: data.id ? "Pedido atualizado com sucesso" : "Pedido criado com sucesso"
        };
    }
    
    if (endpoint.includes('ativarDesativar')) {
        return {
            data: { id: data.id, ativo: data.ativo },
            success: true,
            message: data.ativo ? "Pedido ativado com sucesso" : "Pedido desativado com sucesso"
        };
    }
    
    if (endpoint.includes('copiar')) {
        const original = pedidosMock.data.find(p => p.id === data.id);
        if (original) {
            const copia = {
                ...original,
                id: Date.now(),
                codigo: `${original.codigo}-COPIA`,
                ativo: true
            };
            return {
                data: {
                    data: copia
                },
                success: true,
                message: "Pedido copiado com sucesso"
            };
        }
    }
    
    return {
        data: null,
        success: false,
        message: "Endpoint não implementado"
    };
};

const PedidosService = {
    // Buscar todos os pedidos (com filtros e paginação)
    getAll: async (requestData) => {
        try {
            // const response = await Api.post('/pedidos/getAll', requestData);
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/getAll', requestData);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Buscar pedido por ID
    getById: async (id) => {
        try {
            // const response = await Api.get(`/pedidos/getById/${id}`);
            // return response.data;
            
            const mockResponse = await getMockData(`/pedidos/getById/${id}`);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Inserir ou atualizar pedido
    upsert: async (pedidoData) => {
        try {
            // const response = await Api.post('/pedidos/upsert', pedidoData);
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/upsert', pedidoData);
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Deletar pedido
    delete: async (id) => {
        try {
            const response = await Api.delete(`/pedidos/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Ativar/Desativar pedido
    ativarDesativar: async (id, ativo) => {
        try {
            // const response = await Api.post('/pedidos/ativarDesativar', { id, ativo });
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/ativarDesativar', { id, ativo });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Copiar pedido (duplicar)
    copiar: async (id) => {
        try {
            // const response = await Api.post('/pedidos/copiar', { id });
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/copiar', { id });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Buscar pedido do Totvs
    buscarPedidoDoTotvs: async (pedidoNumero) => {
        try {
            // const response = await Api.post('/pedidos/buscarPedidoDoTotvs', { pedidoNumero });
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/buscarPedidoDoTotvs', { pedidoNumero });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    },

    // Cadastrar OP (criar OPs do MESC a partir do pedido)
    cadastrarOP: async (pedidoId) => {
        try {
            // const response = await Api.post('/pedidos/cadastrarOP', { pedidoId });
            // return response.data;
            
            const mockResponse = await getMockData('/pedidos/cadastrarOP', { pedidoId });
            return mockResponse;
        } catch (error) {
            throw error;
        }
    }
};

export default PedidosService;
