import { Button, Col, Form, Layout, Row, message } from 'antd';
import { Card } from '../../../components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import dayjs from 'dayjs';
import { DynamicForm } from '../../../components';
import { Loading } from '../../../components';
import Api from '../../../services/api';

const { Content } = Layout;

const AddEdit = ({ editingRecord, onCancel, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [formConfig] = useState([
    {
      title: "Textos",
      columns: 1,
      questions: [
        { type: "text", id: "text", required: true, placeholder: "Digite um texto", label: "Texto" },
        { type: "textarea", id: "textArea", required: true, placeholder: "Digite um texto longo", label: "Texto Longo" },
      ],
    },
    {
      title: "Números",
      columns: 2,
      questions: [
        { type: "integer", id: "integer", required: true, placeholder: "Digite um número inteiro", label: "Número Inteiro" },
        { type: "decimal", id: "decimal", required: true, placeholder: "Digite um número decimal", label: "Número Decimal", precision: 2 },
      ],
    },
    {
      title: "Datas e Horários",
      columns: 2,
      questions: [
        { type: "date", id: "date", required: true, placeholder: "Selecione a data", label: "Data", format: "DD/MM/YYYY" },
        { type: "time", id: "time", required: true, placeholder: "Selecione o horário", label: "Horário", format: "HH:mm" },
      ],
    },
    {
      title: "Seleções",
      columns: 2,
      questions: [
        {
          type: "select", id: "select", required: true, placeholder: "Selecione uma opção", label: "Seleção Única",
          options: [
            { label: "Opção 1", value: "opcao1" },
            { label: "Opção 2", value: "opcao2" },
            { label: "Opção 3", value: "opcao3" }
          ]
        },
        {
          type: "multiselect", id: "multiSelect", required: true, placeholder: "Selecione múltiplas opções", label: "Seleção Múltipla",
          options: [
            { label: "Opção 1", value: "opcao1" },
            { label: "Opção 2", value: "opcao2" },
            { label: "Opção 3", value: "opcao3" }
          ]
        },
        { type: "files", id: "files", required: true, label: "Upload de Arquivos" },
      ],
    },
  ]);

  // Função para buscar dados do registro quando em modo de edição
  const fetchRecordData = useCallback(async (recordId) => {
    setLoading(true);
    try {
      const result = await Api.get(`/crud/getById/${recordId}`);

      // Verificar a estrutura real da resposta
      let fetchedRecord;
      if (result.data && result.data.data) {
        // Estrutura: { success: true, data: { ... }, message: "Success" }
        fetchedRecord = result.data.data;
      } else if (result.data) {
        // Estrutura: { ... } (dados diretos)
        fetchedRecord = result.data;
      } else {
        throw new Error('Estrutura de resposta inesperada');
      }

      // Função para verificar se a data é válida (não é 0001-01-01)
      const isValidDate = (dateString) => {
        if (!dateString) return false;
        try {
          const date = new Date(dateString);
          return date.getFullYear() > 1 && !isNaN(date.getTime()); // Verifica se não é 0001 e se é uma data válida
        } catch (error) {
          return false;
        }
      };

      // Função para converter data para dayjs
      const convertToDayjs = (dateString) => {
        if (!isValidDate(dateString)) {
          return null;
        }
        try {
          const dayjsDate = dayjs(dateString);
          if (!dayjsDate.isValid()) {
            return null;
          }
          return dayjsDate;
        } catch (error) {
          return null;
        }
      };

      // Mapear os campos do backend para o frontend
      const deserializedRecord = {
        text: fetchedRecord.text || '',
        textArea: fetchedRecord.textArea || '',
        integer: fetchedRecord.integer !== undefined ? fetchedRecord.integer : 0,
        decimal: fetchedRecord.decimal !== undefined ? fetchedRecord.decimal : 0,
        date: convertToDayjs(fetchedRecord.date),
        time: convertToDayjs(fetchedRecord.time),
        select: fetchedRecord.select || '',
        multiSelect: (() => {
          try {
            return fetchedRecord.multiSelect ? JSON.parse(fetchedRecord.multiSelect) : [];
          } catch (error) {
            return [];
          }
        })(),
        files: (() => {
          try {
            return fetchedRecord.files ? JSON.parse(fetchedRecord.files) : [];
          } catch (error) {
            return [];
          }
        })(),
      };

      // Aguardar o componente ser renderizado antes de definir os valores
      setTimeout(() => {
        try {
          // Limpar o formulário primeiro
          form.resetFields();

          // Definir os valores
          form.setFieldsValue(deserializedRecord);

          // Forçar re-render do formulário
          form.validateFields().catch(() => {
            // Ignorar erros de validação silenciosamente
          });
        } catch (error) {
          // Erro silencioso ao definir valores no formulário
        }
      }, 200); // Aumentei para 200ms para garantir que o form seja renderizado

    } catch (error) {
      message.error('Erro ao buscar o registro.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Buscar dados quando o componente for montado em modo de edição
  useEffect(() => {
    if (editingRecord?.id) {
      fetchRecordData(editingRecord.id);
    } else {
      // Modo de adição - limpar formulário
      form.resetFields();
    }
  }, [editingRecord, fetchRecordData, form]);

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);
      try {
        // Função para converter dayjs para string no formato esperado pelo backend
        const serializeDate = (dateValue) => {
          if (!dateValue) return null;
          if (typeof dateValue === 'string') return dateValue;
          if (dayjs.isDayjs(dateValue)) {
            // Converter para formato ISO que o backend consegue processar
            return dateValue.toISOString();
          }
          return null;
        };

        const serializedValues = {
          ...values,
          // Converter datas de dayjs para string ISO
          date: serializeDate(values.date),
          time: serializeDate(values.time),
          // Manter outros campos como estavam
          files: JSON.stringify(values.files || []),
          multiSelect: JSON.stringify(values.multiSelect || []),
        };


        await Api.post('/crud/upsert', { ...serializedValues, id: editingRecord?.id });
        message.success(editingRecord ? 'Registro atualizado com sucesso!' : 'Registro adicionado com sucesso!');
        onSave();
      } catch (error) {
        message.error('Erro ao salvar registro.');
      } finally {
        setLoading(false);
      }
    },
    [editingRecord, onSave]
  );

  return (
    <Layout>
      <Content>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card
              variant="borderless"
              title={editingRecord ? 'Editar Registro' : 'Adicionar Registro'}
              extra={<Button type="primary" icon={<AiOutlineArrowLeft />} onClick={onCancel} disabled={loading} size="middle">Voltar para a Lista</Button>}
            >
              {loading ? <Loading /> : (
                <div style={{ padding: '16px 0' }}>
                  <p style={{ margin: '16px 0', color: '#8c8c8c', fontSize: '14px' }}>
                    Modo: {editingRecord ? 'Editando registro ID: ' + editingRecord.id : 'Novo registro'}
                  </p>
                  <DynamicForm formConfig={formConfig} formInstance={form} onSubmit={handleSave} onClose={onCancel} />
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
