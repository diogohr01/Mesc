import Api from './api';
import pedidosMock from '../mocks/pedidos/pedidos.json';
import ordensProducaoMock from '../mocks/ordemProducao/ordensProducao.json';
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
            obs_tolerancia: "",
            itens: [
                {
                    codigo: 1,
                    item: "90100002",
                    descricao: "MTR-027 6063 T6F 19,05X1,20X6000 MM SEQUE",
                    controle_tipo: "PEÇA",
                    quantidadeUn: 400,
                    pesoKg: 436.80,
                    dataEntrega: "2024-02-20",
                    data_limite_prod: null
                },
                {
                    codigo: 2,
                    item: "90100002",
                    descricao: "MTR-027 6063 T6F 19,05X1,20X6000 MM SEQUE",
                    controle_tipo: "PEÇA",
                    quantidadeUn: 400,
                    pesoKg: 436.80,
                    dataEntrega: "2024-03-02",
                    data_limite_prod: null
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
        const pedidoId = data?.pedidoId;
        const pedido = pedidosMock.data.find(p => p.id === pedidoId);
        if (!pedido) {
            return { data: null, success: false, message: 'Pedido não encontrado' };
        }
        const itensPedido = pedido.itens || [];
        if (itensPedido.length === 0) {
            return { data: null, success: false, message: 'Pedido sem itens' };
        }
        let nextId = Math.max(0, ...ordensProducaoMock.data.map(o => o.id)) + 1;
        const baseNumero = `OP-${pedido.pedidoNumero || pedido.id}-${Date.now().toString().slice(-6)}`;
        const opsCriadas = [];
        const dataOP = new Date().toISOString().split('T')[0];
        for (let idx = 0; idx < itensPedido.length; idx++) {
            const item = itensPedido[idx];
            const itemOP = {
                id: item.id || idx + 1,
                codigoItem: item.item ?? '',
                descricaoItem: item.descricao ?? '',
                codigoItemCliente: item.codigo != null ? String(item.codigo) : '',
                controle_tipo: item.controle_tipo ?? 'PEÇA',
                quantidadePecas: item.quantidadeUn ?? 0,
                quantidadeKg: item.pesoKg ?? 0,
                dataEntrega: item.dataEntrega ?? null,
                data_limite_prod: item.data_limite_prod ?? null,
                acabamento: '',
                cubagemPrevista: null,
                cubagemReal: null,
                localEntrega: '',
                observacoes: item.observacao ?? '',
            };
            const opPai = {
                id: nextId,
                tipoOp: 'PAI',
                pedidoId: pedido.id,
                numeroOPERP: itensPedido.length > 1 ? `${baseNumero}-${idx + 1}` : baseNumero,
                dataOP,
                numeroPedidoCliente: pedido.pedidoNumero ?? '',
                cliente: pedido.cliente ?? {},
                situacao: 'Em cadastro',
                itens: [itemOP],
                informacoesComplementares: {},
                ativo: true,
                observacoes: pedido.observacao ?? '',
                ferramentas: [],
            };
            ordensProducaoMock.data.push(opPai);
            opsCriadas.push({
                id: opPai.id,
                numeroOPMESC: opPai.numeroOPERP,
                status: 'Em cadastro',
                quantidade: itemOP.quantidadePecas || 0,
                data: opPai.dataOP,
            });
            nextId += 1;
        }
        return {
            data: {
                opsCriadas,
                opPaiList: ordensProducaoMock.data.slice(-opsCriadas.length),
            },
            success: true,
            message: opsCriadas.length > 1 ? `${opsCriadas.length} OPs do MESC cadastradas com sucesso` : 'OP do MESC cadastrada com sucesso',
        };
    }
    
    if (endpoint.includes('upsert')) {
        const payload = data || {};
        const existingIndex = pedidosMock.data.findIndex(p => p.id === payload.id);
        const pedidoToSave = {
            id: payload.id || Math.max(0, ...pedidosMock.data.map(p => p.id)) + 1,
            codigo: payload.codigo ?? '',
            data: payload.data ?? '',
            situacao: payload.situacao ?? 'NÃO INICIADA',
            pedidoNumero: payload.pedidoNumero ?? '',
            cliente: payload.cliente ?? {},
            observacao: payload.observacao ?? '',
            obs_tolerancia: payload.obs_tolerancia ?? '',
            itens: Array.isArray(payload.itens) ? payload.itens.map(it => ({
                ...it,
                controle_tipo: it.controle_tipo ?? 'PEÇA',
                data_limite_prod: it.data_limite_prod ?? null,
            })) : [],
            ativo: payload.ativo !== false,
        };
        if (existingIndex >= 0) {
            pedidosMock.data[existingIndex] = { ...pedidosMock.data[existingIndex], ...pedidoToSave };
        } else {
            pedidosMock.data.push(pedidoToSave);
        }
        return {
            data: {
                data: pedidoToSave
            },
            success: true,
            message: payload.id ? "Pedido atualizado com sucesso" : "Pedido criado com sucesso"
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
