import { Button, Checkbox, Input, message, Popover, Space, Table } from 'antd';
import { FilterFilled } from '@ant-design/icons';
import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LoadingSpinner } from '../UI';
import { colors } from '../../styles/colors';

/** Dropdown de filtro por coluna (estilo Excel): pesquisa + lista de valores distintos com checkboxes + OK/Cancelar */
function ColumnFilterDropdown({ columnKey, getDistinctValuesForColumn, setSelectedKeys, selectedKeys, confirm, clearFilters }) {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const selectedSet = useMemo(() => new Set(selectedKeys || []), [selectedKeys]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const list = getDistinctValuesForColumn ? await getDistinctValuesForColumn(columnKey) : [];
                if (!cancelled) setOptions(Array.isArray(list) ? list : (list?.distinctValues || []));
            } catch (e) {
                if (!cancelled) setOptions([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [columnKey, getDistinctValuesForColumn]);

    const filteredOptions = useMemo(() => {
        if (!searchText.trim()) return options;
        const t = String(searchText).toLowerCase();
        return options.filter((o) => {
            const text = (o?.text ?? o?.value ?? '').toString().toLowerCase();
            const val = (o?.value ?? '').toString().toLowerCase();
            return text.includes(t) || val.includes(t);
        });
    }, [options, searchText]);

    const allValues = useMemo(() => filteredOptions.map((o) => o.value), [filteredOptions]);
    const allSelected = allValues.length > 0 && allValues.every((v) => selectedSet.has(v));

    const toggleSelectAll = () => {
        if (allSelected) {
            const next = selectedKeys.filter((k) => !allValues.includes(k));
            setSelectedKeys(next);
        } else {
            const next = [...new Set([...(selectedKeys || []), ...allValues])];
            setSelectedKeys(next);
        }
    };

    const toggleOption = (value) => {
        const next = selectedSet.has(value)
            ? (selectedKeys || []).filter((k) => k !== value)
            : [...(selectedKeys || []), value];
        setSelectedKeys(next);
    };

    return (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
                placeholder="Pesquisar"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ marginBottom: 8 }}
                allowClear
            />
            {loading ? (
                <div style={{ padding: '8px 0', color: '#999' }}>A carregar...</div>
            ) : (
                <>
                    <div style={{ marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}>
                        <Checkbox checked={allSelected} indeterminate={!allSelected && allValues.some((v) => selectedSet.has(v))} onChange={toggleSelectAll}>
                            (Selecionar Tudo)
                        </Checkbox>
                    </div>
                    <div style={{ maxHeight: 220, overflow: 'auto' }}>
                        {filteredOptions.map((opt) => {
                            const val = opt.value;
                            const text = (opt.text ?? opt.value ?? '').toString();
                            return (
                                <div key={val ?? text} style={{ marginBottom: 4 }}>
                                    <Checkbox checked={selectedSet.has(val)} onChange={() => toggleOption(val)}>
                                        {text || '(vazio)'}
                                    </Checkbox>
                                </div>
                            );
                        })}
                        {filteredOptions.length === 0 && <div style={{ color: '#999', padding: '4px 0' }}>Nenhum valor</div>}
                    </div>
                </>
            )}
            <Space style={{ marginTop: 8 }}>
                <Button type="primary" size="small" onClick={() => confirm(selectedKeys)}>
                    OK
                </Button>
                <Button size="small" onClick={() => clearFilters?.()}>
                    Limpar
                </Button>
            </Space>
        </div>
    );
}

const DROPPABLE_ID = 'paginated-table-body';

const DRAG_ROW_STYLES = {
    cursor: 'grab',
    transition: 'box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
};
const DRAG_ROW_DRAGGING_STYLES = {
    boxShadow: '0 12px 28px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08)',
    zIndex: 9999,
    backgroundColor: '#ffffff',
    cursor: 'grabbing',
    transition: 'box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
};

/**
 * Componente de Tabela Paginada Personalizada
 *
 * @param {function} fetchData - Função assíncrona para buscar dados do backend. Recebe (page, pageSize, sorterField, sortOrder).
 * @param {number} initialPageSize - Define o tamanho inicial da página. Default: 5.
 * @param {boolean} disabled - Desativa a tabela e suas interações. Default: false.
 * @param {boolean} reorderable - Se true, as linhas ficam arrastáveis para reordenar a página atual. Default: false.
 * @param {function} onReorder - Callback (orderedData) => void chamado após reordenar. Opcional.
 * @param {array} columns - Array de colunas da tabela no formato [{ title: 'Nome', dataIndex: 'nome', key: 'nome' }].
 * @param {array} actions - Array de objetos para botões de ação na tabela. Exemplo: [{ label: 'Editar', onClick: (record) => {} }].
 * @param {string} rowKey - Chave única para cada linha. Default: 'id'.
 * @param {object} rowSelection - Configurações para seleção de linhas. Exemplo: { selectedRowKeys, onChange: (keys) => {} }.
 * @param {object} expandable - Configurações para linhas expansíveis. Exemplo: { expandedRowRender: (record) => <p>{record.description}</p> }.
 * @param {object} scroll - Define o scroll da tabela para tornar responsiva. Default: { x: 'max-content' }.
 * @param {ReactNode} loadingIcon - Ícone customizado para o loading da tabela. Default: LoadingSpinner.
 * @param {function} getDistinctValuesForColumn - (columnKey) => Promise<Array<{ text, value }>> para colunas com filterable: true.
 * @param {boolean} usePopoverForColumnFilter - Se true, usa Popover em vez do Dropdown nativo no header para evitar bugs de posição. Default: false.
 * @param {object} restProps - Outras propriedades padrão para a tabela do Ant Design.
 */
const PaginatedTable = forwardRef(
    (
        {
            fetchData,
            initialPageSize = 5,
            disabled = false,
            reorderable = false,
            onReorder,
            columns,
            actions = [],
            rowKey = 'id',
            rowSelection = null, // Adiciona suporte para seleção de linhas
            expandable = null, // Suporte para linhas expansíveis
            scroll = { x: 'max-content' }, // Responsividade
            loadingIcon = <LoadingSpinner />, // Ícone customizado para loading
            hidePagination = false, // Se true, não exibe paginação e carrega todos os itens (pageSize grande)
            getDistinctValuesForColumn = null, // (columnKey) => Promise<Array<{ text, value }>> para colunas com filterable: true
            usePopoverForColumnFilter = false, // Se true, usa Popover em vez do Dropdown nativo para evitar bugs de posição
            ...restProps // Permite passar outras propriedades para a tabela
        },
        ref
    ) => {
        const effectivePageSize = hidePagination ? 100 : initialPageSize;
        const [data, setData] = useState([]);
        const [pagination, setPagination] = useState({
            current: 1,
            pageSize: effectivePageSize,
            total: 0,
            showSizeChanger: true, // Adiciona o seletor de tamanho de página
            pageSizeOptions: ['1', '2', '5', '10', '20', '50'],
            showTotal: (total, range) => `Mostrando ${range[0]}-${range[1]} de ${total} itens`, // Exibe total de itens
        });
        const [loading, setLoading] = useState(false);
        const [sorter, setSorter] = useState({ field: null, order: null }); // Estado para manter a ordenação atual
        const [columnFilters, setColumnFilters] = useState({}); // Filtros por coluna (Ant Design filters)
        const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Estado para linhas selecionadas
        const [openFilterKey, setOpenFilterKey] = useState(null); // Para Popover do filtro por coluna (fallback)
        const filterContentClickedRef = useRef(false); // Evita fechar o Popover ao clicar dentro do conteúdo

        // Função para buscar dados do backend (inclui columnFilters para filtro por coluna)
        const getData = async (page, pageSize, sorterField, sortOrder, filters) => {
            setLoading(true);
            try {
                const f = filters != null ? filters : columnFilters;
                const response = await fetchData(page, pageSize, sorterField, sortOrder, f);
                setData(response.data); // Dados retornados para a tabela
                setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.total,
                }));
            } catch (error) {
                message.error('Erro ao carregar os dados.');
            } finally {
                setLoading(false);
            }
        };

        // Função chamada ao mudar a página, tamanho da página, ordenação ou filtros (API nativa do Table)
        const handleTableChange = (newPagination, filters, newSorter) => {
            if (disabled) return; // Bloqueia mudanças na tabela se `disabled` for true

            const { current, pageSize } = newPagination;
            const sorterField = newSorter?.field || null;
            const sortOrder = newSorter?.order || null;

            setSorter({ field: sorterField, order: sortOrder }); // Atualiza o estado de ordenação
            setColumnFilters(filters || {}); // Persiste filtros (Table é a fonte de verdade)
            getData(current, pageSize, sorterField, sortOrder, filters);
        };

        // Expor a função `reloadTable` para recarregar os dados de fora do componente (mantém filtros activos)
        useImperativeHandle(
            ref,
            () => ({
                reloadTable() {
                    getData(pagination.current, pagination.pageSize, sorter?.field, sorter?.order, columnFilters);
                },
            }),
            [pagination.current, pagination.pageSize, sorter?.field, sorter?.order, columnFilters]
        );

        const handleDragEnd = useCallback(
            (result) => {
                if (!result.destination) return;
                const from = result.source.index;
                const to = result.destination.index;
                if (from === to) return;
                setData((prev) => {
                    const next = [...prev];
                    const [removed] = next.splice(from, 1);
                    next.splice(to, 0, removed);
                    onReorder?.(next);
                    return next;
                });
            },
            [onReorder]
        );

        const DroppableBodyWrapper = useMemo(
            () =>
                function DroppableBodyWrapper({ children, ...rest }) {
                    return (
                        <Droppable droppableId={DROPPABLE_ID}>
                            {(provided) => (
                                <tbody ref={provided.innerRef} {...provided.droppableProps} {...rest}>
                                    {children}
                                    {provided.placeholder}
                                </tbody>
                            )}
                        </Droppable>
                    );
                },
            []
        );

        const DraggableBodyRow = useCallback(
            (props) => {
                const { record, index, children, 'data-row-key': dataRowKey, style: rowStyle, ...rest } = props;
                const key = record?.[rowKey] ?? dataRowKey ?? index ?? 0;
                const safeIndex = typeof index === 'number' ? index : 0;
                return (
                    <Draggable draggableId={String(key)} index={safeIndex}>
                        {(provided, snapshot) => {
                            const dragStyle = snapshot.isDragging
                                ? {
                                      ...provided.draggableProps.style,
                                      ...DRAG_ROW_DRAGGING_STYLES,
                                  }
                                : {
                                      ...rowStyle,
                                      ...provided.draggableProps.style,
                                      ...DRAG_ROW_STYLES,
                                  };
                            return (
                                <tr
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    {...rest}
                                    style={dragStyle}
                                    data-row-key={dataRowKey}
                                    data-dragging={snapshot.isDragging ? 'true' : undefined}
                                >
                                    {children}
                                </tr>
                            );
                        }}
                    </Draggable>
                );
            },
            [rowKey]
        );

        const tableComponents = reorderable
            ? {
                  body: {
                      wrapper: DroppableBodyWrapper,
                      row: DraggableBodyRow,
                  },
              }
            : undefined;

        useEffect(() => {
            getData(pagination.current, pagination.pageSize, sorter?.field, sorter?.order);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Adicionar a coluna de ações, se existirem botões de ação
        const actionColumn = actions.length
            ? [
                {
                    title: 'Ações',
                    key: 'actions',
                    fixed: 'right',
                    width: 150,
                    render: (text, record) => (
                        <Space wrap>
                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    type={action.type || 'default'}
                                    onClick={() => action.onClick(record)}
                                    loading={action.loading}
                                    disabled={disabled || action.disabled}
                                    danger={action.danger || false}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </Space>
                    ),
                },
            ]
            : [];

        // Mapear colunas: sorter, e para filterable usar filterDropdown nativo + filteredValue (ou Popover como fallback)
        const combinedColumns = columns.map((column) => {
            const colKey = column.key ?? column.dataIndex;
            const isFilterable = column.filterable && (getDistinctValuesForColumn || column.getDistinctValues);
            const baseCol = {
                ...column,
                sorter: column.dataIndex && column.dataIndex !== 'actions',
                sortOrder: sorter.field === column.dataIndex ? sorter.order : null,
            };
            if (!isFilterable) return baseCol;

            const filteredValue = columnFilters[colKey] || null;
            if (usePopoverForColumnFilter) {
                const selectedKeys = filteredValue ?? [];
                const setSelectedKeys = (keys) => setColumnFilters((prev) => ({ ...prev, [colKey]: keys }));
                const confirm = (keys) => {
                    const nextFilters = keys != null ? { ...columnFilters, [colKey]: keys } : { ...columnFilters, [colKey]: selectedKeys };
                    setColumnFilters(nextFilters);
                    setOpenFilterKey(null);
                    getData(pagination.current, pagination.pageSize, sorter?.field ?? null, sorter?.order ?? null, nextFilters);
                };
                const clearFilters = () => {
                    const nextFilters = { ...columnFilters, [colKey]: null };
                    setColumnFilters(nextFilters);
                    setOpenFilterKey(null);
                    getData(pagination.current, pagination.pageSize, sorter?.field ?? null, sorter?.order ?? null, nextFilters);
                };
                const titleContent = typeof column.title === 'function' ? column.title(column, {}) : column.title;
                return {
                    ...baseCol,
                    filteredValue,
                    filterDropdown: undefined,
                    title: (
                        <Space size="small">
                            <span>{titleContent}</span>
                            <Popover
                                open={openFilterKey === colKey}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        // Um tick depois: se o clique foi dentro do conteúdo, o ref fica true e não fechamos
                                        setTimeout(() => {
                                            if (filterContentClickedRef.current) {
                                                filterContentClickedRef.current = false;
                                                return;
                                            }
                                            setOpenFilterKey(null);
                                        }, 0);
                                    }
                                }}
                                trigger="click"
                                content={
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            filterContentClickedRef.current = true;
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            filterContentClickedRef.current = true;
                                        }}
                                    >
                                        <ColumnFilterDropdown
                                            columnKey={colKey}
                                            getDistinctValuesForColumn={column.getDistinctValues || getDistinctValuesForColumn}
                                            setSelectedKeys={setSelectedKeys}
                                            selectedKeys={selectedKeys}
                                            confirm={confirm}
                                            clearFilters={clearFilters}
                                        />
                                    </div>
                                }
                            >
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    className={`ant-table-filter-trigger ${filteredValue?.length ? 'active' : ''}`}
                                    style={{
                                        color: filteredValue?.length ? colors.white : colors.text.secondary,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenFilterKey((k) => (k === colKey ? null : colKey));
                                    }}
                                >
                                    <FilterFilled />
                                </span>
                            </Popover>
                        </Space>
                    ),
                };
            }
            return {
                ...baseCol,
                filteredValue,
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                    <ColumnFilterDropdown
                        columnKey={colKey}
                        getDistinctValuesForColumn={column.getDistinctValues || getDistinctValuesForColumn}
                        setSelectedKeys={setSelectedKeys}
                        selectedKeys={selectedKeys}
                        confirm={confirm}
                        clearFilters={clearFilters}
                    />
                ),
                filterDropdownProps: {
                    getPopupContainer: (node) => node?.parentElement ?? document.body,
                },
            };
        }).concat(actionColumn);

        const mergedOnRow = reorderable
            ? (record, index) => ({
                  record,
                  index,
                  ...(restProps.onRow?.(record, index) || {}),
              })
            : restProps.onRow;

        const table = (
            <Table
                {...restProps}
                dataSource={data}
                columns={combinedColumns}
                pagination={hidePagination ? false : {
                    ...pagination,
                    disabled: disabled, // Desativa a paginação quando `disabled` for true
                }}
                loading={{
                    spinning: loading,
                    indicator: loadingIcon
                }}
                onChange={handleTableChange} // Função chamada ao mudar página, ordenação, etc.
                rowKey={rowKey} // Usar rowKey configurável
                scroll={scroll} // Adiciona scroll horizontal para evitar layout quebrado com muitas colunas
                components={tableComponents}
                onRow={reorderable ? mergedOnRow : restProps.onRow}
                rowSelection={
                    rowSelection
                        ? {
                            selectedRowKeys,
                            onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
                            ...rowSelection,
                        }
                        : null
                }
                expandable={expandable} // Suporte para linhas expansíveis
            />
        );

        if (reorderable) {
            return <DragDropContext onDragEnd={handleDragEnd}>{table}</DragDropContext>;
        }
        return table;
    }
);

export default PaginatedTable;
