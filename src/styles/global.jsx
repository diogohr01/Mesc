import { createGlobalStyle } from 'styled-components';
import { colors } from './colors';

export default createGlobalStyle`
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: #f1f1f120;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${colors.primary};
        border-radius: 20px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${colors.primary}30;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: #f1f1f120;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${colors.primary}75;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${colors.primary}75;
    }

    html, body {
        margin: 0px !important;
        padding: 0;
        overflow-x: hidden;
        max-width: 100vw;
    }
    body {
        background-color: #fafafb !important;
        transition: all 150ms ease-out 0s;
    }

    /* Fonte global estilo iPhone (Inter ≈ San Francisco), igual em todos os dispositivos */
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
    }

    /* Otimizações de performance para animações */
    * {
        will-change: auto;
    }

    /* Acelerar animações do Ant Design */
    .ant-btn,
    .ant-input,
    .ant-select,
    .ant-card,
    .ant-menu,
    .ant-dropdown,
    .ant-modal,
    .ant-drawer {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    /* Otimizar transições de hover */
    .ant-btn:hover,
    .ant-input:hover,
    .ant-select:hover {
        transform: translateY(-1px);
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    html {
        font-size: 14px;
        position: relative;
        min-height: 100%;
    }
    
    .ant-form-item {
        margin-bottom: 10px !important;
    }

    /* Estilos para MaskedInput - Forçar cor primary personalizada */
    .ant-input-mask {
        border-color: #d9d9d9 !important;
        box-shadow: none !important;
    }

    .ant-input-mask:hover {
        border-color: ${colors.primary} !important;
        box-shadow: none !important;
    }

    .ant-input-mask:focus,
    .ant-input-mask.ant-input-focused,
    .ant-input-mask:focus-within {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 2px ${colors.primary}20 !important;
        outline: none !important;
    }

    /* Forçar cor para o input interno quando ativo */
    .ant-input-mask.ant-input-focused input,
    .ant-input-mask:focus input,
    .ant-input-mask:focus-within input {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 2px ${colors.primary}20 !important;
        outline: none !important;
    }

    /* Remover todas as sombras azuis padrão */
    .ant-input-mask * {
        box-shadow: none !important;
    }

    .ant-input-mask:focus *,
    .ant-input-mask.ant-input-focused *,
    .ant-input-mask:focus-within * {
        box-shadow: 0 0 0 2px ${colors.primary}20 !important;
    }

    /* Garantir que não há sombras azuis em nenhum elemento */
    .ant-input-mask.ant-input-focused,
    .ant-input-mask:focus,
    .ant-input-mask:focus-within {
        border-color: ${colors.primary} !important;
        box-shadow: 0 0 0 2px ${colors.primary}20 !important;
        outline: none !important;
    }

    /* Menu do Sider: menos espaço à esquerda */
    .app-sidebar-menu.ant-menu-inline .ant-menu-item,
    .app-sidebar-menu.ant-menu-inline .ant-menu-submenu-title {
        padding-left: 12px !important;
    }
    .app-sidebar-menu.ant-menu-inline .ant-menu-sub .ant-menu-item {
        padding-left: 24px !important;
    }

    /* Item selecionado do menu do Sider: marcação da rota */
    .app-sidebar-menu .ant-menu-item-selected {
        background: ${colors.primary}15 !important;
        color: ${colors.primary} !important;
        border-left: 3px solid ${colors.primary};
        //border-top: 1px solid ${colors.primary};
       // border-bottom: 1px solid ${colors.primary};
        //border-right: 1px solid ${colors.primary};
        border-radius: 6px;
    }
    .app-sidebar-menu .ant-menu-item-selected .anticon {
        color: ${colors.primary} !important;
    }

    /* Corrigir posicionamento do dropdown do perfil do usuário */
    .user-profile-dropdown {
        position: absolute !important;
        z-index: 1050 !important;
    }

    .user-profile-dropdown .ant-dropdown {
        position: absolute !important;
        top: auto !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
    }

    .op-atrasada {
        border-left: 2px solid #ff4d4f !important;
    }
`;