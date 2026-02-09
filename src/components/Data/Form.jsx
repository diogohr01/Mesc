import { Button, Col, Divider, Form, Row } from "antd";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import React, { useCallback, useMemo } from "react";
import { AiOutlineClose, AiOutlineSend } from "react-icons/ai";
import { validateCNPJ, validateCPF } from "../../helpers/helper";
import {
    AsyncSelectInput,
    BaseSwitchGroupInput,
    CepInput,
    CheckboxGroupInput,
    CheckboxInput,
    CnpjInput,
    ConditionalSwitch,
    CpfInput,
    CurrencyInput,
    DateInput,
    DateRangeInput,
    DimensionaisTableInput,
    EmailInput,
    FileDisplayInput,
    FileUploadInput,
    NumberInput,
    PasswordInput,
    PhoneInput,
    RadioInput,
    SelectInput,
    SwitchGroup,
    SwitchInput,
    TextAreaInput,
    TextInput,
    TimeInput,
    ToggleSwitch,
    TreeSelectInput
} from "../inputs";
import PeriodFilter from "./PeriodFilter";

dayjs.locale("pt-br"); // Define o locale do dayjs para português

const DynamicForm = React.memo(({ 
    formConfig, 
    submitText = "Enviar", 
    layout = "vertical", 
    onSubmit, 
    onClose, 
    size = "medium", 
    submitOnSide = false, 
    submitIcon = null, 
    formInstance = null,
    secondaryButton = null, // Botão secundário (ex: Limpar) na mesma linha do submit
    onValidate, // Nova prop para validação customizada
    validateOnChange = false, // Nova prop para validação em tempo real
    showValidationFeedback = true // Nova prop para controlar feedback visual
}) => {
    const [internalForm] = Form.useForm();
    const form = formInstance ?? internalForm;


    // Mapa de componentes para renderização - memoizado para performance
    const componentMap = useMemo(() => ({
        text: TextInput,
        textarea: TextAreaInput,
        password: PasswordInput,
        email: EmailInput,
        integer: NumberInput,
        decimal: NumberInput,
        currency: CurrencyInput,
        date: DateInput,
        datetime: DateInput,
        time: TimeInput,
        'range-date': DateRangeInput,
        select: SelectInput,
        'async-select': AsyncSelectInput,
        multiselect: SelectInput,
        'tree-select': TreeSelectInput,
        phone: PhoneInput,
        cpf: CpfInput,
        cnpj: CnpjInput,
        cep: CepInput,
        checkbox: CheckboxInput,
        'checkbox-group': CheckboxGroupInput,
        radio: RadioInput,
        images: FileUploadInput,
        files: FileUploadInput,
        'file-display': FileDisplayInput,
        'dimensionais-table': DimensionaisTableInput,
        switch: SwitchInput,
        'toggle-switch': ToggleSwitch,
        'conditional-switch': ConditionalSwitch,
        'switch-group': BaseSwitchGroupInput,
        period: PeriodFilter,
    }), []);

    // Função para renderizar input baseada no tipo
    const renderInput = useCallback((question) => {
        const { 
            type, 
            id, 
            placeholder = "", 
            left = "", 
            format, 
            precision = 2, 
            step = 0.01, 
            options = [], 
            treeData = [], 
            questionProps = {},
            // Props adicionais para melhor controle
            disabled = false,
            size = "middle",
            maxLength,
            showSearch = true,
            allowClear = true,
            direction = "horizontal",
            ...otherProps
        } = question;
        
        const Component = componentMap[type];
        if (!Component) {
            console.warn(`Tipo de campo não suportado: ${type}`);
            return <TextInput {...questionProps} placeholder={placeholder} size={size} />;
        }

        // Props comuns para todos os componentes
        const commonProps = {
            ...questionProps,
            placeholder,
            size,
            disabled,
            ...otherProps
        };

        // Props específicas por tipo
        const specificProps = {};
        
        switch (type) {
            case "text":
            case "textarea":
            case "email":
            case "password":
                specificProps.maxLength = maxLength;
                break;
            case "integer":
                specificProps.type = "integer";
                specificProps.maxLength = maxLength;
                break;
            case "decimal":
                specificProps.type = "decimal";
                specificProps.precision = precision;
                specificProps.step = step;
                specificProps.maxLength = maxLength;
                break;
            case "currency":
                specificProps.currency = left;
                specificProps.precision = precision;
                specificProps.step = step;
                specificProps.maxLength = maxLength;
                break;
            case "date":
                specificProps.format = format || "DD/MM/YYYY";
                break;
            case "datetime":
                specificProps.format = format;
                specificProps.showTime = true;
                break;
            case "time":
                specificProps.format = format;
                break;
            case "range-date":
                specificProps.format = format;
                break;
            case "select":
                specificProps.options = options;
                specificProps.multiple = false;
                specificProps.showSearch = showSearch;
                specificProps.allowClear = allowClear;
                break;
            case "async-select":
                specificProps.fetchOptionsOnSearch = question.fetchOptionsOnSearch;
                specificProps.showSearch = true;
                specificProps.allowClear = allowClear;
                break;
            case "multiselect":
                specificProps.options = options;
                specificProps.multiple = true;
                specificProps.showSearch = showSearch;
                specificProps.allowClear = allowClear;
                break;
            case "tree-select":
                specificProps.treeData = treeData;
                specificProps.showSearch = showSearch;
                specificProps.allowClear = allowClear;
                break;
            case "checkbox":
                specificProps.label = question.noLabel ? question.label : (placeholder || '');
                break;
            case "checkbox-group":
                specificProps.options = options;
                specificProps.direction = direction;
                break;
            case "radio":
                specificProps.options = options;
                specificProps.direction = direction;
                break;
            case "images":
                specificProps.inputType = "images";
                break;
            case "files":
                specificProps.inputType = "files";
                break;
            case "switch":
                specificProps.label = question.label;
                specificProps.description = question.description;
                specificProps.disabled = question.disabled;
                specificProps.size = question.size || "default";
                specificProps.checkedChildren = question.checkedChildren;
                specificProps.unCheckedChildren = question.unCheckedChildren;
                break;
            case "toggle-switch":
                specificProps.label = question.label;
                specificProps.description = question.description;
                specificProps.disabled = question.disabled;
                specificProps.size = question.size || "default";
                specificProps.showIcons = question.showIcons !== false;
                specificProps.checkedIcon = question.checkedIcon;
                specificProps.unCheckedIcon = question.unCheckedIcon;
                specificProps.tooltip = question.tooltip;
                specificProps.checkedTooltip = question.checkedTooltip;
                specificProps.unCheckedTooltip = question.unCheckedTooltip;
                break;
            case "conditional-switch":
                specificProps.label = question.label;
                specificProps.description = question.description;
                specificProps.disabled = question.disabled;
                specificProps.size = question.size || "default";
                specificProps.conditions = question.conditions || {};
                specificProps.showConditionalAlert = question.showConditionalAlert !== false;
                break;
            case "switch-group":
                specificProps.title = question.title;
                specificProps.description = question.description;
                specificProps.switches = question.switches || [];
                specificProps.disabled = question.disabled;
                specificProps.columns = question.columns || 1;
                specificProps.layout = question.layout || "vertical";
                specificProps.direction = direction;
                // Adicionar props para integração com Form.Item
                specificProps.value = question.value;
                specificProps.onChange = question.onChange;
                break;
            case "file-display":
                specificProps.variant = question.variant || "attachment";
                specificProps.placeholder = question.placeholder;
                specificProps.accept = question.accept;
                specificProps.boxStyle = question.boxStyle;
                specificProps.areaStyle = question.areaStyle;
                break;
            case "dimensionais-table":
                specificProps.columns = question.columns;
                specificProps.addButtonText = question.addButtonText;
                specificProps.emptyText = question.emptyText;
                break;
        }

        return <Component {...commonProps} {...specificProps} />;
    }, [size]);

    // Função para gerar regras de validação - otimizada com messageVariables
    const getValidationRules = useCallback((question) => {
        const rules = [
            {
                required: question.required,
                message: '${label} é obrigatório!',
            },
            ...(question.rules || [])
        ];

        // Validações condicionais
        if (question.conditionalRules) {
            rules.push(...question.conditionalRules);
        }

        // Validações customizadas
        if (question.customValidator) {
            rules.push({
                validator: question.customValidator
            });
        }

        // Validações específicas por tipo
        switch (question.type) {
            case "phone":
                rules.push({
                    validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        let cleanedValue = value.replace(/\D/g, "");
                        if (cleanedValue.length > 11) cleanedValue = cleanedValue.slice(0, 11);
                        if (cleanedValue.length === 11) return Promise.resolve();
                        return Promise.reject(new Error("Número de telefone incompleto."));
                    },
                });
                break;
            case "email":
                rules.push({
                    type: "email",
                    message: "Por favor, insira um e-mail válido!",
                });
                break;
            case "cpf":
                rules.push({
                    validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (!validateCPF(value)) return Promise.reject(new Error("CPF inválido."));
                        return Promise.resolve();
                    },
                });
                break;
            case "cnpj":
                rules.push({
                    validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (!validateCNPJ(value)) return Promise.reject(new Error("CNPJ inválido."));
                        return Promise.resolve();
                    },
                });
                break;
            case "switch":
            case "toggle-switch":
            case "conditional-switch":
                // Validação específica para switches - verifica se é boolean
                rules.push({
                    validator: (_, value) => {
                        if (question.required && (value === undefined || value === null)) {
                            return Promise.reject(new Error(`${question.label} é obrigatório!`));
                        }
                        if (value !== undefined && value !== null && typeof value !== 'boolean') {
                            return Promise.reject(new Error(`${question.label} deve ser um valor booleano!`));
                        }
                        return Promise.resolve();
                    },
                });
                break;
            case "switch-group":
                // Validação específica para grupos de switches
                rules.push({
                    validator: (_, value) => {
                        if (question.required && (!value || Object.keys(value).length === 0)) {
                            return Promise.reject(new Error(`${question.label} é obrigatório!`));
                        }
                        if (value && typeof value !== 'object') {
                            return Promise.reject(new Error(`${question.label} deve ser um objeto!`));
                        }
                        return Promise.resolve();
                    },
                });
                break;
            default:
                // Para outros tipos, não adiciona validações específicas
                break;
        }

        return rules;
    }, []);

    // Memoizar renderQuestions para melhor performance
    const renderQuestions = useCallback((questions, columns) => {
        const colSpan = 24 / columns;

        return (
            <Row gutter={[8, 8]}>
                {questions.map((question) => (
                    <Col span={colSpan} key={question.id}>
                        <Form.Item
                            label={question.noLabel ? null : question.label}
                            name={question.id}
                            valuePropName={question.type === "checkbox" ? "checked" : undefined}
                            rules={getValidationRules(question)}
                            messageVariables={{ label: question.label }}
                            tooltip={question.tooltip}
                            extra={question.help}
                            hasFeedback={showValidationFeedback && question.type !== "checkbox" && question.type !== "radio" && question.type !== "switch" && question.type !== "toggle-switch" && question.type !== "conditional-switch" && question.type !== "switch-group" && question.type !== "file-display" && question.type !== "dimensionais-table"}
                            // Props adicionais para melhor controle
                            required={question.required}
                            hidden={question.hidden}
                            dependencies={question.dependencies}
                            shouldUpdate={question.shouldUpdate}
                            normalize={question.normalize}
                            getValueFromEvent={question.getValueFromEvent}
                            getValueProps={question.getValueProps}
                        >
                            {renderInput(question)}
                        </Form.Item>
                    </Col>
                ))}
            </Row>
        );
    }, [renderInput, getValidationRules]);

    const handleSubmit = useCallback(() => {
        form
            .validateFields({ 
                validateOnly: false,  // Mostra erros na UI
                dirty: false,        // Valida todos os campos
                recursive: true      // Valida campos aninhados
            })
            .then((values) => {
                if (onSubmit) {
                    onSubmit(values);
                }
            })
            .catch((errorInfo) => {
                console.error("Erro de validação:", errorInfo);
                // Scroll para o primeiro campo com erro
                const firstErrorField = document.querySelector('.ant-form-item-has-error');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
    }, [form, onSubmit]);

    // Função para validação silenciosa (sem mostrar erros na UI)
    const validateFieldsSilently = useCallback(async (fieldNames) => {
        try {
            const values = await form.validateFields({ 
                validateOnly: true,   // Não mostra erros na UI
                dirty: true,         // Só valida campos modificados
                nameList: fieldNames // Campos específicos
            });
            return { isValid: true, values };
        } catch (errorInfo) {
            return { isValid: false, errors: errorInfo.errorFields };
        }
    }, [form]);

    // Memoizar as seções do formulário
    const formSections = useMemo(() => {
        if (!formConfig) return null;

        return formConfig.map((section, index) => {
            if (section.leftQuestions && section.rightQuestions) {
                const rightQuestionsRow = section.rightQuestionsRow || [];
                return (
                    <div key={section.id || index}>
                        {section.title && (
                            <h3 style={{ marginTop: index > 0 ? 25 : 0, marginBottom: 5 }}>{section.title}</h3>
                        )}
                        <Row gutter={24}>
                            <Col span={12}>{renderQuestions(section.leftQuestions, 1)}</Col>
                            <Col span={12}>
                                <div style={section.rightWrapperStyle} className={section.rightWrapperClassName}>
                                    {renderQuestions(section.rightQuestions, 1)}
                                    {rightQuestionsRow.length > 0 && (
                                    <Row gutter={16} align="top" style={{ marginTop: 16 }}>
                                        <Col span={12} style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            {renderQuestions(rightQuestionsRow.slice(0, 1), 1)}
                                        </Col>
                                        <Col span={12} style={{ minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            {renderQuestions(rightQuestionsRow.slice(1, 2), 1)}
                                        </Col>
                                    </Row>
                                )}
                                </div>
                            </Col>
                        </Row>
                    </div>
                );
            }
            return (
                <div key={section.id || index}>
                    {section.title && (
                        <h3 style={{ marginTop: index > 0 ? 25 : 0, marginBottom: 5 }}>{section.title}</h3>
                    )}
                    {renderQuestions(section.questions, section.columns)}
                </div>
            );
        });
    }, [formConfig, renderQuestions]);

    // Memoizar os botões de ação
    const actionButtons = useMemo(() => {
        const buttons = (
            <Row gutter={8} justify="end" align="middle">
                {onClose && (
                    <Col>
                        <Button onClick={onClose} icon={<AiOutlineClose />} size="middle">
                            Fechar
                        </Button>
                    </Col>
                )}
                {secondaryButton && <Col>{secondaryButton}</Col>}
                <Col>
                    <Button type="primary" icon={submitIcon ?? <AiOutlineSend />} onClick={handleSubmit} size="middle">
                        {submitText}
                    </Button>
                </Col>
            </Row>
        );

        if (submitOnSide) {
            return (
                <Row gutter={8} align="center" justify="end">
                    {buttons}
                </Row>
            );
        }

        return (
            <>
                <Divider />
                {buttons}
            </>
        );
    }, [submitOnSide, onClose, submitIcon, submitText, handleSubmit, secondaryButton]);

    return (
        <Form
            form={form}
            layout={layout}
            size={size}
            onValuesChange={validateOnChange ? (changedValues, allValues) => {
                if (onValidate) {
                    onValidate(changedValues, allValues);
                }
            } : undefined}
        >
            {formSections}
            {actionButtons}
        </Form>
    );
});

export default DynamicForm;
