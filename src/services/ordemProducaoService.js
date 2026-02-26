import Api from './api';
import ordensProducaoMock from '../mocks/ordemProducao/ordensProducao.json';
import historicoAlteracoesMock from '../mocks/ordemProducao/historicoAlteracoes.json';
import recursosMock from '../mocks/recursosProdutivos/recursos.json';
import manutencoesMock from '../mocks/recursosProdutivos/manutencoes.json';

// Função auxiliar para simular delay da API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Normaliza um registo de OP (bruto da API ou já da fila) para o formato usado na fila de produção e na lista do dia.
 * @param {object} op - Registo da OP (pode ter numeroOPERP/itens ou já codigo/produto/quantidade)
 * @param {object} [pai] - OP pai (tipoOp === 'PAI'), opcional; usado quando op é FILHA para obter produto, liga, tempera, cliente
 * @returns {object} Objeto com id, codigo, produto, quantidade, liga, tempera, dataEntrega, tipo, contingencia, etc.
 */
export function normalizeOPParaFila(op, pai) {
    if (!op) return op;
    const primeiroItem = (op.itens && op.itens[0]) || (pai && pai.itens && pai.itens[0]);
    const quantidade =
        op.quantidade != null && op.quantidade !== ''
            ? Number(op.quantidade)
            : (op.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadePecas) || 0), 0);
    const produto =
        op.produto != null && op.produto !== ''
            ? op.produto
            : (pai && pai.produto) || primeiroItem?.descricaoItem || '';
    const codigo = op.codigo != null && op.codigo !== '' ? op.codigo : (op.numeroOPERP || '');
    const dataEntrega = op.dataEntrega ?? primeiroItem?.dataEntrega ?? '';
    const diasToleranciaAtraso = op.diasToleranciaAtraso ?? primeiroItem?.dias_tolerancia_atraso ?? 0;
    const tipo = op.tipo != null && op.tipo !== '' ? (op.tipo === 'casa' ? 'casa' : 'cliente') : (pai && pai.tipo === 'casa' ? 'casa' : 'cliente');
    return {
        ...op,
        id: op.id,
        codigo,
        produto,
        quantidade,
        liga: op.liga != null && op.liga !== '' ? op.liga : (pai && pai.liga) || '',
        tempera: op.tempera != null && op.tempera !== '' ? op.tempera : (pai && pai.tempera) || '',
        dataEntrega,
        diasToleranciaAtraso,
        tipo,
        contingencia: op.contingencia ?? false,
        status: op.status ?? 'nao_programada',
        score: op.score != null ? op.score : 0,
        cliente: (op.cliente && (typeof op.cliente === 'object' ? op.cliente.nome : op.cliente)) || (pai && pai.cliente && (typeof pai.cliente === 'object' ? pai.cliente.nome : pai.cliente)) || '',
        dataInicio: op.dataInicio ?? op.dataOP ?? null,
        horaPrevista: op.horaPrevista ?? '08:00',
        recurso: op.recurso || op.ferramenta?.descricao || '',
    };
}

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
        if (filtros.dataInicio) {
            filteredData = filteredData.filter(item => item.dataOP >= filtros.dataInicio);
        }
        if (filtros.dataFim) {
            filteredData = filteredData.filter(item => item.dataOP <= filtros.dataFim);
        }
        if (filtros.search && String(filtros.search).trim()) {
            const term = String(filtros.search).trim().toLowerCase();
            filteredData = filteredData.filter(item => {
                const matchCodigo = item.numeroOPERP?.toLowerCase().includes(term);
                const matchCliente = item.cliente?.nome?.toLowerCase().includes(term);
                const matchProduto = (item.itens || []).some(it => it.descricaoItem?.toLowerCase().includes(term));
                return matchCodigo || matchCliente || matchProduto;
            });
        }
        if (filtros.filtroTipo === 'casa' || filtros.filtroTipo === 'cliente') {
            filteredData = filteredData.filter(item => {
                const tipo = item.tipo === 'casa' ? 'casa' : 'cliente';
                return tipo === filtros.filtroTipo;
            });
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
                    controle_tipo: "PEÇA",
                    quantidadePecas: 4500,
                    quantidadeKg: 1250.5,
                    dataEntrega: "2024-02-20",
                    data_limite_prod: null,
                    leadtime_producao: 0,
                    dias_tolerancia_atraso: 0,
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
    },

    // Dados para o Dashboard (resumo de OPs)
    getDadosDashboard: async () => {
        await delay(200);
        const list = ordensProducaoMock.data || [];
        const pais = list.filter((op) => op.tipoOp === 'PAI');
        const filhas = list.filter((op) => op.tipoOp === 'FILHA');
        const opsResumo = [];
        filhas.forEach((f) => {
            const pai = pais.find((p) => p.id === f.opPaiId);
            const primeiroItem = f.itens && f.itens[0];
            const dataEntrega = (primeiroItem && primeiroItem.dataEntrega) || '';
            const diasToleranciaAtraso = (primeiroItem && primeiroItem.dias_tolerancia_atraso) ?? 0;
            const produto = (pai && pai.produto) || (primeiroItem && primeiroItem.descricaoItem) || '';
            const quantidadeKg = (f.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadeKg) || 0), 0);
            opsResumo.push({
                id: f.id,
                codigo: f.numeroOPERP || `${pai ? pai.numeroOPERP : ''}-${f.id}`,
                status: f.status || 'nao_programada',
                dataEntrega,
                diasToleranciaAtraso,
                score: f.score != null ? f.score : 0,
                produto,
                cliente: (f.cliente && f.cliente.nome) || '',
                quantidadeKg,
                tipo: f.tipo === 'casa' ? 'casa' : 'cliente',
                statusDetalhado: f.statusDetalhado || null,
                tempera: (pai && pai.tempera) || f.tempera || '',
            });
        });
        pais.forEach((p) => {
            const hasFilhas = filhas.some((f) => f.opPaiId === p.id);
            if (!hasFilhas) {
                const primeiroItem = p.itens && p.itens[0];
                const dataEntrega = (primeiroItem && primeiroItem.dataEntrega) || '';
                const diasToleranciaAtraso = (primeiroItem && primeiroItem.dias_tolerancia_atraso) ?? 0;
                const quantidadeKg = (p.itens || []).reduce((s, i) => s + (parseFloat(i.quantidadeKg) || 0), 0);
                opsResumo.push({
                    id: p.id,
                    codigo: p.numeroOPERP || '',
                    status: (p.situacao === 'Em cadastro' ? 'nao_programada' : 'programada') || 'nao_programada',
                    dataEntrega,
                    diasToleranciaAtraso,
                    score: 0,
                    produto: p.produto || (primeiroItem && primeiroItem.descricaoItem) || '',
                    cliente: (p.cliente && p.cliente.nome) || '',
                    quantidadeKg,
                    tipo: p.tipo === 'casa' ? 'casa' : 'cliente',
                    statusDetalhado: p.statusDetalhado || null,
                    tempera: p.tempera || '',
                });
            }
        });
        return {
            data: { opsResumo },
            success: true,
            message: 'Success',
        };
    },

    // Fila de Produção: OPs FILHA não concluídas/canceladas, ordenadas por score, paginadas
    getFilaProducao: async (requestData) => {
        await delay(300);
        const { page = 1, pageSize = 10, search, filtroTipo } = requestData || {};
        const list = ordensProducaoMock.data || [];
        const pais = list.filter((op) => op.tipoOp === 'PAI');
        let fila = list
            .filter((op) => op.tipoOp === 'FILHA' && op.status !== 'concluida' && op.status !== 'cancelada')
            .map((f) => {
                const pai = pais.find((p) => p.id === f.opPaiId);
                return normalizeOPParaFila(f, pai);
            });

        if (search && String(search).trim()) {
            const term = String(search).trim().toLowerCase();
            fila = fila.filter(
                (op) =>
                    op.codigo?.toLowerCase().includes(term) ||
                    op.cliente?.toLowerCase().includes(term) ||
                    op.produto?.toLowerCase().includes(term)
            );
        }

        if (filtroTipo === 'casa' || filtroTipo === 'cliente') {
            fila = fila.filter((op) => op.tipo === filtroTipo);
        }

        const totalCasa = fila.filter((op) => op.tipo === 'casa').length;
        const totalCliente = fila.filter((op) => op.tipo === 'cliente').length;
        const resumo = { totalCasa, totalCliente, total: fila.length };

        fila.sort((a, b) => (b.score || 0) - (a.score || 0));
        const totalRecords = fila.length;
        const start = (page - 1) * pageSize;
        const data = fila.slice(start, start + pageSize);

        return {
            data: {
                data,
                pagination: { totalRecords, page, pageSize },
                resumo,
            },
            success: true,
            message: 'Success',
        };
    },

    // Kanban: todas as OPs FILHA (exceto cancelada) no formato flat, sem paginação; aceita filtros da tela de OP
    getDadosKanban: async (filtros = {}) => {
        await delay(300);
        const list = ordensProducaoMock.data || [];
        const pais = list.filter((op) => op.tipoOp === 'PAI');
        let ops = list
            .filter((op) => op.tipoOp === 'FILHA' && op.status !== 'cancelada')
            .map((f) => {
                const pai = pais.find((p) => p.id === f.opPaiId);
                const primeiroItem = (f.itens && f.itens[0]) || (pai && pai.itens && pai.itens[0]);
                const dataEntrega = primeiroItem?.dataEntrega || '';
                const diasToleranciaAtraso = primeiroItem?.dias_tolerancia_atraso ?? 0;
                const produto = (pai && pai.produto) || primeiroItem?.descricaoItem || '';
                const tipo = (f.tipo === 'casa' || (pai && pai.tipo === 'casa')) ? 'casa' : 'cliente';
                const clienteNome = (f.cliente && f.cliente.nome) || (pai && pai.cliente && pai.cliente.nome) || '';
                return {
                    id: f.id,
                    codigo: f.numeroOPERP || '',
                    status: f.status || 'nao_programada',
                    score: f.score != null ? f.score : 0,
                    produto,
                    cliente: clienteNome,
                    liga: (pai && pai.liga) || f.liga || '',
                    tempera: (pai && pai.tempera) || f.tempera || '',
                    dataEntrega,
                    diasToleranciaAtraso,
                    recurso: f.recurso || '',
                    tipo,
                    dataOP: f.dataOP,
                    situacao: f.situacao,
                };
            });
        if (filtros.numeroOPERP && String(filtros.numeroOPERP).trim()) {
            const term = String(filtros.numeroOPERP).trim().toLowerCase();
            ops = ops.filter((op) => op.codigo?.toLowerCase().includes(term));
        }
        if (filtros.cliente && String(filtros.cliente).trim()) {
            const term = String(filtros.cliente).trim().toLowerCase();
            ops = ops.filter((op) => op.cliente?.toLowerCase().includes(term));
        }
        if (filtros.filtroTipo && filtros.filtroTipo !== 'todos') {
            ops = ops.filter((op) => op.tipo === filtros.filtroTipo);
        }
        if (filtros.situacao && String(filtros.situacao).trim()) {
            const term = String(filtros.situacao).trim().toLowerCase();
            ops = ops.filter((op) => op.situacao?.toLowerCase().includes(term) || op.status?.toLowerCase().includes(term));
        }
        if (filtros.dataOP) {
            const dataStr = typeof filtros.dataOP === 'string' ? filtros.dataOP : (filtros.dataOP.toISOString && filtros.dataOP.toISOString().split('T')[0]);
            if (dataStr) {
                ops = ops.filter((op) => op.dataOP && String(op.dataOP).split('T')[0] === dataStr);
            }
        }
        if (filtros.dataInicio || filtros.dataFim) {
            const filhas = list.filter((op) => op.tipoOp === 'FILHA' && op.status !== 'cancelada');
            const dataInicioStr = filtros.dataInicio ? (typeof filtros.dataInicio === 'string' ? filtros.dataInicio : filtros.dataInicio.split?.('T')[0]) : null;
            const dataFimStr = filtros.dataFim ? (typeof filtros.dataFim === 'string' ? filtros.dataFim : filtros.dataFim.split?.('T')[0]) : null;
            const idsNoRange = new Set(
                filhas
                    .filter((f) => {
                        const di = f.dataInicio ? String(f.dataInicio).split('T')[0] : null;
                        if (!di) return true;
                        if (dataInicioStr && di < dataInicioStr) return true;
                        if (dataFimStr && di > dataFimStr) return true;
                        return false;
                    })
                    .map((f) => f.id)
            );
            ops = ops.filter((op) => !idsNoRange.has(op.id));
        }
        return {
            data: { ops },
            success: true,
            message: 'Success',
        };
    },

    // Alterar status de uma OP (mock: atualiza em memória)
    alterarStatus: async (id, novoStatus) => {
        await delay(100);
        const item = ordensProducaoMock.data.find((op) => op.id === id);
        if (item) item.status = novoStatus;
        return { success: true, message: 'Status atualizado' };
    },

    // Dados para o Gantt (OPs agrupadas pai/filhas + recursos + manutenções)
    getDadosGantt: async () => {
        await delay(200);
        const list = ordensProducaoMock.data || [];
        const pais = list.filter((op) => op.tipoOp === 'PAI');
        const filhas = list.filter((op) => op.tipoOp === 'FILHA');
        const opsGantt = pais.map((pai) => {
            const filhasDoPai = filhas
                .filter((f) => f.opPaiId === pai.id)
                .map((f, idx) => {
                    const primeiroItem = f.itens && f.itens[0];
                    const dataEntrega = (primeiroItem && primeiroItem.dataEntrega) || '';
                    const diasToleranciaAtraso = (primeiroItem && primeiroItem.dias_tolerancia_atraso) ?? 0;
                    const tipo = f.tipo === 'casa' || (pai && pai.tipo === 'casa') ? 'casa' : 'cliente';
                    return {
                        id: String(f.id),
                        codigo: f.numeroOPERP || `${pai.numeroOPERP}-${String(idx + 1).padStart(2, '0')}`,
                        dataInicio: f.dataInicio || f.dataOP,
                        dataFim: f.dataFim || f.dataOP,
                        dataEntrega,
                        diasToleranciaAtraso,
                        recurso: f.recurso || '',
                        status: f.status || 'nao_programada',
                        quantidade: (primeiroItem && primeiroItem.quantidadePecas) || 0,
                        score: f.score != null ? f.score : 0,
                        setupMinutos: f.setupMinutos != null ? f.setupMinutos : 0,
                        setupTipo: f.setupTipo || '',
                        tipo,
                    };
                });
            return {
                id: String(pai.id),
                codigo: pai.numeroOPERP || '',
                produto: pai.produto || (pai.itens && pai.itens[0] && pai.itens[0].descricaoItem) || '',
                cliente: (pai.cliente && pai.cliente.nome) || '',
                liga: pai.liga || '',
                tempera: pai.tempera || '',
                filhas: filhasDoPai,
            };
        }).filter((p) => p.filhas.length > 0);
        const recursos = (recursosMock.data || []).map((r) => ({
            id: r.id,
            nome: r.nome,
            tipo: r.tipo,
            capacidade: r.capacidade != null && r.unidade ? `${r.capacidade} ${r.unidade}` : '—',
            status: r.status,
        }));
        const manutencoes = manutencoesMock.data || [];
        return {
            data: { opsGantt, recursos, manutencoes },
            success: true,
            message: 'Success',
        };
    },
};

export default OrdemProducaoService;
