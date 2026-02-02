import { Button, Col, Row, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineSetting } from 'react-icons/ai';
import PedidoItemConfigModal from './PedidoItemConfigModal';

const { Text } = Typography;

const PedidosItensTable = ({ value = [], onChange }) => {
    const [dataSource, setDataSource] = useState(value || []);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configItem, setConfigItem] = useState(null);

    useEffect(() => {
        setDataSource(value || []);
    }, [value]);

    const handleOpenConfig = useCallback((record) => {
        setConfigItem(record);
        setConfigModalOpen(true);
    }, []);

    const handleCloseConfig = useCallback(() => {
        setConfigModalOpen(false);
        setConfigItem(null);
    }, []);

    const handleSaveConfig = useCallback(
        (updatedItem) => {
            if (!updatedItem?.key) return;
            const newData = dataSource.map((row) =>
                row.key === updatedItem.key ? { ...row, ...updatedItem } : row
            );
            setDataSource(newData);
            onChange?.(newData);
            handleCloseConfig();
        },
        [dataSource, onChange, handleCloseConfig]
    );

    // Totalizadores
    const totalizadores = useMemo(() => {
        const totalPecas = dataSource.reduce((sum, item) => sum + (item.quantidadeUn || 0), 0);
        const totalKg = dataSource.reduce((sum, item) => sum + (item.pesoKg || 0), 0);
        return { totalPecas, totalKg };
    }, [dataSource]);

    const columns = [
        {
            title: 'Cód',
            dataIndex: 'codigo',
            key: 'codigo',
            width: 80,
            render: (text) => <span>{text ?? '-'}</span>,
        },
        {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
            width: 150,
            render: (text) => <span>{text || '-'}</span>,
        },
        {
            title: 'Descrição',
            dataIndex: 'descricao',
            key: 'descricao',
            width: 300,
            render: (text) => <span>{text || '-'}</span>,
        },
        {
            title: 'Qtde (un)',
            dataIndex: 'quantidadeUn',
            key: 'quantidadeUn',
            width: 120,
            render: (text) => <span>{text != null ? Number(text).toLocaleString('pt-BR') : '0'}</span>,
        },
        {
            title: 'PL (kg)',
            dataIndex: 'pesoKg',
            key: 'pesoKg',
            width: 120,
            render: (text) => (
                <span>
                    {text != null
                        ? parseFloat(text).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })
                        : '0,00'}
                </span>
            ),
        },
        {
            title: 'Dt entrega',
            dataIndex: 'dataEntrega',
            key: 'dataEntrega',
            width: 150,
            render: (text) => (
                <span>
                    {text
                        ? dayjs.isDayjs(text)
                            ? text.format('DD/MM/YYYY')
                            : dayjs(text).format('DD/MM/YYYY')
                        : '-'}
                </span>
            ),
        },
        {
            title: 'Ações',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<AiOutlineSetting />}
                        onClick={() => handleOpenConfig(record)}
                        size="small"
                    >
                        Configurar
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Table
                bordered
                dataSource={dataSource}
                columns={columns}
                rowKey="key"
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
            />

            {/* Totalizadores */}
            <Row gutter={16} style={{ marginTop: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Col span={12}>
                    <Text strong>Total de Peças: </Text>
                    <Text>{totalizadores.totalPecas.toLocaleString('pt-BR')}</Text>
                </Col>
                <Col span={12}>
                    <Text strong>Total em KG: </Text>
                    <Text>
                        {totalizadores.totalKg.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                </Col>
            </Row>

            <PedidoItemConfigModal
                open={configModalOpen}
                item={configItem}
                onClose={handleCloseConfig}
                onSave={handleSaveConfig}
            />
        </div>
    );
};

export default PedidosItensTable;
