'use client';

import { Alert, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { createBranch, getBranches, updateBranch } from '@/services/adminService';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function loadBranches() {
    setLoading(true);
    setError('');
    try {
      setBranches(await getBranches());
    } catch {
      setError('Unable to load branches from the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBranches();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function openModal(record = null) {
    setModal({ open: true, record });
    form.setFieldsValue(record ? { ...record.raw } : { isActive: true });
  }

  async function submit(values) {
    setSaving(true);
    try {
      if (modal.record) {
        const { code, ...payload } = values;
        await updateBranch(modal.record.backendId, payload);
        message.success('Branch updated.');
      } else {
        await createBranch(values);
        message.success('Branch created.');
      }
      setModal({ open: false, record: null });
      form.resetFields();
      await loadBranches();
    } catch (saveError) {
      message.error(saveError.response?.data?.message || 'Unable to save branch.');
    } finally {
      setSaving(false);
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
          <Button icon={<ReloadOutlined />} onClick={loadBranches}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Create Branch</Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <Table rowKey="id" loading={loading} columns={columns} dataSource={branches} pagination={{ pageSize: 10 }} />
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
