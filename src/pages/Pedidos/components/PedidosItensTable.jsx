import { Button, Col, Form, Row, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiFillDelete, AiFillEdit, AiOutlinePlus } from 'react-icons/ai';
import { DateInput, NumberInput, TextInput } from '../../../components/inputs';

const { Text } = Typography;

// Fator de conversão padrão (kg por peça) - pode ser parametrizado
const CONVERSAO_KG_PECA = 0.278; // Exemplo: 1 peça = 0.278 kg

const PedidosItensTable = ({ value = [], onChange, form }) => {
    const [editingKey, setEditingKey] = useState('');
    const [dataSource, setDataSource] = useState(value || []);

    useEffect(() => {
        setDataSource(value || []);
    }, [value]);

    const isEditing = (record) => record.key === editingKey;

    const edit = (record) => {
        form.setFieldsValue({
            ...record,
        });
        setEditingKey(record.key);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...dataSource];
            const index = newData.findIndex((item) => key === item.key);

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                setDataSource(newData);
                setEditingKey('');
                onChange?.(newData);
            } else {
                newData.push(row);
                setDataSource(newData);
                setEditingKey('');
                onChange?.(newData);
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleAdd = () => {
        const newData = {
            key: `item-${Date.now()}-${Math.random()}`,
            codigo: '',
            item: '',
            descricao: '',
            quantidadeUn: 0,
            pesoKg: 0,
            dataEntrega: null,
        };
        setDataSource([...dataSource, newData]);
        setEditingKey(newData.key);
        form.setFieldsValue(newData);
    };

    const handleDelete = (key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
        onChange?.(newData);
    };

    // Calcular conversão peças ↔ kg
    const calcularConversao = useCallback((valor, tipo) => {
        if (!valor || valor === 0) return 0;
        
        if (tipo === 'pecasParaKg') {
            return parseFloat((valor * CONVERSAO_KG_PECA).toFixed(2));
        } else if (tipo === 'kgParaPecas') {
            return Math.round(valor / CONVERSAO_KG_PECA);
        }
        return 0;
    }, []);

    const handleQuantidadeChange = (key, field, value) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => item.key === key);
        
        if (index > -1) {
            const item = newData[index];
            
            if (field === 'quantidadeUn') {
                item.quantidadeUn = value || 0;
                item.pesoKg = calcularConversao(value, 'pecasParaKg');
            } else if (field === 'pesoKg') {
                item.pesoKg = value || 0;
                item.quantidadeUn = calcularConversao(value, 'kgParaPecas');
            } else {
                item[field] = value;
            }
            
            setDataSource(newData);
            onChange?.(newData);
        }
    };

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
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="codigo"
                        style={{ margin: 0 }}
                        rules={[{ required: false }]}
                    >
                        <TextInput size="small" />
                    </Form.Item>
                ) : (
                    <span>{text || '-'}</span>
                );
            },
        },
        {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
            width: 150,
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="item"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Item obrigatório' }]}
                    >
                        <TextInput size="small" placeholder="Código do item" />
                    </Form.Item>
                ) : (
                    <span>{text || '-'}</span>
                );
            },
        },
        {
            title: 'Descrição',
            dataIndex: 'descricao',
            key: 'descricao',
            width: 300,
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="descricao"
                        style={{ margin: 0 }}
                        rules={[{ required: false }]}
                    >
                        <TextInput size="small" placeholder="Descrição do item" />
                    </Form.Item>
                ) : (
                    <span>{text || '-'}</span>
                );
            },
        },
        {
            title: 'Qtde (un)',
            dataIndex: 'quantidadeUn',
            key: 'quantidadeUn',
            width: 120,
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="quantidadeUn"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Quantidade obrigatória' }]}
                    >
                        <NumberInput
                            size="small"
                            min={0}
                            onChange={(value) => handleQuantidadeChange(record.key, 'quantidadeUn', value)}
                        />
                    </Form.Item>
                ) : (
                    <span>{text ? text.toLocaleString('pt-BR') : '0'}</span>
                );
            },
        },
        {
            title: 'PL (kg)',
            dataIndex: 'pesoKg',
            key: 'pesoKg',
            width: 120,
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="pesoKg"
                        style={{ margin: 0 }}
                        rules={[{ required: false }]}
                    >
                        <NumberInput
                            size="small"
                            min={0}
                            precision={2}
                            onChange={(value) => handleQuantidadeChange(record.key, 'pesoKg', value)}
                        />
                    </Form.Item>
                ) : (
                    <span>{text ? parseFloat(text).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</span>
                );
            },
        },
        {
            title: 'Dt entrega',
            dataIndex: 'dataEntrega',
            key: 'dataEntrega',
            width: 150,
            editable: true,
            render: (text, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="dataEntrega"
                        style={{ margin: 0 }}
                        rules={[{ required: false }]}
                    >
                        <DateInput size="small" format="DD/MM/YYYY" />
                    </Form.Item>
                ) : (
                    <span>{text ? (dayjs.isDayjs(text) ? text.format('DD/MM/YYYY') : dayjs(text).format('DD/MM/YYYY')) : '-'}</span>
                );
            },
        },
        {
            title: 'Ações',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space size="small">
                        <Button
                            type="link"
                            onClick={() => save(record.key)}
                            size="small"
                        >
                            Salvar
                        </Button>
                        <Button
                            type="link"
                            onClick={cancel}
                            size="small"
                        >
                            Cancelar
                        </Button>
                    </Space>
                ) : (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<AiFillEdit />}
                            onClick={() => edit(record)}
                            size="small"
                        />
                        <Button
                            type="text"
                            danger
                            icon={<AiFillDelete />}
                            onClick={() => handleDelete(record.key)}
                            size="small"
                        />
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    type="primary"
                    icon={<AiOutlinePlus />}
                    onClick={handleAdd}
                    size="middle"
                >
                    Adicionar Item
                </Button>
            </div>
            
            <Form form={form} component={false}>
                <Table
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                    rowClassName="editable-row"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    size="small"
                />
            </Form>
            
            {/* Totalizadores */}
            <Row gutter={16} style={{ marginTop: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Col span={12}>
                    <Text strong>Total de Peças: </Text>
                    <Text>{totalizadores.totalPecas.toLocaleString('pt-BR')}</Text>
                </Col>
                <Col span={12}>
                    <Text strong>Total em KG: </Text>
                    <Text>{totalizadores.totalKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </Col>
            </Row>
        </div>
    );
};

export default PedidosItensTable;
