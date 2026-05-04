'use client';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import { EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  createPartner,
  deactivatePartner,
  getPartners,
  updatePartner
} from '@/services/partnerService';

const partnerTypeOptions = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'CARRIER', label: 'Carrier' },
  { value: 'BOTH', label: 'Customer/Vendor' }
];

function cleanPayload(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export default function PartnersPage() {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  async function loadPartners() {
    setLoading(true);
    setError('');

    try {
      setData(await getPartners());
    } catch {
      setError('Unable to load partners from the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPartners();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) =>
      [item.code, item.name, item.taxCode, item.phone, item.email, item.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [data, search]);

  function openCreateModal() {
    setEditingPartner(null);
    form.resetFields();
    form.setFieldsValue({ partnerType: 'CUSTOMER', isActive: true });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingPartner(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      partnerType: record.partnerType,
      taxCode: record.taxCode === '-' ? undefined : record.taxCode,
      contactPerson: record.contactPerson === '-' ? undefined : record.contactPerson,
      phone: record.phone === '-' ? undefined : record.phone,
      email: record.email === '-' ? undefined : record.email,
      address: record.address === '-' ? undefined : record.address,
      isActive: record.isActive
    });
    setModalOpen(true);
  }

  async function submitPartner(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(values);

      if (editingPartner) {
        delete payload.code;
        await updatePartner(editingPartner.backendId, payload);
        message.success('Partner updated.');
      } else {
        await createPartner(payload);
        message.success('Partner created.');
      }

      setModalOpen(false);
      await loadPartners();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to save partner.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(record) {
    try {
      await deactivatePartner(record.backendId);
      message.success('Partner deactivated.');
      await loadPartners();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to deactivate partner.');
    }
  }

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 130 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => <Tag color={type === 'Customer' ? 'blue' : 'orange'}>{type}</Tag>
    },
    { title: 'Tax Code / MST', dataIndex: 'taxCode', key: 'taxCode', width: 150 },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson', width: 180 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 210 },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Deactivate partner?"
            description="The partner will remain in history but cannot be used as active data."
            okText="Deactivate"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeactivate(record)}
          >
            <Button danger icon={<StopOutlined />} disabled={!record.isActive} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">Customers, vendors, agents, and carriers used across jobs and accounting.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Partner
        </Button>
      </div>

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <Input.Search
            allowClear
            placeholder="Search code, name, tax code, phone, email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ maxWidth: 420 }}
          />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1150 }}
        />
      </Card>

      <Modal
        title={editingPartner ? 'Edit Partner' : 'Create Partner'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={submitPartner}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <Form.Item
              name="code"
              label="Partner Code"
              rules={[{ required: true, message: 'Partner code is required.' }]}
            >
              <Input disabled={Boolean(editingPartner)} placeholder="CUS001" />
            </Form.Item>
            <Form.Item
              name="partnerType"
              label="Partner Type"
              rules={[{ required: true, message: 'Partner type is required.' }]}
            >
              <Select options={partnerTypeOptions} />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Partner name is required.' }]}>
            <Input placeholder="Company name" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <Form.Item name="taxCode" label="Tax Code / MST">
              <Input placeholder="Tax code" />
            </Form.Item>
            <Form.Item name="contactPerson" label="Contact Person">
              <Input placeholder="Primary contact" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ pattern: /^[0-9+\-\s().]{7,20}$/, message: 'Enter a valid phone number.' }]}
            >
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter a valid email.' }]}>
              <Input placeholder="name@company.com" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} placeholder="Business address" />
          </Form.Item>
          {editingPartner ? (
            <Form.Item name="isActive" label="Status">
              <Select
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' }
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
