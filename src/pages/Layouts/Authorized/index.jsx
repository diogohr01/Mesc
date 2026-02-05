import { DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Dropdown, Layout, Menu, Popover, Row, Space, Typography } from 'antd';
import { Card } from '../../../components';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { Modal } from '../../../components';
import { useAuth } from '../../../hooks/auth';
import { defaultRoutes } from '../../../routes/routes';
import { colors } from '../../../styles/colors';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

// Componente para o Perfil do Usuário
const UserProfile = ({ userName, userRole, appVersion = '1.0.0' }) => {
    const { signOut } = useAuth();

    return (
        <div style={{ padding: '16px', width: '280px' }}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <Title level={4} style={{ margin: 0 }}>{userName}</Title>
                <Text type="secondary">{userRole}</Text>
                <Text type="secondary">v{appVersion}</Text>

                <Button type="primary" onClick={() => signOut()} style={{ width: '100%' }}>
                    Sair
                </Button>
            </Space>
        </div>
    );
};

// Função para gerar itens do Menu dinamicamente
const generateMenuItems = (routes) => {
    return routes.map((route) => {
        if (route.children) {
            return {
                key: route.key,
                icon: route.icon,
                label: route.label,
                children: generateMenuItems(route.children), // Gera os submenus recursivamente
            };
        }
        return {
            key: route.key,
            icon: route.icon,
            label: route.label,
        };
    });
};

// Componente Principal Autorizado
const Authorized = ({ children, userName }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openKeys, setOpenKeys] = useState([]);
    const [routes] = useState(defaultRoutes); // Estado inicial com rotas dinâmicas
    const [collapsed, setCollapsed] = useState(false); // Estado para controlar o collapse
    const [openConfirmModal, setOpenConfirmModal] = useState(false); // Estado para controlar a visibilidade do modal de confirmação

    // Efeito para determinar quais submenus devem estar abertos com base na rota atual
    useEffect(() => {
        const path = location.pathname;
        const segments = path.split('/').filter(Boolean);
        const rootSubmenuKeys = defaultRoutes.map((x) => x.key);
        let newOpenKeys = [];

        if (segments.length === 0) {
            newOpenKeys = ['/main'];
        } else {
            const firstSegment = `/${segments[0]}`;
            if (rootSubmenuKeys.includes(firstSegment)) {
                newOpenKeys = [firstSegment];
            } else {
                // Abrir submenu pai quando a rota atual for um filho (ex.: /ordem-producao/consulta -> Consultas)
                for (const route of defaultRoutes) {
                    if (route.children?.some((c) => c.key === path || path.startsWith(c.key + '/'))) {
                        newOpenKeys.push(route.key);
                        break;
                    }
                }
                if (newOpenKeys.length === 0) newOpenKeys = ['/main'];
            }
        }

        setOpenKeys(newOpenKeys);
    }, [location]);

    // Função para lidar com mudanças nos submenus abertos
    const handleOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    // Função para alternar o estado de colapso
    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    // Função para lidar com cliques no menu e verificar se é a mesma rota
    const handleMenuClick = ({ key }) => {
        if (key === location.pathname) {
            setOpenConfirmModal(true); // Abre o modal de confirmação se a rota for a mesma
        } else {
            navigate(key);
        }
    };

    // Função de confirmação para recarregar a página
    const handleConfirm = () => {
        setOpenConfirmModal(false); // Fecha o modal
        navigate(0); // Recarrega a página
    };

    // Definição dos itens do menu lateral
    const sidebarMenu = (
        <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            style={{ height: '100%', borderRight: 0 }}
            onClick={handleMenuClick} // Adiciona a lógica de clique no menu
            items={generateMenuItems(routes)} // Gera os itens do menu dinamicamente
        />
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ 
                backgroundColor: colors.primary, 
                position: 'sticky', 
                top: 0, 
                zIndex: 1000, 
                padding: '0 16px',
                willChange: 'transform',
                transform: 'translateZ(0)' // Acelerar renderização
            }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Row align="middle" gutter={16}>
                            <Col>
                                {/* 
                                <Button
                                    type="text"
                                    onClick={toggleCollapsed}
                                    style={{
                                        color: '#fff',
                                        fontSize: '16px',
                                        marginRight: '16px',
                                    }}
                                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                />
                                */}
                            </Col>
                            {/* Logo e Título */}
                            <Col onClick={() => navigate('/ordem-producao/cadastro')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                {   /*  <img src={logo} alt="Logo" style={{ height: 20 }} /> */}
                                <Text style={{ color: '#fff', fontSize: '34px', marginLeft: '16px'  , fontWeight: 600}}>MESC</Text>
                            </Col>
                        </Row>
                    </Col>

                    {/* Seção Direita do Header */}
                    <Col>
                        <Popover
                            content={
                                <div style={{ 
                                    backgroundColor: '#fff', 
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    overflow: 'hidden',
                                    margin: '-12px -16px'
                                }}>
                                    <UserProfile userName={'Teste'} userRole={'Admin'} appVersion={'1.0.0'} />
                                </div>
                            }
                            trigger="click"
                            placement="bottomRight"
                            overlayStyle={{ 
                                padding: 0,
                                zIndex: 1050
                            }}
                        >
                            <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer' }}>
                                <Space>
                                    <Avatar size={24} icon={<UserOutlined />} />
                                    {!collapsed && <Text style={{ color: '#fff' }}>Admin</Text>}
                                    <DownOutlined style={{ color: '#fff' }} />
                                </Space>
                            </a>
                        </Popover>
                    </Col>
                </Row>
            </Header>

            {/* Layout Principal com Sider e Conteúdo */}
            <Layout>
                {/* Barra Lateral (Sider) */}
                <Sider
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    width={200}
                    style={{
                        backgroundColor: '#fff',
                        position: 'sticky',
                        top: 66,
                        height: '92vh',
                        overflow: 'auto',
                        willChange: 'width',
                        transform: 'translateZ(0)', // Acelerar renderização
                        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)' // Transição suave
                    }}
                >
                    {sidebarMenu}
                </Sider>

                {/* Conteúdo Principal */}
                <Layout>
                    <Content style={{ padding: '12px', margin: 0, minHeight: 280 }}>
                        <main role="main">{children}</main>
                    </Content>
                </Layout>
            </Layout>

            {/* Modal de confirmação para recarregar a página */}
            <Modal
                title="Recarregar Página"
                content="Você já está nesta página. Deseja recarregar?"
                open={openConfirmModal}
                confirmFunction={handleConfirm} // Função de confirmação
                confirmButtonText="Recarregar"
                onCancel={() => setOpenConfirmModal(false)} // Fecha o modal ao cancelar
            />
        </Layout>
    );
};

export default Authorized;
