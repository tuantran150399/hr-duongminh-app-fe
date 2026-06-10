'use client';

import { useState } from 'react';
import {
  Modal, Tabs, Form, Input, Button, message, Divider, Avatar, Typography, Space
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, IdcardOutlined
} from '@ant-design/icons';
import { useLanguage } from '@/components/AppProviders';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, updateUser } from '@/store/slices/authSlice';
import { useChangePasswordMutation, useUpdateProfileMutation } from '@/store/services/authApi';

export default function AccountSettingsModal({ open, onClose }) {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();

  async function handleProfileSubmit(values) {
    try {
      const result = await updateProfile({
        fullName: values.fullName,
        email: values.email
      }).unwrap();
      dispatch(updateUser({ fullName: result.fullName, email: result.email }));
      message.success(t('account.profileUpdated'));
    } catch (error) {
      message.error(error?.data?.message || t('account.profileError'));
    }
  }

  async function handlePasswordSubmit(values) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      }).unwrap();
      message.success(t('account.passwordChanged'));
      passwordForm.resetFields();
    } catch (error) {
      message.error(error?.data?.message || t('account.passwordError'));
    }
  }

  function handleOpen() {
    profileForm.setFieldsValue({
      fullName: user?.fullName || '',
      email: user?.email || ''
    });
    passwordForm.resetFields();
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span><UserOutlined style={{ marginRight: 6 }} />{t('account.profileTab')}</span>
      ),
      children: (
        <div className="account-tab-content">
          <div className="account-profile-header">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src={user?.avatarUrl || null}
              className="account-profile-avatar"
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : undefined}
            </Avatar>
            <div className="account-profile-info">
              <Typography.Title level={5} style={{ margin: 0 }}>
                {user?.fullName || user?.username || '—'}
              </Typography.Title>
              <Typography.Text type="secondary">@{user?.username}</Typography.Text>
              <div className="account-profile-roles">
                {(user?.roles || []).map((role) => {
                  const name = role.name || role;
                  return (
                    <span key={name} className="account-role-tag">{name}</span>
                  );
                })}
              </div>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSubmit}
            initialValues={{ fullName: user?.fullName || '', email: user?.email || '' }}
          >
            <Form.Item
              name="fullName"
              label={t('account.fullName')}
              rules={[{ required: true, message: t('account.fullNameRequired') }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder={t('account.fullName')} />
            </Form.Item>
            <Form.Item
              name="email"
              label={t('account.email')}
              rules={[
                { required: true, message: t('account.emailRequired') },
                { type: 'email', message: t('account.emailInvalid') }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder={t('account.email')} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={updatingProfile}
                block
                className="account-save-btn"
              >
                {t('account.saveProfile')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: 'password',
      label: (
        <span><LockOutlined style={{ marginRight: 6 }} />{t('account.passwordTab')}</span>
      ),
      children: (
        <div className="account-tab-content">
          <div className="account-password-notice">
            <LockOutlined className="account-password-icon" />
            <div>
              <Typography.Text strong>{t('account.passwordNoticeTitle')}</Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {t('account.passwordNoticeDesc')}
              </Typography.Text>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              name="currentPassword"
              label={t('account.currentPassword')}
              rules={[{ required: true, message: t('account.currentPasswordRequired') }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('account.currentPassword')} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label={t('account.newPassword')}
              rules={[
                { required: true, message: t('account.newPasswordRequired') },
                { min: 6, message: t('account.passwordMin') }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('account.newPassword')} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t('account.confirmPassword')}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('account.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('account.passwordMismatch')));
                  }
                })
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('account.confirmPassword')} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={changingPassword}
                block
                className="account-save-btn"
              >
                {t('account.changePasswordBtn')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>{t('account.settingsTitle')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => { if (visible) handleOpen(); }}
      footer={null}
      destroyOnHidden
      width={520}
      className="account-settings-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="account-settings-tabs"
      />
    </Modal>
  );
}
