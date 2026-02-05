import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Atualiza o state para mostrar a UI de erro
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log do erro para monitoramento
        console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title="Algo deu errado!"
                    subTitle="Ocorreu um erro ao carregar esta página. Tente novamente."
                    extra={[
                        <Button type="primary" key="retry" onClick={this.handleRetry}>
                            Tentar Novamente
                        </Button>,
                        <Button key="home" onClick={() => { const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'; window.location.href = window.location.origin + base.replace(/\/?$/, '/'); }}>
                            Ir para Home
                        </Button>
                    ]}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
