import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import AppProvider from './hooks/index';
import RoutesList from './routes';
import GlobalStyle from './styles/global';

import ptBR from 'antd/es/locale/pt_BR';
import { colors } from './styles/colors';

function App() {
    return (
        <ConfigProvider
            locale={ptBR}
            theme={{
                token: {
                    fontSize: 11,
                    colorPrimary: colors.primary,
                    colorPrimaryBg: colors.background,
                    colorText: colors.text.primary,
                    colorTextSecondary: colors.text.secondary,
                    colorBorderSecondary: colors.backgroundGray,
                    // Otimizações de performance
                    motion: false,
                    motionDurationFast: 0,
                    motionDurationMid: 0,
                    motionDurationSlow: 0,
                },
                components: {
                    Table: {
                        headerBg: colors.background,
                        headerColor: colors.text.primary,
                        headerSplitColor: colors.backgroundGray,
                       // borderColor: '#e0e0e0',
                        rowHoverBg: colors.background,
                        cellPaddingBlock: 6,
                        cellFontSize: 9,
                        cellPaddingInline: 8,
                    },
                },
                hashed: false,
                cssVar: false,
            }}
        >
            <AntApp>
                <AppProvider>
                    <RoutesList forceRefresh={true} />
                </AppProvider>
                <GlobalStyle />
            </AntApp>
        </ConfigProvider>
    );
}

export default App;
