import React from "react";
import { Navigate } from 'react-router-dom';
import {
    AiFillHome,
    AiOutlineFileText,
    AiOutlineForm,
    AiOutlineSchedule,
    AiOutlineSetting,
    AiOutlineTool,
    AiOutlineUnorderedList,
    AiOutlineAppstore
} from 'react-icons/ai';
import { roles } from '../helpers/roles';
import { GradientizeIcon } from '../components';

// Função para preload de componentes
const preloadComponent = (importFunc) => {
    const component = React.lazy(importFunc);
    importFunc().catch(error => {
        console.error('Erro ao preload componente:', error);
    });
    return component;
};

// Redirects para menu pai (acesso direto ao path do grupo)
import { PcpRedirect, CadastrosRedirect, ConfiguracoesRedirect } from '../pages/RedirectToFirstChild';

// Rotas de Ordem de Produção
const OrdemProducaoCadastro = preloadComponent(() => import('../pages/OrdemProducao/cadastro'));
const GanttProducao = preloadComponent(() => import('../pages/OrdemProducao/gantt'));
const FilaProducao = preloadComponent(() => import('../pages/FilaProducao'));
const KanbanProducao = preloadComponent(() => import('../pages/KanbanProducao'));

// Rotas de Pedidos
const PedidosCadastro = preloadComponent(() => import('../pages/Pedidos/cadastro'));

// Rotas de Itens, Ligas, Perfis, Ferramentas, Clientes, Sequenciamento
const ItensCadastro = preloadComponent(() => import('../pages/Itens/cadastro'));
const LigasCadastro = preloadComponent(() => import('../pages/Ligas/cadastro'));
const PerfisCadastro = preloadComponent(() => import('../pages/Perfis/cadastro'));
const FerramentasCadastro = preloadComponent(() => import('../pages/Ferramentas/cadastro'));
const ClientesCadastro = preloadComponent(() => import('../pages/Clientes/cadastro'));
const SequenciamentoCadastro = preloadComponent(() => import('../pages/Sequenciamento/cadastro'));

// Tipo de Exceções, Exceções e Exceções de Capacidade
const TipoExcecoesCadastro = preloadComponent(() => import('../pages/TipoExcecoes/cadastro'));
const ExcecoesCadastro = preloadComponent(() => import('../pages/Excecoes/cadastro'));
const ExcecoesCapacidade = preloadComponent(() => import('../pages/ExcecoesCapacidade'));

// Dashboard
const Dashboard = preloadComponent(() => import('../pages/Dashboard'));

// Configurações
const Configuracoes = preloadComponent(() => import('../pages/Configuracoes'));
const MonitoramentoIntegracao = preloadComponent(() => import('../pages/Configuracoes/MonitoramentoIntegracao'));

// Recursos Produtivos
const RecursosProdutivos = preloadComponent(() => import('../pages/RecursosProdutivos'));

