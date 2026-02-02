import { Button, Col, Form, Layout, message, Row, Space } from 'antd';
import { Card, DynamicForm, Loading } from '../../../components';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineSave, AiOutlineSearch, AiOutlineFileText } from 'react-icons/ai';
import dayjs from 'dayjs';
import PedidosService from '../../../services/pedidosService';
import ClientesService from '../../../services/clientesService';
import PedidosItensTable from '../components/PedidosItensTable';

const { Content } = Layout;

// Pedidos: apenas visualização, edição de campos permitidos e configuração de itens via modal.
// Novos pedidos só via integração TOTVS (Buscar Pedido do Totvs).
const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [loadingBuscarPedido, setLoadingBuscarPedido] = useState(false);
  const [form] = Form.useForm();
  const [itens, setItens] = useState([]);
  const [clientesOptions, setClientesOptions] = useState([]);

  // Carregar opções de clientes
  useEffect(() => {
    const loadClientes = async () => {
      try {
        const response = await ClientesService.getAll({ page: 1, pageSize: 1000 });
        if (response.success && response.data?.data) {
          const options = response.data.data.map(cliente => ({
            label: `${cliente.codigoEMS} - ${cliente.nome}`,
            value: cliente.codigoEMS || cliente.id,
          }));
          setClientesOptions(options);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };
    loadClientes();
  }, []);

  // Form config dinâmico baseado em clientesOptions
  const formConfig = React.useMemo(() => [
    {
      title: "Dados do Pedido (Cabeçalho)",
      columns: 2,
      questions: [
        {
          type: "text",
          id: "codigo",
          required: false,
          placeholder: "Gerado automaticamente",
          label: "Código",
          disabled: true,
        },
        {
          type: "date",
          id: "data",
          required: true,
          placeholder: "Selecione a data",
          label: "Data",
          format: "DD/MM/YYYY"
        },
        {
          type: "select",
          id: "situacao",
          required: true,
          placeholder: "Selecione a situação",
          label: "Situação do pedido",
          options: [
            { label: "NÃO INICIADA", value: "NÃO INICIADA" },
            { label: "EM ANDAMENTO", value: "EM ANDAMENTO" },
            { label: "FINALIZADA", value: "FINALIZADA" },
          ]
        },
        {
          type: "text",
          id: "pedidoNumero",
          required: true,
          placeholder: "Digite o número do pedido do Totvs",
          label: "Pedido nº",
        },
        {
          type: "select",
          id: "clienteId",
          required: true,
          placeholder: "Selecione o cliente",
          label: "Cliente",
          options: clientesOptions,
          showSearch: true,
        },
        {
          type: "textarea",
          id: "observacao",
          required: false,
          placeholder: "Digite observações",
          label: "Observação",
        },
      ],
    },
  ], [clientesOptions]);

  // Função para buscar pedido do Totvs
  const handleBuscarPedidoDoTotvs = useCallback(async () => {
    const pedidoNumero = form.getFieldValue('pedidoNumero');
    if (!pedidoNumero) {
      message.warning('Por favor, informe o número do pedido do Totvs primeiro.');
      return;
    }

    setLoadingBuscarPedido(true);
    try {
      const response = await PedidosService.buscarPedidoDoTotvs(pedidoNumero);
      if (response.success && response.data) {
        const dadosPedido = response.data;
        
        // Preencher campos automaticamente
        form.setFieldsValue({
          data: dadosPedido.data ? dayjs(dadosPedido.data) : null,
          clienteId: dadosPedido.cliente?.codigo || '',
          situacao: dadosPedido.situacao || 'NÃO INICIADA',
          observacao: dadosPedido.observacao || '',
        });

        // Preencher itens se existirem
        if (dadosPedido.itens && dadosPedido.itens.length > 0) {
          const itensFormatados = dadosPedido.itens.map((item, index) => ({
            key: `item-${index}-${Date.now()}`,
            codigo: item.codigo || index + 1,
            item: item.item || '',
            descricao: item.descricao || '',
            quantidadeUn: item.quantidadeUn || 0,
            pesoKg: item.pesoKg || 0,
            dataEntrega: item.dataEntrega ? dayjs(item.dataEntrega) : null,
          }));
          setItens(itensFormatados);
        }

        message.success('Dados do pedido carregados do Totvs com sucesso!');
      } else {
        message.error('Pedido não encontrado no Totvs.');
      }
    } catch (error) {
      message.error('Erro ao buscar pedido do Totvs.');
      console.error('Erro:', error);
    } finally {
      setLoadingBuscarPedido(false);
    }
  }, [form]);

  // Função para buscar dados do registro quando em modo de edição
  const fetchRecordData = useCallback(async (recordId) => {
    setLoading(true);
    try {
      const result = await PedidosService.getById(recordId);

      if (result.success && result.data?.data) {
        const fetchedRecord = result.data.data;

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
          codigo: fetchedRecord.codigo || '',
          data: convertToDayjs(fetchedRecord.data),
          situacao: fetchedRecord.situacao || 'NÃO INICIADA',
          pedidoNumero: fetchedRecord.pedidoNumero || '',
          clienteId: fetchedRecord.cliente?.codigo || '',
          observacao: fetchedRecord.observacao || '',
        };

        // Formatar itens
        if (fetchedRecord.itens && fetchedRecord.itens.length > 0) {
          const itensFormatados = fetchedRecord.itens.map((item, index) => ({
            key: `item-${item.id || index}-${Date.now()}`,
            codigo: item.codigo || index + 1,
            item: item.item || '',
            descricao: item.descricao || '',
            quantidadeUn: item.quantidadeUn || 0,
            pesoKg: item.pesoKg || 0,
            dataEntrega: item.dataEntrega ? convertToDayjs(item.dataEntrega) : null,
          }));
          setItens(itensFormatados);
        }

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
      // Gerar código automático para novo pedido
      const novoCodigo = `PED-${Date.now()}`;
      form.setFieldsValue({ codigo: novoCodigo });
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

        const pedidoData = {
          ...values,
          id: editingRecord?.id,
          data: serializeDate(values.data),
          cliente: {
            codigo: values.clienteId || '',
          },
          itens: itensSerializados,
          ativo: true,
        };

        const response = await PedidosService.upsert(pedidoData);
        
        if (response.success) {
          message.success(editingRecord ? 'Pedido atualizado com sucesso!' : 'Pedido criado com sucesso!');
          onSave();
        }
      } catch (error) {
        message.error('Erro ao salvar Pedido.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    },
    [editingRecord, itens, onSave]
  );

  const handleCadastrarOP = useCallback(async () => {
    if (!editingRecord?.id) {
      message.warning('Salve o pedido primeiro antes de cadastrar OPs.');
      return;
    }

    if (!itens || itens.length === 0) {
      message.warning('Adicione itens ao pedido antes de cadastrar OPs.');
      return;
    }

    setLoading(true);
    try {
      const response = await PedidosService.cadastrarOP(editingRecord.id);
      if (response.success) {
        message.success('OPs cadastradas com sucesso!');
        // Opcional: redirecionar para a tela de OPs ou mostrar modal com as OPs criadas
      }
    } catch (error) {
      message.error('Erro ao cadastrar OPs.');
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
                  {editingRecord ? 'Editar Pedido' : 'Novo Pedido'}
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
                  {/* Botão Buscar Pedido do Totvs */}
                 

                  {/* Formulário principal */}
                  <DynamicForm
                    formConfig={formConfig}
                    formInstance={form}
                    onSubmit={handleSave}
                    submitText="Salvar Pedido"
                    submitIcon={<AiOutlineSave />}
                    submitOnSide={false}
                    onClose={onCancel}
                  />

                  {/* Seção de Itens */}
                  <div style={{ marginTop: 24, marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                      Itens do Pedido
                    </h3>
                    <PedidosItensTable
                      value={itens}
                      onChange={setItens}
                    />
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default AddEdit;
