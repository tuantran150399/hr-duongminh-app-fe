'use client';

import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { login } from '@/services/authService';
import { setToken } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  async function handleSubmit(values) {
    try {
      const token = await login(values.username, values.password);
      setToken(token);
      message.success('Logged in successfully');
      router.replace('/dashboard');
    } catch {
      message.error('Login failed. Please check your credentials.');
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card">
        <Typography.Title level={2} className="brand-title">
          ERP Logistics
        </Typography.Title>
        <Typography.Paragraph className="muted-text">
          Sign in to manage jobs, partners, and accounting.
        </Typography.Paragraph>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input placeholder="admin" autoComplete="username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="admin123" autoComplete="current-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form>
      </Card>
    </main>
  );
}
