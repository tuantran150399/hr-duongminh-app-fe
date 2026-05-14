'use client';

import { Alert, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation
} from '@/store/services/adminExtApi';

export default function BranchesPage() {
  const { t } = useLanguage();
  const [modal, setModal] = useState({ open: false, record: null });
  const [form] = Form.useForm();

  const { data: branches = [], isLoading, error, refetch } = useGetBranchesQuery();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const saving = isCreating || isUpdating;

  function openModal(record = null) {
    setModal({ open: true, record });
    form.setFieldsValue(record ? { ...record.raw } : { isActive: true });
  }

  async function submit(values) {
    try {
      if (modal.record) {
        const { code, ...payload } = values;
        await updateBranch({ id: modal.record.backendId, ...payload }).unwrap();
        message.success(t('branches.updateSuccess'));
      } else {
        await createBranch(values).unwrap();
        message.success(t('branches.createSuccess'));
      }
      setModal({ open: false, record: null });
      form.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || t('branches.saveError'));
    }
  }

  const columns = [
    { title: t('branches.code'), dataIndex: 'code', key: 'code' },
    { title: t('branches.name'), dataIndex: 'name', key: 'name' },
    { title: t('branches.address'), dataIndex: 'address', key: 'address' },
    {
      title: t('branches.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? t('branches.active') : t('branches.inactive')}</Tag>
    },
    {
      title: t('branches.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" onClick={() => openModal(record)}>{t('branches.edit')}</Button>
    }
  ];

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>{t('branches.title')}</h2>
          <p>{t('branches.subtitle')}</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('branches.refresh')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>{t('branches.createBranch')}</Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={t('branches.loadError')} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={branches} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={modal.record ? t('branches.editBranch') : t('branches.createBranch')}
        open={modal.open}
        onCancel={() => setModal({ open: false, record: null })}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="code" label={t('branches.code')} rules={[{ required: !modal.record, message: t('branches.codeRequired') }]}>
            <Input disabled={Boolean(modal.record)} />
          </Form.Item>
          <Form.Item name="name" label={t('branches.name')} rules={[{ required: true, message: t('branches.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label={t('branches.address')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label={t('branches.activeLabel')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
