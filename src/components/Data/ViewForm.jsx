import { Col, Divider, Form, Row } from "antd";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br';
import React, { useCallback, useMemo } from "react";
import { validateCNPJ, validateCPF } from "../../helpers/helper";
import {
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
    EmailInput,
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

dayjs.locale("pt-br");

const ViewForm = React.memo(({ 
    formConfig, 
    layout = "vertical", 
    formInstance = null,
    size = "medium"
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
        switch: SwitchInput,
        'toggle-switch': ToggleSwitch,
        'conditional-switch': ConditionalSwitch,
        'switch-group': BaseSwitchGroupInput,
    }), []);

    // Função para renderizar input baseada no tipo (sempre disabled)
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
            return <TextInput {...questionProps} placeholder={placeholder} size={size} disabled />;
        }

        // Props comuns para todos os componentes - sempre disabled
        const commonProps = {
            ...questionProps,
            placeholder,
            size,
            disabled: true, // Sempre desabilitado em modo visualização
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
                specificProps.label = placeholder;
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
                specificProps.size = question.size || "default";
                break;
            case "toggle-switch":
                specificProps.label = question.label;
                specificProps.description = question.description;
                specificProps.size = question.size || "default";
                specificProps.showIcons = question.showIcons !== false;
                break;
            case "conditional-switch":
                specificProps.label = question.label;
                specificProps.description = question.description;
                specificProps.size = question.size || "default";
                specificProps.conditions = question.conditions || {};
                break;
            case "switch-group":
                specificProps.title = question.title;
                specificProps.description = question.description;
                specificProps.switches = question.switches || [];
                specificProps.columns = question.columns || 1;
                specificProps.layout = question.layout || "vertical";
                specificProps.direction = direction;
                break;
        }

        return <Component {...commonProps} {...specificProps} />;
    }, []);

    // Memoizar renderQuestions para melhor performance
    const renderQuestions = useCallback((questions, columns) => {
        const colSpan = 24 / columns;

        return (
            <Row gutter={[8, 8]}>
                {questions.map((question) => (
                    <Col span={colSpan} key={question.id}>
                        <Form.Item
                            label={question.label}
                            name={question.id}
                            valuePropName={question.type === "checkbox" ? "checked" : undefined}
                            style={{
                                marginBottom: '16px',
                                padding: '8px 12px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                            }}
                        >
                            {renderInput(question)}
                        </Form.Item>
                    </Col>
                ))}
            </Row>
        );
    }, [renderInput]);

    // Memoizar as seções do formulário
    const formSections = useMemo(() => {
        if (!formConfig) return null;

        return formConfig.map((section, index) => (
            <div key={section.id || index} style={{ marginBottom: '24px' }}>
                {section.title && (
                    <h3 style={{ 
                        marginTop: index > 0 ? 25 : 0, 
                        marginBottom: 16,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#262626'
                    }}>
                        {section.title}
                    </h3>
                )}
                {renderQuestions(section.questions, section.columns)}
            </div>
        ));
    }, [formConfig, renderQuestions]);

    return (
        <Form
            form={form}
            layout={layout}
            size={size}
            style={{
                backgroundColor: '#fafafa',
                padding: '24px',
                borderRadius: '8px'
            }}
        >
            {formSections}
        </Form>
    );
});

ViewForm.displayName = 'ViewForm';

export default ViewForm;
