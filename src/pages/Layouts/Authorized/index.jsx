import { AppstoreOutlined, DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, NotificationOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Divider, Dropdown, Layout, Menu, Popover, Row, Space, Typography } from 'antd';
import { Card, HeaderSearchInput } from '../../../components';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { Modal } from '../../../components';
import { FilterSearchProvider, useFilterSearchContext } from '../../../contexts/FilterSearchContext';
import { useAuth } from '../../../hooks/auth';
import { defaultRoutes } from '../../../routes/routes';
import { colors } from '../../../styles/colors';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

// Componente para o Perfil do Usuário
const UserProfile = ({ userName, userRole, appVersion = '1.0.0' }) => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleSair = () => {
        signOut();
        navigate('/signIn', { replace: true });
    };

    return (
        <div style={{ padding: '16px', width: '280px' }}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <Title level={4} style={{ margin: 0 }}>{userName}</Title>
                <Text type="secondary">{userRole}</Text>
                <Text type="secondary">v{appVersion}</Text>

                <Button type="primary" onClick={handleSair} style={{ width: '100%' }}>
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

// Layout interno que consome o context (deve estar dentro de FilterSearchProvider)
const AuthorizedLayout = ({ children, userName }) => {
    const { searchProps } = useFilterSearchContext();
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
            className="app-sidebar-menu"
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
        <Layout style={{ minHeight: '100vh', height: '100vh', width: '100%', overflow: 'hidden' }}>
            <Layout style={{ flexDirection: 'row', height: '100vh', width: '100%', overflow: 'hidden' }}>
                <Sider
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    width={230}
                    style={{
                        backgroundColor: colors.layout.siderBg,
                        position: 'sticky',
                        top: 0,
                        height: '100%',
                        minHeight: '100vh',
                        willChange: 'width',
                        transform: 'translateZ(0)',
                        borderRight: `1px solid ${colors.layout.siderBorder}`,
                        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <div
                        style={{
                            background: colors.layout.siderBg,
                            height: 64,
                            padding: '0 16px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.14)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <AppstoreOutlined style={{ fontSize: 22, color: colors.layout.siderText }} />
                        </div>
                        {!collapsed && (
                            <div style={{ minWidth: 0 }}>
                                <div style={{ color: colors.layout.siderText, fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>MESC</div>
                                <div style={{ color: colors.layout.siderTextMuted, fontSize: 12, lineHeight: 1.3 }}>Sequenciamento</div>
                            </div>
                        )}
                    </div>
                    <Divider style={{ margin: 0 }} />
                    {sidebarMenu}
                </Sider>

                <Layout style={{ flex: 1, minWidth: 0 }}>
                    <Header
                        style={{
                            backgroundColor: colors.layout.headerBg,
                            padding: '0 16px',
                            borderBottom: `1px solid ${colors.layout.headerBorder}`,
                            height: 65,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                            <HeaderSearchInput placeholder="Pesquisar" {...searchProps}  style={{marginLeft: 4}} />
                        <Space size="middle" align="center" style={{borderLeft: `0.5px solid ${colors.white}`}}>
                            <Button
                                type="text"
                                icon={<NotificationOutlined style={{ fontSize: 18, color: colors.layout.headerText }} />}
                                style={{
                                    color: colors.layout.headerText,
                                    width: 40,
                                    height: 40,
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            />
                            <Popover
                                content={
                                    <div style={{
                                        backgroundColor: colors.white,
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
                                overlayStyle={{ padding: 0, zIndex: 1050 }}
                            >
                                <a
                                    onClick={(e) => e.preventDefault()}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        height: 32,
                                        minHeight: 32,
                                    }}
                                >
                                    <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: colors.layout.headerText, flexShrink: 0 }} />
                                    <Text style={{ color: colors.layout.headerText, fontWeight: 500, lineHeight: '32px', height: 32, margin: 0, display: 'block' }}>Admin</Text>
                                </a>
                            </Popover>
                        </Space>
                    </Header>

                    <Content style={{ padding: '20px', margin: 0, minHeight: 280, minWidth: 0, overflowX: 'auto' }}>
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

const Authorized = ({ children, userName }) => (
    <FilterSearchProvider>
        <AuthorizedLayout children={children} userName={userName} />
    </FilterSearchProvider>
);

export default Authorized;
