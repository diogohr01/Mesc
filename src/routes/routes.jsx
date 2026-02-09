import React from "react";
import { Navigate } from 'react-router-dom';
import { 
    AiFillEdit, 
    AiFillHome, 
    AiOutlineAudit, 
    AiOutlineForm, 
    AiOutlinePieChart, 
    AiOutlineWindows,
    AiOutlineFileText,
    AiOutlineUser,
    AiOutlineSearch,
    AiOutlineSetting,
    AiOutlineTool
} from 'react-icons/ai';
import { roles } from '../helpers/roles';

const ConsultasRedirect = () => <Navigate to="/ordem-producao/consulta" replace />;

// Função para preload de componentes
const preloadComponent = (importFunc) => {
    const component = React.lazy(importFunc);
    // Preload do componente de forma assíncrona
    importFunc().catch(error => {
        console.error('Erro ao preload componente:', error);
    });
    return component;
};

// Carregamento preguiçoso (lazy loading) das páginas com preload
const Home = preloadComponent(() => import('../pages/Home'));
const Form = preloadComponent(() => import('../pages/Home/form'));
const Crud = preloadComponent(() => import('../pages/Home/crud'));
const FormBuilder = preloadComponent(() => import('../pages/Home/formBuilder'));
const ModalExample = preloadComponent(() => import('../pages/Home/modal'));
const Charts = preloadComponent(() => import('../pages/Home/charts'));

// Rotas de Ordem de Produção
const OrdemProducaoCadastro = preloadComponent(() => import('../pages/OrdemProducao/cadastro'));
const OrdemProducaoConsulta = preloadComponent(() => import('../pages/OrdemProducao/consulta'));

// Rotas de Pedidos
const PedidosCadastro = preloadComponent(() => import('../pages/Pedidos/cadastro'));
const PedidosConsulta = preloadComponent(() => import('../pages/Pedidos/consulta'));

// Rotas de Clientes
const ClientesCadastro = preloadComponent(() => import('../pages/Clientes/cadastro'));
const ClientesConsulta = preloadComponent(() => import('../pages/Clientes/consulta'));

// Rotas de Itens
const ItensCadastro = preloadComponent(() => import('../pages/Itens/cadastro'));

// Rotas de Perfis
const PerfisCadastro = preloadComponent(() => import('../pages/Perfis/cadastro'));

// Rotas de Ferramentas
const FerramentasCadastro = preloadComponent(() => import('../pages/Ferramentas/cadastro'));

// Rotas de Ligas
const LigasCadastro = preloadComponent(() => import('../pages/Ligas/cadastro'));

// Gestão de Forno
const GestaoForno = preloadComponent(() => import('../pages/Forno'));

// Gestão de Usuários (mock - RF-022)
const GestaoUsuarios = preloadComponent(() => import('../pages/Usuarios'));

// Dashboard do Planejador
const Dashboard = preloadComponent(() => import('../pages/Dashboard'));

// Configurações (Motor de Sequenciamento + Integração ERP)
const Configuracoes = preloadComponent(() => import('../pages/Configuracoes'));

// Recursos Produtivos (Máquinas, matrizes e linhas)
const RecursosProdutivos = preloadComponent(() => import('../pages/RecursosProdutivos'));

// Rotas dinâmicas (pode ser carregado de uma API)
export const defaultRoutes = [
    //{ key: '/', icon: <AiFillHome />, label: 'Home', element: Home, roles: [roles.roleAdmin] },
    //{ key: '/form', icon: <AiFillEdit />, label: 'Formulário - Exemplo', element: Form, roles: [roles.roleAdmin] },
            //{ key: '/formbuilder', icon: <AiOutlineForm />, label: 'Gerador de Form', element: FormBuilder, roles: [roles.roleAdmin] },
    // { key: '/table', icon: <AiOutlineAudit />, label: 'Crud - Exemplo', element: Crud, roles: [roles.roleAdmin] },
    //{ key: '/modal', icon: <AiOutlineWindows />, label: 'Modal - Exemplo', element: ModalExample, roles: [roles.roleAdmin] },
  //  { key: '/charts', icon: <AiOutlinePieChart />, label: 'Charts - Exemplo', element: Charts, roles: [roles.roleAdmin] },
    
    // Item pai: Cadastros
    { 
        key: '/cadastros', 
        icon: <AiOutlineForm />, 
        label: 'PCP', 
        roles: [roles.roleAdmin],
        children: [
            { key: '/dashboard', icon: <AiFillHome />, label: 'Dashboard', element: Dashboard, roles: [roles.roleAdmin] },
            { key: '/ordem-producao/cadastro', icon: <AiOutlineFileText />, label: 'Ordem de Produção', element: OrdemProducaoCadastro, roles: [roles.roleAdmin] },
            { key: '/pedidos/cadastro', icon: <AiOutlineFileText />, label: 'Pedidos', element: PedidosCadastro, roles: [roles.roleAdmin] },
            { key: '/perfis/cadastro', icon: <AiOutlineFileText />, label: 'Perfis', element: PerfisCadastro, roles: [roles.roleAdmin] },
            { key: '/ferramentas/cadastro', icon: <AiOutlineFileText />, label: 'Ferramentas', element: FerramentasCadastro, roles: [roles.roleAdmin] },
            { key: '/itens/cadastro', icon: <AiOutlineFileText />, label: 'Itens', element: ItensCadastro, roles: [roles.roleAdmin] },
            { key: '/ligas/cadastro', icon: <AiOutlineFileText />, label: 'Ligas', element: LigasCadastro, roles: [roles.roleAdmin] },
            { key: '/clientes/cadastro', icon: <AiOutlineUser />, label: 'Clientes', element: ClientesCadastro, roles: [roles.roleAdmin] },
            { key: '/forno', icon: <AiOutlineForm />, label: 'Gestão de Forno', element: GestaoForno, roles: [roles.roleAdmin] },
            { key: '/usuarios', icon: <AiOutlineUser />, label: 'Gestão de Usuários', element: GestaoUsuarios, roles: [roles.roleAdmin] },
            { key: '/configuracoes', icon: <AiOutlineSetting />, label: 'Configurações', element: Configuracoes, roles: [roles.roleAdmin] },
            { key: '/recursos-produtivos', icon: <AiOutlineTool />, label: 'Recursos Produtivos', element: RecursosProdutivos, roles: [roles.roleAdmin] },
        ]
    },

   
];