// Rotas dinâmicas
export const defaultRoutes = [
    {
        key: '/',
        icon: <GradientizeIcon gradientId="menu-dashboard" fillGradient><AiFillHome /></GradientizeIcon>,
        label: 'Dashboard',
        element: Dashboard,
        roles: [roles.roleAdmin],
    },
    {
        key: '/pcp',
        icon: <GradientizeIcon gradientId="menu-pcp" fillGradient><AiOutlineForm /></GradientizeIcon>,
        label: 'PCP',
        roles: [roles.roleAdmin],
        element: PcpRedirect,
        children: [
            { key: '/ordem-producao/cadastro', icon: <GradientizeIcon gradientId="menu-op" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Ordens de Produção', element: OrdemProducaoCadastro, roles: [roles.roleAdmin] },
            { key: '/fila-producao', icon: <GradientizeIcon gradientId="menu-fila" fillGradient><AiOutlineUnorderedList /></GradientizeIcon>, label: 'Sequenciamento', element: FilaProducao, roles: [roles.roleAdmin] },
            { key: '/kanban-producao', icon: <GradientizeIcon gradientId="menu-kanban" fillGradient><AiOutlineAppstore /></GradientizeIcon>, label: 'Kanban', element: KanbanProducao, roles: [roles.roleAdmin] },
            { key: '/ordem-producao/gantt', icon: <GradientizeIcon gradientId="menu-gantt" fillGradient><AiOutlineSchedule /></GradientizeIcon>, label: 'Gantt', element: GanttProducao, roles: [roles.roleAdmin] },
        ],
    },
   
    {
        key: '/cadastros',
        icon: <GradientizeIcon gradientId="menu-cadastros" fillGradient><AiOutlineForm /></GradientizeIcon>,
        label: 'Cadastros',
        roles: [roles.roleAdmin],
        element: CadastrosRedirect,
        children: [
            { key: '/itens/cadastro', icon: <GradientizeIcon gradientId="menu-itens" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Itens', element: ItensCadastro, roles: [roles.roleAdmin] },
            { key: '/recursos-produtivos', icon: <GradientizeIcon gradientId="menu-recursos" fillGradient><AiOutlineTool /></GradientizeIcon>, label: 'Recursos', element: RecursosProdutivos, roles: [roles.roleAdmin] },
            { key: '/ligas/cadastro', icon: <GradientizeIcon gradientId="menu-ligas" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Ligas', element: LigasCadastro, roles: [roles.roleAdmin] },
            { key: '/perfis/cadastro', icon: <GradientizeIcon gradientId="menu-perfis" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Perfis', element: PerfisCadastro, roles: [roles.roleAdmin] },
            { key: '/ferramentas/cadastro', icon: <GradientizeIcon gradientId="menu-ferramentas" fillGradient><AiOutlineTool /></GradientizeIcon>, label: 'Ferramentas', element: FerramentasCadastro, roles: [roles.roleAdmin] },
            { key: '/clientes/cadastro', icon: <GradientizeIcon gradientId="menu-clientes" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Clientes', element: ClientesCadastro, roles: [roles.roleAdmin] },
            { key: '/pedidos/cadastro', icon: <GradientizeIcon gradientId="menu-pedidos" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Pedidos', element: PedidosCadastro, roles: [roles.roleAdmin] },
            { key: '/sequenciamento/cadastro', icon: <GradientizeIcon gradientId="menu-sequenciamento" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Cenários', element: SequenciamentoCadastro, roles: [roles.roleAdmin] },
        ],
    },
    {
        key: '/configuracoes',
        icon: <GradientizeIcon gradientId="menu-config" fillGradient><AiOutlineSetting /></GradientizeIcon>,
        label: 'Configurações',
        roles: [roles.roleAdmin],
        element: ConfiguracoesRedirect,
        children: [
            { key: '/configuracoes/excecoes', icon: <GradientizeIcon gradientId="menu-excecoes" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Exceções de Calendário', element: ExcecoesCadastro, roles: [roles.roleAdmin] },
            { key: '/configuracoes/excecoes-capacidade', icon: <GradientizeIcon gradientId="menu-excecoes-capacidade" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Exceções de Capacidade', element: ExcecoesCapacidade, roles: [roles.roleAdmin] },
            { key: '/configuracoes/tipo-excecoes', icon: <GradientizeIcon gradientId="menu-tipo-excecoes" fillGradient><AiOutlineFileText /></GradientizeIcon>, label: 'Tipo de Exceções', element: TipoExcecoesCadastro, roles: [roles.roleAdmin] },
            //{ key: '/configuracoes/monitoramento-integracao', icon: <GradientizeIcon gradientId="menu-monitor" fillGradient><AiOutlineSetting /></GradientizeIcon>, label: 'Monitoramento de Integração', element: MonitoramentoIntegracao, roles: [roles.roleAdmin] },
            { key: '/configuracoes/totvs', icon: <GradientizeIcon gradientId="menu-totvs" fillGradient><AiOutlineSetting /></GradientizeIcon>, label: 'Monitoramento', element: Configuracoes, roles: [roles.roleAdmin] },

        ],
    },
];
