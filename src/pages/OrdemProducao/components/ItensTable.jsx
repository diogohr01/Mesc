import { Button, Col, Form, Input, InputNumber, Row, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiFillDelete, AiFillEdit, AiOutlineDelete, AiOutlinePlus } from 'react-icons/ai';
import { DateInput, NumberInput, SelectInput, TextAreaInput, TextInput } from '../../../components/inputs';

const { Text } = Typography;

// Fator de conversão padrão (kg por peça) - pode ser parametrizado
const CONVERSAO_KG_PECA = 0.278; // Exemplo: 1 peça = 0.278 kg

const ItensTable = ({ value = [], onChange, form }) => {
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
            key: Date.now().toString(),
            codigoItem: '',
            descricaoItem: '',
            codigoItemCliente: '',
            controle_tipo: 'PEÇA',
            quantidadePecas: 0,
            quantidadeKg: 0,
            dataEntrega: null,
            data_limite_prod: null,
            leadtime_producao: 0,
            dias_tolerancia_atraso: 0,
            acabamento: '',
            cubagemPrevista: 0,
            cubagemReal: null,
            localEntrega: '',
            observacoes: '',
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
            const updatedItem = { ...item, [field]: value };
            
            // Conversão automática
            if (field === 'quantidadePecas') {
                updatedItem.quantidadeKg = calcularConversao(value, 'pecasParaKg');
            } else if (field === 'quantidadeKg') {
                updatedItem.quantidadePecas = calcularConversao(value, 'kgParaPecas');
            }
            
            newData[index] = updatedItem;
            setDataSource(newData);
            onChange?.(newData);
        }
    };

    // Calcular totalizadores
    const totalizadores = useMemo(() => {
        const totalPecas = dataSource.reduce((sum, item) => {
            return sum + (parseFloat(item.quantidadePecas) || 0);
        }, 0);
        
        const totalKg = dataSource.reduce((sum, item) => {
            return sum + (parseFloat(item.quantidadeKg) || 0);
        }, 0);
        
        return { totalPecas, totalKg };
    }, [dataSource]);

    const acabamentoOptions = [
        { label: 'Natural', value: 'Natural' },
        { label: 'Anodizado', value: 'Anodizado' },
        { label: 'Pintado', value: 'Pintado' }
    ];

    const columns = [
        {
            title: 'Código Item',
            dataIndex: 'codigoItem',
            key: 'codigoItem',
            width: 120,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="codigoItem"
                            style={{ margin: 0 }}
                            rules={[{ required: true, message: 'Obrigatório' }]}
                        >
                            <TextInput size="small" />
                        </Form.Item>
                    );
                }
                return text;
            },
        },
        {
            title: 'Descrição',
            dataIndex: 'descricaoItem',
            key: 'descricaoItem',
            width: 250,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="descricaoItem"
                            style={{ margin: 0 }}
                            rules={[{ required: true, message: 'Obrigatório' }]}
                        >
                            <TextInput size="small" />
                        </Form.Item>
                    );
                }
                return text;
            },
        },
        {
            title: 'Cód. Cliente',
            dataIndex: 'codigoItemCliente',
            key: 'codigoItemCliente',
            width: 120,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="codigoItemCliente"
                            style={{ margin: 0 }}
                        >
                            <TextInput size="small" />
                        </Form.Item>
                    );
                }
                return text;
            },
        },
        {
            title: 'Qtd (peças)',
            dataIndex: 'quantidadePecas',
            key: 'quantidadePecas',
            width: 120,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="quantidadePecas"
                            style={{ margin: 0 }}
                            rules={[{ required: true, message: 'Obrigatório' }]}
                        >
                            <NumberInput
                                type="integer"
                                size="small"
                                onChange={(val) => handleQuantidadeChange(record.key, 'quantidadePecas', val)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text?.toLocaleString('pt-BR') || 0;
            },
        },
        {
            title: 'Qtd (kg)',
            dataIndex: 'quantidadeKg',
            key: 'quantidadeKg',
            width: 120,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="quantidadeKg"
                            style={{ margin: 0 }}
                            rules={[{ required: true, message: 'Obrigatório' }]}
                        >
                            <NumberInput
                                type="decimal"
                                precision={2}
                                size="small"
                                onChange={(val) => handleQuantidadeChange(record.key, 'quantidadeKg', val)}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
            },
        },
        {
            title: 'Controle',
            dataIndex: 'controle_tipo',
            key: 'controle_tipo',
            width: 90,
            render: (text) => (text === 'PESO' ? 'Peso' : 'Peça'),
        },
        {
            title: 'Data Entrega',
            dataIndex: 'dataEntrega',
            key: 'dataEntrega',
            width: 130,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="dataEntrega"
                            style={{ margin: 0 }}
                        >
                            <DateInput
                                format="DD/MM/YYYY"
                                size="small"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text ? dayjs(text).format('DD/MM/YYYY') : '-';
            },
        },
        {
            title: 'Dt lim. prod.',
            dataIndex: 'data_limite_prod',
            key: 'data_limite_prod',
            width: 110,
            render: (text) => (text ? dayjs(text).format('DD/MM/YYYY') : '-'),
        },
        {
            title: 'Lead time prod. (dias)',
            dataIndex: 'leadtime_producao',
            key: 'leadtime_producao',
            width: 130,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item name="leadtime_producao" style={{ margin: 0 }} initialValue={0}>
                            <NumberInput type="integer" min={0} size="small" style={{ width: '100%' }} />
                        </Form.Item>
                    );
                }
                return (text ?? 0);
            },
        },
        {
            title: 'Tol. atraso (dias)',
            dataIndex: 'dias_tolerancia_atraso',
            key: 'dias_tolerancia_atraso',
            width: 120,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item name="dias_tolerancia_atraso" style={{ margin: 0 }} initialValue={0}>
                            <NumberInput type="integer" min={0} size="small" style={{ width: '100%' }} />
                        </Form.Item>
                    );
                }
                return (text ?? 0);
            },
        },
        {
            title: 'Acabamento',
            dataIndex: 'acabamento',
            key: 'acabamento',
            width: 120,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="acabamento"
                            style={{ margin: 0 }}
                        >
                            <SelectInput
                                options={acabamentoOptions}
                                size="small"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text || '-';
            },
        },
        {
            title: 'Cubagem Prev. (m³)',
            dataIndex: 'cubagemPrevista',
            key: 'cubagemPrevista',
            width: 130,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="cubagemPrevista"
                            style={{ margin: 0 }}
                        >
                            <NumberInput
                                type="decimal"
                                precision={2}
                                size="small"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-';
            },
        },
        {
            title: 'Cubagem Real (m³)',
            dataIndex: 'cubagemReal',
            key: 'cubagemReal',
            width: 130,
            align: 'right',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="cubagemReal"
                            style={{ margin: 0 }}
                        >
                            <NumberInput
                                type="decimal"
                                precision={2}
                                size="small"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return text?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-';
            },
        },
        {
            title: 'Local Entrega',
            dataIndex: 'localEntrega',
            key: 'localEntrega',
            width: 150,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="localEntrega"
                            style={{ margin: 0 }}
                        >
                            <TextInput size="small" />
                        </Form.Item>
                    );
                }
                return text || '-';
            },
        },
        {
            title: 'Observações',
            dataIndex: 'observacoes',
            key: 'observacoes',
            width: 200,
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <Form.Item
                            name="observacoes"
                            style={{ margin: 0 }}
                        >
                            <TextAreaInput
                                rows={2}
                                size="small"
                            />
                        </Form.Item>
                    );
                }
                return text || '-';
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

    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'quantidadePecas' || col.dataIndex === 'quantidadeKg' ? 'number' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

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
                    components={{
                        body: {
                            cell: (props) => {
                                const { editing, dataIndex, title, inputType, record, children, ...restProps } = props;
                                return <td {...restProps}>{children}</td>;
                            },
                        },
                    }}
                    bordered
                    dataSource={dataSource}
                    columns={mergedColumns}
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

export default ItensTable;
