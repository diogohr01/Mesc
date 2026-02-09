import { Badge, Button, Col, Form, InputNumber, Layout, message, Row, Space, Table } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlinePlus, AiOutlinePlusCircle, AiOutlineSave, AiOutlineSearch, AiOutlineFileText, AiOutlineEye, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import dayjs from 'dayjs';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import ClientesService from '../../../services/clientesService';
import PedidosService from '../../../services/pedidosService';
import ItensTable from '../components/ItensTable';
import FerramentasOPTable from '../components/FerramentasOPTable';
import FerramentaOPFilhaModal from '../components/FerramentaOPFilhaModal';
import NovaOPFilhaModal from '../components/NovaOPFilhaModal';

const { Content } = Layout;

// Nova OP pela tela é sempre OP Filha; OP Pai só é criada via Pedidos "Cadastrar OP".
const AddEdit = ({ editingRecord, onCancel, onSave, onEdit, onView }) => {
  const [loading, setLoading] = useState(false);
  const [loadingBuscarOP, setLoadingBuscarOP] = useState(false);
  const [form] = Form.useForm();
  const [itens, setItens] = useState([]);
  const [podeGerarOPsMESC, setPodeGerarOPsMESC] = useState(false);
  const [opsPaiOptions, setOpsPaiOptions] = useState([]);
  const [clientesOptions, setClientesOptions] = useState([]);
  const [ordemData, setOrdemData] = useState(null);
  const [opFilhasList, setOpFilhasList] = useState([]);
  const [loadingOpFilhas, setLoadingOpFilhas] = useState(false);
  const [modalNovaFilhaOpen, setModalNovaFilhaOpen] = useState(false);
  const [modalFerramentaOpen, setModalFerramentaOpen] = useState(false);

  // Carregar clientes para dropdown (pedidos são carregados sob demanda no campo Nº Pedido do Cliente)
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const res = await ClientesService.getAll({ page: 1, pageSize: 1000 });
        if (res?.data?.data) {
          setClientesOptions(
            res.data.data.map((c) => ({
              label: `${c.codigoEMS || c.id} - ${c.nome}`,
              value: c.codigoEMS || c.id,
            }))
          );
        }
      } catch (e) {
        console.error('Erro ao carregar clientes:', e);
      }
    };
    loadClientes();
  }, []);

  // Carregar OPs Pai para dropdown (nova OP Filha ou edição de OP Filha)
  useEffect(() => {
    const loadOpsPai = async () => {
      try {
        const response = await OrdemProducaoService.getAll({
          page: 1,
          pageSize: 1000,
          tipoOp: 'PAI',
        });
        if (response?.data?.data) {
          const options = response.data.data.map((op) => ({
            label: `${op.numeroOPERP} - ${op.cliente?.nome || '-'}`,
            value: op.id,
          }));
          setOpsPaiOptions(options);
        }
      } catch (error) {
        console.error('Erro ao carregar OPs Pai:', error);
      }
    };
    loadOpsPai();
  }, []);

  const formConfig = React.useMemo(() => {
    const isNovaOuFilha = !editingRecord || editingRecord.tipoOp === 'FILHA';
    const isOpFilha = editingRecord?.tipoOp === 'FILHA' || !editingRecord;
    const opPaiDisabled = isOpFilha && !!editingRecord?.id;
    const isOpPaiFromPedido = editingRecord?.tipoOp === 'PAI' && (editingRecord?.pedidoId || ordemData?.pedidoId);

    const questionsCabecalho = [
      ...(isNovaOuFilha
        ? [
            {
              type: 'select',
              id: 'opPaiId',
              required: true,
              placeholder: 'Selecione a OP Pai',
              label: 'OP Pai',
              options: opsPaiOptions,
              showSearch: true,
              disabled: opPaiDisabled,
            },
          ]
        : []),
      {
        type: "text",
        id: "numeroOPERP",
        required: true,
        placeholder: "Digite o número da OP do ERP",
        label: "Número da OP (EMS/TOTVS)",
      },
      {
        type: "date",
        id: "dataOP",
        required: true,
        placeholder: "Selecione a data",
        label: "Data do Registro",
        format: "DD/MM/YYYY",
        disabled: isOpPaiFromPedido,
      },
      {
        type: "date",
        id: "dataEntrega",
        required: false,
        placeholder: "Selecione a data de entrega",
        label: "Data de Entrega",
        format: "DD/MM/YYYY"
      },
      {
        type: "select",
        id: "situacao",
        required: true,
        placeholder: "Selecione a situação",
        label: "Situação",
        options: [
          { label: "Em cadastro", value: "Em cadastro" },
          { label: "Liberada", value: "Liberada" },
          { label: "Programada", value: "Programada" },
          { label: "Encerrada", value: "Encerrada" },
        ]
      },
      {
        type: "text",
        id: "itemCodigo",
        required: false,
        placeholder: "Código do item",
        label: "Item a Produzir (Código)",
        disabled: isOpFilha || isOpPaiFromPedido,
      },
      {
        type: "text",
        id: "itemDescricao",
        required: false,
        placeholder: "Descrição",
        label: "Item a Produzir (Descrição)",
        disabled: true,
      },
      ...(isOpFilha ? [] : [
        {
          type: "integer",
          id: "quantidadeAProduzir",
          required: false,
          placeholder: "Quantidade",
          label: "Quantidade a Produzir",
          disabled: isOpPaiFromPedido,
        },
        {
          type: "select",
          id: "clienteId",
          required: false,
          placeholder: "Selecione o cliente",
          label: "Cliente",
          options: clientesOptions,
          showSearch: true,
          disabled: isOpPaiFromPedido,
        },
        {
          type: "async-select",
          id: "numeroPedidoCliente",
          required: false,
          placeholder: "Pesquise pelo nº do pedido do cliente",
          label: "Nº Pedido do Cliente",
          disabled: isOpPaiFromPedido,
          fetchOptionsOnSearch: async (term) => {
            if (!term || !String(term).trim()) return [];
            const res = await PedidosService.getAll({
              page: 1,
              pageSize: 30,
              pedidoNumero: String(term).trim(),
            });
            const list = res?.data?.data ?? [];
            return list.map((p) => ({
              label: `${p.pedidoNumero || p.codigo} - ${p.cliente?.nome || '-'}`,
              value: p.pedidoNumero || p.codigo,
            }));
          },
        },
      ]),
      {
        type: "textarea",
        id: "observacoes",
        required: false,
        placeholder: "Observações",
        label: "Observações",
      },
    ];

    const secoes = [
      {
        title: "Dados da Ordem (Cabeçalho)",
        columns: 2,
        questions: questionsCabecalho,
      },
    ];

    if (!isOpFilha) {
      secoes.push({
        title: "Informações Complementares",
        columns: 2,
        questions: [
          {
            type: "text",
            id: "naturezaOperacao",
            required: false,
            placeholder: "Digite a natureza da operação",
            label: "Natureza da operação",
          },
          {
            type: "text",
            id: "numeroEmbarque",
            required: false,
            placeholder: "Digite o número do embarque",
            label: "Número do embarque",
          },
          {
            type: "text",
            id: "numeroNotaFiscal",
            required: false,
            placeholder: "Digite o número da nota fiscal",
            label: "Número da nota fiscal",
          },
          {
            type: "select",
            id: "transportadora",
            required: false,
            placeholder: "Selecione a transportadora",
            label: "Transportadora",
            options: [
              { label: "Transportadora ABC", value: "Transportadora ABC" },
              { label: "Transportadora XYZ", value: "Transportadora XYZ" },
              { label: "Transportadora 123", value: "Transportadora 123" },
            ]
          },
        ],
      });
    }

    return secoes;
  }, [opsPaiOptions, clientesOptions, editingRecord, ordemData]);

  // Função para buscar OP do ERP
  const handleBuscarOPDoERP = useCallback(async () => {
    const numeroOP = form.getFieldValue('numeroOPERP');
    if (!numeroOP) {
      message.warning('Por favor, informe o número da OP do ERP primeiro.');
      return;
    }

    setLoadingBuscarOP(true);
    try {
      const response = await OrdemProducaoService.buscarOPDoERP(numeroOP);
      if (response.success && response.data) {
        const dadosOP = response.data;
        
        // Preencher campos automaticamente
        form.setFieldsValue({
          dataOP: dadosOP.dataOP ? dayjs(dadosOP.dataOP) : null,
          numeroPedidoCliente: dadosOP.numeroPedidoCliente || '',
          clienteNome: dadosOP.cliente?.nome || '',
          situacao: dadosOP.situacao || 'Em cadastro',
        });

        // Preencher itens se existirem
        if (dadosOP.itens && dadosOP.itens.length > 0) {
          const itensFormatados = dadosOP.itens.map((item, index) => ({
            key: `item-${index}-${Date.now()}`,
            codigoItem: item.codigoItem || '',
            descricaoItem: item.descricaoItem || '',
            codigoItemCliente: item.codigoItemCliente || '',
            controle_tipo: item.controle_tipo || 'PEÇA',
            quantidadePecas: item.quantidadePecas || 0,
            quantidadeKg: item.quantidadeKg || 0,
            dataEntrega: item.dataEntrega ? dayjs(item.dataEntrega) : null,
            data_limite_prod: item.data_limite_prod ? dayjs(item.data_limite_prod) : null,
            acabamento: item.acabamento || '',
            cubagemPrevista: item.cubagemPrevista || 0,
            cubagemReal: item.cubagemReal || null,
            localEntrega: item.localEntrega || '',
            observacoes: item.observacoes || '',
          }));
          setItens(itensFormatados);
        }

        setPodeGerarOPsMESC(true);
        message.success('Dados da OP carregados com sucesso!');
      } else {
        message.error('OP não encontrada no ERP.');
      }
    } catch (error) {
      message.error('Erro ao buscar OP do ERP.');
      console.error('Erro:', error);
    } finally {
      setLoadingBuscarOP(false);
    }
  }, [form]);

  // Função para buscar dados do registro quando em modo de edição
  const fetchRecordData = useCallback(async (recordId) => {
    setLoading(true);
    try {
      const result = await OrdemProducaoService.getById(recordId);

      if (result.success && result.data) {
        const fetchedRecord = result.data;
        setOrdemData(fetchedRecord);

        // Converter datas para dayjs
        const convertToDayjs = (dateString) => {
          if (!dateString) return null;
          try {
            const dayjsDate = dayjs(dateString);
            return dayjsDate.isValid() ? dayjsDate : null;
          } catch (error) {
            return null;
          }
        };

        const primeiroItem = fetchedRecord.itens?.[0];
        const dataEntregaOrdem = fetchedRecord.dataEntrega ?? primeiroItem?.dataEntrega;
        const deserializedRecord = {
          opPaiId: fetchedRecord.opPaiId ?? undefined,
          numeroOPERP: fetchedRecord.numeroOPERP || '',
          dataOP: convertToDayjs(fetchedRecord.dataOP),
          dataEntrega: dataEntregaOrdem ? convertToDayjs(dataEntregaOrdem) : null,
          numeroPedidoCliente: fetchedRecord.numeroPedidoCliente || '',
          clienteId: fetchedRecord.cliente?.codigo ?? undefined,
          situacao: fetchedRecord.situacao || 'Em cadastro',
          itemCodigo: primeiroItem?.codigoItem || '',
          itemDescricao: primeiroItem?.descricaoItem || '',
          quantidadeAProduzir: primeiroItem?.quantidadePecas ?? 0,
          observacoes: fetchedRecord.observacoes || '',
          naturezaOperacao: fetchedRecord.informacoesComplementares?.naturezaOperacao || '',
          numeroEmbarque: fetchedRecord.informacoesComplementares?.numeroEmbarque || '',
          numeroNotaFiscal: fetchedRecord.informacoesComplementares?.numeroNotaFiscal || '',
          transportadora: fetchedRecord.informacoesComplementares?.transportadora || '',
        };

        // Formatar itens
        if (fetchedRecord.itens && fetchedRecord.itens.length > 0) {
          const itensFormatados = fetchedRecord.itens.map((item, index) => ({
            key: `item-${item.id || index}-${Date.now()}`,
            codigoItem: item.codigoItem || '',
            descricaoItem: item.descricaoItem || '',
            codigoItemCliente: item.codigoItemCliente || '',
            controle_tipo: item.controle_tipo || 'PEÇA',
            quantidadePecas: item.quantidadePecas || 0,
            quantidadeKg: item.quantidadeKg || 0,
            dataEntrega: item.dataEntrega ? dayjs(item.dataEntrega) : null,
            data_limite_prod: item.data_limite_prod ? dayjs(item.data_limite_prod) : null,
            acabamento: item.acabamento || '',
            cubagemPrevista: item.cubagemPrevista || 0,
            cubagemReal: item.cubagemReal || null,
            localEntrega: item.localEntrega || '',
            observacoes: item.observacoes || '',
          }));
          setItens(itensFormatados);
        }

        setPodeGerarOPsMESC(!!fetchedRecord.numeroPedidoCliente);

        // Aguardar o componente ser renderizado antes de definir os valores
        setTimeout(() => {
          try {
            form.resetFields();
            form.setFieldsValue(deserializedRecord);
          } catch (error) {
            console.error('Erro ao definir valores no formulário:', error);
          }
        }, 200);
      }
    } catch (error) {
      message.error('Erro ao buscar o registro.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Buscar dados quando o componente for montado em modo de edição
  useEffect(() => {
    if (editingRecord?.id) {
      fetchRecordData(editingRecord.id);
    } else {
      form.resetFields();
      setItens([]);
      setPodeGerarOPsMESC(false);
      setOrdemData(null);
      setOpFilhasList([]);
    }
  }, [editingRecord, fetchRecordData, form]);

  // Carregar OP Filhas quando estiver editando um OP Pai
  const fetchOpFilhas = useCallback(async () => {
    if (!editingRecord?.id || editingRecord?.tipoOp !== 'PAI') return;
    setLoadingOpFilhas(true);
    try {
      const response = await OrdemProducaoService.getAll({
        opPaiId: editingRecord.id,
        page: 1,
        pageSize: 100,
      });
      setOpFilhasList(response?.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar OP Filhas:', error);
      setOpFilhasList([]);
    } finally {
      setLoadingOpFilhas(false);
    }
  }, [editingRecord?.id, editingRecord?.tipoOp]);

  useEffect(() => {
    if (editingRecord?.tipoOp === 'PAI' && editingRecord?.id) {
      fetchOpFilhas();
    } else {
      setOpFilhasList([]);
    }
  }, [editingRecord?.tipoOp, editingRecord?.id, fetchOpFilhas]);

  const handleDeleteFilha = useCallback(
    async (record) => {
      try {
        await OrdemProducaoService.delete(record.id);
        message.success('OP Filha excluída com sucesso!');
        fetchOpFilhas();
      } catch (error) {
        message.error('Erro ao excluir OP Filha.');
        console.error(error);
      }
    },
    [fetchOpFilhas]
  );

  const columnsOpFilhas = React.useMemo(
    () => [
      { title: 'OP ERP', dataIndex: 'numeroOPERP', key: 'numeroOPERP', width: 120 },
      {
        title: 'Data',
        dataIndex: 'dataOP',
        key: 'dataOP',
        width: 120,
        render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
      },
      {
        title: 'Data de Entrega',
        key: 'dataEntrega',
        width: 130,
        render: (_, record) => {
          const dataEntrega = record.dataEntrega ?? record.itens?.[0]?.dataEntrega;
          return dataEntrega ? dayjs(dataEntrega).format('DD/MM/YYYY') : '-';
        },
      },
      {
        title: 'Situação',
        dataIndex: 'situacao',
        key: 'situacao',
        width: 130,
        render: (situacao) => {
          const colorMap = {
            'Em cadastro': 'default',
            Liberada: 'processing',
            Programada: 'warning',
            Encerrada: 'success',
          };
          return <Badge status={colorMap[situacao] || 'default'} text={situacao} />;
        },
      },
      {
        title: 'Qtd Total (peças)',
        dataIndex: 'itens',
        key: 'quantidadeTotal',
        width: 120,
        align: 'right',
        render: (itens) => {
          if (!itens || !Array.isArray(itens)) return '0';
          const total = itens.reduce((sum, item) => sum + (parseFloat(item.quantidadePecas) || 0), 0);
          return total.toLocaleString('pt-BR');
        },
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            {onView && (
              <Button type="text" size="small" icon={<AiOutlineEye />} onClick={() => onView(record)} title="Visualizar" />
            )}
            {onEdit && (
              <Button type="text" size="small" icon={<AiOutlineEdit />} onClick={() => onEdit(record)} title="Editar" />
            )}
            <Button type="text" danger size="small" icon={<AiOutlineDelete />} onClick={() => handleDeleteFilha(record)} title="Excluir" />
          </Space>
        ),
      },
    ],
    [onView, onEdit, handleDeleteFilha]
  );

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);
      try {
        // Serializar datas
        const serializeDate = (dateValue) => {
          if (!dateValue) return null;
          if (typeof dateValue === 'string') return dateValue;
          if (dayjs.isDayjs(dateValue)) {
            return dateValue.format('YYYY-MM-DD');
          }
          return null;
        };

        // Serializar itens (preserva controle_tipo e data_limite_prod para propagação)
        const itensSerializados = itens.map(item => ({
          ...item,
          controle_tipo: item.controle_tipo || 'PEÇA',
          dataEntrega: item.dataEntrega ? (dayjs.isDayjs(item.dataEntrega) ? item.dataEntrega.format('YYYY-MM-DD') : item.dataEntrega) : null,
          data_limite_prod: item.data_limite_prod ? (dayjs.isDayjs(item.data_limite_prod) ? item.data_limite_prod.format('YYYY-MM-DD') : item.data_limite_prod) : null,
        }));

        const isOpFilha = editingRecord?.tipoOp === 'FILHA' || !editingRecord;
        const itensParaSalvar = itensSerializados.length
          ? itensSerializados.map((item, idx) =>
              idx === 0 && !isOpFilha && (values.itemCodigo != null || values.quantidadeAProduzir != null)
                ? {
                    ...item,
                    codigoItem: values.itemCodigo ?? item.codigoItem,
                    descricaoItem: values.itemDescricao ?? item.descricaoItem,
                    quantidadePecas: values.quantidadeAProduzir ?? item.quantidadePecas,
                  }
                : item
            )
          : itensSerializados;

        const dataEntregaSerializada = serializeDate(values.dataEntrega);
        const itensComDataEntrega = itensParaSalvar.length > 0 && dataEntregaSerializada
          ? itensParaSalvar.map((item, idx) => idx === 0 ? { ...item, dataEntrega: dataEntregaSerializada } : item)
          : itensParaSalvar;

        const dadosExistentes = ordemData;
        const payload = {
          ...values,
          id: editingRecord?.id,
          tipoOp: editingRecord?.tipoOp || 'FILHA',
          opPaiId: values.opPaiId || undefined,
          dataOP: serializeDate(values.dataOP),
          dataEntrega: dataEntregaSerializada || undefined,
          cliente: isOpFilha && dadosExistentes?.cliente
            ? dadosExistentes.cliente
            : { codigo: values.clienteId, nome: undefined },
          numeroPedidoCliente: isOpFilha && dadosExistentes?.numeroPedidoCliente != null
            ? dadosExistentes.numeroPedidoCliente
            : (values.numeroPedidoCliente ?? ''),
          observacoes: values.observacoes || '',
          itens: itensComDataEntrega,
          informacoesComplementares: isOpFilha && dadosExistentes?.informacoesComplementares
            ? dadosExistentes.informacoesComplementares
            : {
                naturezaOperacao: values.naturezaOperacao || '',
                numeroEmbarque: values.numeroEmbarque || '',
                numeroNotaFiscal: values.numeroNotaFiscal || '',
                transportadora: values.transportadora || '',
              },
          ativo: true,
        };

        const response = await OrdemProducaoService.upsert(payload);
        
        if (response.success) {
          message.success(editingRecord ? 'Ordem de Produção atualizada com sucesso!' : 'Ordem de Produção criada com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar Ordem de Produção.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    },
    [editingRecord, itens, onSave, ordemData]
  );

  const handleGerarOPsMESC = useCallback(async () => {
    if (!editingRecord?.id) {
      message.warning('Salve a ordem primeiro antes de gerar OPs do MESC.');
      return;
    }

    setLoading(true);
    try {
      const response = await OrdemProducaoService.gerarOPsMESC(editingRecord.id);
      if (response.success) {
        message.success('OPs do MESC geradas com sucesso!');
      }
    } catch (error) {
      message.error('Erro ao gerar OPs do MESC.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [editingRecord]);

  const handleCadastrarOP = useCallback(async () => {
    if (!editingRecord?.id) {
      message.warning('Salve a ordem primeiro antes de cadastrar OP.');
      return;
    }

    if (!itens || itens.length === 0) {
      message.warning('Adicione itens à ordem antes de cadastrar OP.');
      return;
    }

    setLoading(true);
    try {
      // Simular criação de OP do MESC
      // Na implementação real, isso criaria uma OP do MESC baseada nos itens
      message.success('OP cadastrada com sucesso!');
      // Opcional: redirecionar ou atualizar dados
    } catch (error) {
      message.error('Erro ao cadastrar OP.');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [editingRecord, itens]);

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title={editingRecord ? 'Editar Ordem de Produção' : 'Nova OP Filha'}
              extra={<Button type="default" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar</Button>}
            >
              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                    {/* Botão Buscar OP do ERP */}
                    

                    {/* Formulário principal */}
                    <DynamicForm
                      formConfig={formConfig}
                      formInstance={form}
                      onSubmit={handleSave}
                      submitText="Salvar Ordem"
                      submitIcon={<AiOutlineSave />}
                      submitOnSide={false}
                      onClose={onCancel}
                    />

                    {/* OP Filhas (somente quando editando OP Pai) */}
                    {editingRecord?.tipoOp === 'PAI' && editingRecord?.id && (
                      <Card
                        size="small"
                        title="OP Filhas"
                        style={{ marginTop: 24, marginBottom: 24 }}
                        extra={
                          <Button
                            type="primary"
                            icon={<AiOutlinePlus />}
                            onClick={() => setModalNovaFilhaOpen(true)}
                            size="middle"
                          >
                            Nova OP Filha
                          </Button>
                        }
                      >
                        {loadingOpFilhas ? (
                          <div style={{ padding: 24, textAlign: 'center' }}>Carregando OP Filhas...</div>
                        ) : opFilhasList.length === 0 ? (
                          <div style={{ padding: 16, background: '#fafafa', borderRadius: 6, color: '#666' }}>
                            Nenhuma OP Filha cadastrada. Clique em &quot;Nova OP Filha&quot; para cadastrar.
                          </div>
                        ) : (
                          <Table
                            dataSource={opFilhasList}
                            columns={columnsOpFilhas}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            bordered
                            scroll={{ x: 'max-content' }}
                          />
                        )}
                      </Card>
                    )}

                    {/* Grid Ferramentas da OP (apenas nas OP Filhas) */}
                    {(editingRecord?.tipoOp === 'FILHA' || !editingRecord) && (
                      <div style={{ marginTop: 24, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                            Ferramentas da OP
                          </h3>
                          {editingRecord?.id && (
                            <Button
                              type="primary"
                              size="middle"
                              onClick={() => setModalFerramentaOpen(true)}
                            >
                              Configurar ferramenta
                            </Button>
                          )}
                        </div>
                        <FerramentasOPTable ordemData={ordemData} />
                      </div>
                    )}

                    {/* Seção de Itens */}
                    <div style={{ marginTop: 24, marginBottom: 24 }}>
                      <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                        Itens da Ordem
                      </h3>
                      {(editingRecord?.tipoOp === 'PAI' && (editingRecord?.pedidoId || ordemData?.pedidoId)) ? (
                        <>
                          <p style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
                            Itens vindos do pedido/TOTVS (somente leitura).
                          </p>
                          <Table
                            dataSource={itens}
                            columns={[
                              { title: 'Código Item', dataIndex: 'codigoItem', key: 'codigoItem', width: 120 },
                              { title: 'Descrição', dataIndex: 'descricaoItem', key: 'descricaoItem' },
                              { title: 'Cód. Cliente', dataIndex: 'codigoItemCliente', key: 'codigoItemCliente', width: 100 },
                              { title: 'Controle', dataIndex: 'controle_tipo', key: 'controle_tipo', width: 90, render: (t) => (t === 'PESO' ? 'Peso' : 'Peça') },
                              { title: 'Qtd (peças)', dataIndex: 'quantidadePecas', key: 'quantidadePecas', width: 100, align: 'right', render: (v) => v?.toLocaleString('pt-BR') ?? '0' },
                              { title: 'Qtd (kg)', dataIndex: 'quantidadeKg', key: 'quantidadeKg', width: 100, align: 'right', render: (v) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00' },
                              { title: 'Data Entrega', dataIndex: 'dataEntrega', key: 'dataEntrega', width: 120, render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
                              { title: 'Dt lim. prod.', dataIndex: 'data_limite_prod', key: 'data_limite_prod', width: 110, render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '-' },
                            ]}
                            rowKey={(r, i) => r.key ?? r.id ?? `item-${i}`}
                            pagination={false}
                            size="small"
                            bordered
                          />
                        </>
                      ) : editingRecord?.tipoOp === 'FILHA' && editingRecord?.id ? (
                        <>
                          <p style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
                            Itens herdados da OP Pai. Edite apenas a quantidade a trabalhar.
                          </p>
                          <Table
                            dataSource={itens}
                            columns={[
                              { title: 'Código Item', dataIndex: 'codigoItem', key: 'codigoItem', width: 120 },
                              { title: 'Descrição', dataIndex: 'descricaoItem', key: 'descricaoItem' },
                              { title: 'Controle', dataIndex: 'controle_tipo', key: 'controle_tipo', width: 90, render: (t) => (t === 'PESO' ? 'Peso' : 'Peça') },
                              {
                                title: 'Qtd (peças)',
                                dataIndex: 'quantidadePecas',
                                key: 'quantidadePecas',
                                width: 120,
                                align: 'right',
                                render: (v, record, index) => (
                                  <InputNumber
                                    size="small"
                                    min={0}
                                    value={v}
                                    onChange={(val) => {
                                      const next = [...itens];
                                      next[index] = { ...next[index], quantidadePecas: val ?? 0 };
                                      setItens(next);
                                    }}
                                    style={{ width: '100%' }}
                                    controls={false}
                                  />
                                ),
                              },
                              {
                                title: 'Qtd (kg)',
                                dataIndex: 'quantidadeKg',
                                key: 'quantidadeKg',
                                width: 120,
                                align: 'right',
                                render: (v, record, index) => (
                                  <InputNumber
                                    size="small"
                                    min={0}
                                    step={0.01}
                                    precision={2}
                                    value={v}
                                    onChange={(val) => {
                                      const next = [...itens];
                                      next[index] = { ...next[index], quantidadeKg: val ?? 0 };
                                      setItens(next);
                                    }}
                                    style={{ width: '100%' }}
                                    controls={false}
                                  />
                                ),
                              },
                            ]}
                            rowKey={(r, i) => r.key ?? r.id ?? `item-${i}`}
                            pagination={false}
                            size="small"
                            bordered
                          />
                        </>
                      ) : (
                        <ItensTable
                          value={itens}
                          onChange={setItens}
                          form={form}
                        />
                      )}
                    </div>

                    {/* Botões adicionais */}
                    
                  </div>
              )}
            </Card>

            {editingRecord?.tipoOp === 'PAI' && editingRecord?.id && (
              <NovaOPFilhaModal
                open={modalNovaFilhaOpen}
                onClose={() => setModalNovaFilhaOpen(false)}
                opPaiId={editingRecord.id}
                clientesOptions={clientesOptions}
                onSuccess={() => {
                  fetchOpFilhas();
                  setModalNovaFilhaOpen(false);
                }}
              />
            )}
            {(editingRecord?.tipoOp === 'FILHA' || !editingRecord) && editingRecord?.id && (
              <FerramentaOPFilhaModal
                open={modalFerramentaOpen}
                onClose={() => setModalFerramentaOpen(false)}
                ordemData={ordemData}
                onSuccess={(updatedOP) => {
                  setOrdemData(updatedOP);
                  setModalFerramentaOpen(false);
                }}
              />
            )}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

// Adicionar handler de submit do form
AddEdit.displayName = 'AddEdit';

export default AddEdit;
