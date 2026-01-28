import { Button, Col, Form, Layout, message, Row, Space } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlinePlusCircle, AiOutlineSave, AiOutlineSearch, AiOutlineFileText } from 'react-icons/ai';
import dayjs from 'dayjs';
import OrdemProducaoService from '../../../services/ordemProducaoService';
import ItensTable from '../components/ItensTable';

const { Content } = Layout;

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [loadingBuscarOP, setLoadingBuscarOP] = useState(false);
  const [form] = Form.useForm();
  const [itens, setItens] = useState([]);
  const [podeGerarOPsMESC, setPodeGerarOPsMESC] = useState(false);

  const [formConfig] = useState([
    {
      title: "Dados da Ordem (Cabeçalho)",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "numeroOPERP",
          required: true,
          placeholder: "Digite o número da OP do ERP",
          label: "Número da OP (ERP / TOTVS)",
        },
        {
          type: "date",
          id: "dataOP",
          required: true,
          placeholder: "Selecione a data",
          label: "Data da OP",
          format: "DD/MM/YYYY"
        },
        {
          type: "text",
          id: "numeroPedidoCliente",
          required: false,
          placeholder: "Digite o número do pedido do cliente",
          label: "Número do pedido do cliente",
        },
        {
          type: "text",
          id: "clienteNome",
          required: false,
          placeholder: "Cliente (somente leitura)",
          label: "Cliente",
          disabled: true,
        },
        {
          type: "select",
          id: "situacao",
          required: true,
          placeholder: "Selecione a situação",
          label: "Situação da OP",
          options: [
            { label: "Em cadastro", value: "Em cadastro" },
            { label: "Liberada", value: "Liberada" },
            { label: "Programada", value: "Programada" },
            { label: "Encerrada", value: "Encerrada" },
          ]
        },
      ],
    },
    {
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
    },
  ]);

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
            quantidadePecas: item.quantidadePecas || 0,
            quantidadeKg: item.quantidadeKg || 0,
            dataEntrega: item.dataEntrega ? dayjs(item.dataEntrega) : null,
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

        // Mapear os campos do backend para o frontend
        const deserializedRecord = {
          numeroOPERP: fetchedRecord.numeroOPERP || '',
          dataOP: convertToDayjs(fetchedRecord.dataOP),
          numeroPedidoCliente: fetchedRecord.numeroPedidoCliente || '',
          clienteNome: fetchedRecord.cliente?.nome || '',
          situacao: fetchedRecord.situacao || 'Em cadastro',
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
            quantidadePecas: item.quantidadePecas || 0,
            quantidadeKg: item.quantidadeKg || 0,
            dataEntrega: item.dataEntrega ? dayjs(item.dataEntrega) : null,
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
    }
  }, [editingRecord, fetchRecordData, form]);

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

        // Serializar itens
        const itensSerializados = itens.map(item => ({
          ...item,
          dataEntrega: item.dataEntrega ? (dayjs.isDayjs(item.dataEntrega) ? item.dataEntrega.format('YYYY-MM-DD') : item.dataEntrega) : null,
        }));

        const ordemData = {
          ...values,
          id: editingRecord?.id,
          dataOP: serializeDate(values.dataOP),
          cliente: {
            nome: values.clienteNome || '',
          },
          itens: itensSerializados,
          informacoesComplementares: {
            naturezaOperacao: values.naturezaOperacao || '',
            numeroEmbarque: values.numeroEmbarque || '',
            numeroNotaFiscal: values.numeroNotaFiscal || '',
            transportadora: values.transportadora || '',
          },
          ativo: true,
        };

        const response = await OrdemProducaoService.upsert(ordemData);
        
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
    [editingRecord, itens, onSave]
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
              styles={{
                header: {
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#262626' }}>
                  {editingRecord ? 'Editar Ordem de Produção' : 'Nova Ordem de Produção'}
                </h2>
                <Button
                  type="default"
                  icon={<AiOutlineArrowLeft />}
                  onClick={onCancel}
                  disabled={loading}
                  size="middle"
                >
                  Voltar
                </Button>
              </div>

              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                    {/* Botão Buscar OP do ERP */}
                    <Row style={{ marginBottom: 16 }}>
                      <Col span={24}>
                        <Button
                          type="default"
                          icon={<AiOutlineSearch />}
                          onClick={handleBuscarOPDoERP}
                          loading={loadingBuscarOP}
                          size="middle"
                        >
                          Buscar OP do ERP
                        </Button>
                      </Col>
                    </Row>

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

                    {/* Seção de Itens */}
                    <div style={{ marginTop: 24, marginBottom: 24 }}>
                      <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                        Itens da Ordem
                      </h3>
                      <ItensTable
                        value={itens}
                        onChange={setItens}
                        form={form}
                      />
                    </div>

                    {/* Botões adicionais */}
                    <Row justify="end" style={{ marginTop: 16 }}>
                      <Space>
                        {podeGerarOPsMESC && editingRecord?.id && (
                          <Button
                            type="default"
                            icon={<AiOutlinePlusCircle />}
                            onClick={handleGerarOPsMESC}
                            disabled={loading}
                            size="middle"
                          >
                            Gerar OPs do MESC
                          </Button>
                        )}
                        {editingRecord?.id && itens && itens.length > 0 && (
                          <Button
                            type="primary"
                            icon={<AiOutlineFileText />}
                            onClick={handleCadastrarOP}
                            disabled={loading}
                            size="middle"
                          >
                            Cadastrar OP
                          </Button>
                        )}
                      </Space>
                    </Row>
                  </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

// Adicionar handler de submit do form
AddEdit.displayName = 'AddEdit';

export default AddEdit;
