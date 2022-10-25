import { useState } from 'react';
import AudibleService from '../../services/AudibleService';
import { Helmet } from 'react-helmet-async';
import { Card, Breadcrumb, Typography, Form, Button, Row, Col, Input, Checkbox, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import './index.css';

function LoginPage() {
  let [loading, setLoading] = useState(false);
  let [error, setError] = useState<string>('');

  if (AudibleService.isAuthenticated()) {
    window.location.href = '/';
  }

  const onFinish = async (values: any) => {
    const { email, password, remember } = values;
    setError('');
    setLoading(true);
    if (await AudibleService.login(email, password, remember)) {
      setLoading(false);
      window.location.href = '/';
    } else {
      setError('Invalid Email or Password');
    }

    setLoading(false);
  };

  const { Link } = Typography;

  return (
    <div style={{ margin: '0 50px' }}>
      <Helmet>
        <title>Sign In</title>
        <meta name="description" content="Sign In" />
      </Helmet>
      <Breadcrumb style={{ margin: '16px 0' }}>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item>Sign In</Breadcrumb.Item>
      </Breadcrumb>
      <Row justify="center">
        <Col xl={8} lg={12} md={16} sm={24}>
          <Card title="Sign In">
            <Form name="normal_login" className="login-form" initialValues={{ remember: true }} onFinish={onFinish}>
              {error && (
                <Form.Item>
                  <Alert message={error} type="error" showIcon />
                </Form.Item>
              )}
              <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
                <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                  Log in
                </Button>
                Or <Link href="/signup">register now!</Link>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default LoginPage;
