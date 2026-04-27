'use client';

import { Button, Form, Input, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
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
      message.success('Đăng nhập thành công');
      router.replace('/dashboard');
    } catch {
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <Typography.Title level={1} className="login-brand-title">
          HR LOGISTIC
        </Typography.Title>
        <div className="login-brand-subtitle">
          MAKE IT EASY
        </div>

        <Form
          form={form}
          className="login-form"
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123' }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc email' }]}
            style={{ marginBottom: 16 }}
          >
            <Input 
              size="large"
              prefix={<MailOutlined style={{ color: '#727786', marginRight: 8 }} />} 
              placeholder="Tên đăng nhập hoặc Email" 
              autoComplete="username" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password 
              size="large"
              prefix={<LockOutlined style={{ color: '#727786', marginRight: 8 }} />} 
              placeholder="Mật khẩu" 
              autoComplete="current-password" 
            />
          </Form.Item>

          <div className="login-forgot">
            <a href="#">Quên mật khẩu?</a>
          </div>

          <Button type="primary" htmlType="submit" className="login-btn" block>
            ĐĂNG NHẬP
          </Button>
        </Form>

        <div className="login-footer">
          <p>Phiên bản 1.0.2</p>
          <div className="login-lang">
            <GlobalOutlined />
            <span>Tiếng Việt</span>
          </div>
        </div>
      </div>
    </main>
  );
}
