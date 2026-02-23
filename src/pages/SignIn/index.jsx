import { Col, Form, Row, Typography } from 'antd';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { DynamicForm } from '../../components';
import { colors } from '../../styles/colors';
import { useAuth } from '../../hooks/auth';
import { Loading } from '../../components';
import { Card } from '../../components';
import { AppstoreOutlined } from '@ant-design/icons';

const { Text } = Typography;

const SignIn = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Handler para tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      form.submit();
    }
  };

  useEffect(() => {
    // Adicionar listener para tecla Enter
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [loading]);

  const submitForm = async (values) => {
    setLoading(true);
    try {
      var result = await signIn({
        username: values.username,
        password: values.password
      });

      // Verificar se o login foi bem-sucedido (API retorna data.response ou data.data)
      const responseData = result?.data?.response || result?.data?.data;
      if (result && result.data && responseData && responseData.accessToken) {
        navigate("/");
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row
      gutter={[8, 8]}
      style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}
    >
      <Col span={6} style={{ textAlign: 'center' }}>
       {/*  <img src={logo} alt="Logo" style={{ height: 25, marginBottom: 20 }} />*/}
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
      <AppstoreOutlined style={{ backgroundColor: colors.primaryLight, borderRadius: 8, padding: 8, fontSize: 30, color: colors.white }} />

       <Text style={{ color: '#fff', fontSize: '32px', marginLeft: '0px' , fontWeight: 600   }}>MESC</Text>
       </div>
        <Card  variant="borderless"  extra={ <div></div>} >
          {loading ?
            <Loading /> :
            <>
            <DynamicForm
              formConfig={[
                {
                  columns: 1,
                  questions: [
                    { type: "text", id: "username", required: true, placeholder: "E-mail/usuário", label: "Digite seu login aqui" },
                    { type: "password", id: "password", required: true, placeholder: "Senha", label: "Digite aqui sua senha" },
                  ],
                }
              ]}
              formInstance={form}
              onSubmit={submitForm}
              submitText='Login'
            />
            </>
          }
        </Card>
      
      </Col>
    </Row>
  );
};

export default SignIn;
