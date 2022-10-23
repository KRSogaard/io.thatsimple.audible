import { useState } from 'react';
import AudibleService from '../../services/AudibleService';
import { Helmet } from 'react-helmet-async';
import { Card, Breadcrumb, Form, Button, Row, Col, Input } from 'antd';
import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import './index.css';

function RegisterPage() {
  let [loading, setLoading] = useState(false);

  if (AudibleService.isAuthenticated()) {
    window.location.href = '/';
  }

  const handleSubmit = async (values: any) => {
    const { email, password, username } = values;
    setLoading(true);
    if (await AudibleService.register(username, password, email)) {
      setLoading(false);
      window.location.href = '/signin';
    }
    setLoading(false);
  };

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
      <Row>
        <Col span={6} offset={9}>
          <Card title="Sign In">
            <Form name="normal_login" className="login-form" initialValues={{ remember: true }} onFinish={handleSubmit}>
              <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
              </Form.Item>
              <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
                <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                <Input prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                  Sign up
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default RegisterPage;
