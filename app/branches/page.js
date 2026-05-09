'use client';

import { Alert, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation
} from '@/store/services/adminExtApi';

export default function BranchesPage() {
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
        message.success('Branch updated.');
      } else {
        await createBranch(values).unwrap();
        message.success('Branch created.');
      }
      setModal({ open: false, record: null });
      form.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || 'Unable to save branch.');
    }
  }

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" onClick={() => openModal(record)}>Edit</Button>
    }
  ];

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>Branches</h2>
          <p>Manage branch records and operational scope.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Create Branch</Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message="Unable to load branches from the backend." style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={branches} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={modal.record ? 'Edit Branch' : 'Create Branch'}
        open={modal.open}
        onCancel={() => setModal({ open: false, record: null })}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="code" label="Code" rules={[{ required: !modal.record, message: 'Code is required' }]}>
            <Input disabled={Boolean(modal.record)} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
