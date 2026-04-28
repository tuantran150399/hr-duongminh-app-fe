'use client';

import { GlobalOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/AppProviders';
import { login } from '@/services/authService';
import { setToken } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { language, t } = useLanguage();

  async function handleSubmit(values) {
    try {
      const token = await login(values.username, values.password);
      setToken(token);
      message.success(t('login.loginSuccess'));
      router.replace('/dashboard');
    } catch {
      message.error(t('login.loginError'));
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <Typography.Title level={1} className="login-brand-title">
          HR LOGISTIC
        </Typography.Title>
        <div className="login-brand-subtitle">MAKE IT EASY</div>

        <Form
          form={form}
          className="login-form"
          layout="vertical"
          initialValues={{ username: 'admin', password: 'Admin@123' }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
            style={{ marginBottom: 16 }}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: '#727786', marginRight: 8 }} />}
              placeholder={t('login.usernamePlaceholder')}
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: '#727786', marginRight: 8 }} />}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </Form.Item>

          <div className="login-forgot">
            <a href="#">{t('login.forgotPassword')}</a>
          </div>

          <Button type="primary" htmlType="submit" className="login-btn" block>
            {t('login.signIn')}
          </Button>
        </Form>

        <div className="login-footer">
          <p>{t('login.version')}</p>
          <div className="login-lang">
            <GlobalOutlined />
            <span>{language === 'vi' ? t('header.vietnamese') : t('header.english')}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
