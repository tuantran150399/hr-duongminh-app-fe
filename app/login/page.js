'use client';

import { GlobalOutlined, LockOutlined, MailOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Typography, App } from 'antd';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/AppProviders';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getFirstAuthorizedPath } from '@/config/routes';
import {
  loginThunk,
  selectLoginLoading,
  selectLoginError,
  clearLoginError,
  deriveUserPermissions
} from '@/store/slices/authSlice';
import { useEffect, useState } from 'react';
import duongminhLogo from '@/asset/image/duongminh.svg';

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { language, t } = useLanguage();
  const { message } = App.useApp();

  const loginLoading = useAppSelector(selectLoginLoading);
  const loginError = useAppSelector(selectLoginError);
  const [errorMsg, setErrorMsg] = useState('');

  // Show error popup when login fails
  useEffect(() => {
    if (loginError) {
      const detail =
        typeof loginError === 'string'
          ? loginError
          : loginError?.message || loginError?.data?.message || t('login.loginError');

      Modal.error({
        title: t('login.loginErrorTitle'),
        content: detail,
        centered: true,
        okText: t('login.tryAgain'),
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        onOk: () => {
          // Focus the password field so the user can retry quickly
          const pwInput = document.querySelector('input[type="password"]');
          if (pwInput) pwInput.focus();
        }
      });

      dispatch(clearLoginError());
    }
  }, [loginError, dispatch, t]);

  async function handleSubmit(values) {
    setErrorMsg('');
    const result = await dispatch(
      loginThunk({ username: values.username, password: values.password })
    );

    if (loginThunk.fulfilled.match(result)) {
      message.success(t('login.loginSuccess'));
      router.replace(getFirstAuthorizedPath(deriveUserPermissions(result.payload.user)));
    } else {
      const detail =
        typeof result.payload === 'string'
          ? result.payload
          : result.payload?.message || result.payload?.data?.message || t('login.loginError');
      setErrorMsg(detail);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <img
          src={duongminhLogo.src || duongminhLogo}
          alt="Dương Minh Logistics"
          style={{ height: 52, width: 'auto', marginBottom: 24 }}
        />

        {/* Persistent inline error banner */}
        {errorMsg && (
          <Alert
            type="error"
            showIcon
            closable
            message={errorMsg}
            onClose={() => setErrorMsg('')}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Form
          form={form}
          className="login-form"
          layout="vertical"
          initialValues={{ username: 'api.tester', password: 'ApiTest@123' }}
          onFinish={handleSubmit}
          onChange={() => setErrorMsg('')}
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

          <Button
            type="primary"
            htmlType="submit"
            className="login-btn"
            block
            loading={loginLoading}
          >
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

