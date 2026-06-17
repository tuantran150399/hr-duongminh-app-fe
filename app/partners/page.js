'use client';

import {
  Alert, Button, Card, Form, Input, Modal,
  Popconfirm, Select, Space, Table, Tag, App
} from 'antd';
import { EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetPartnersQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useLockPartnerMutation
} from '@/store/services/partnersApi';
import { getApiError } from '@/utils/getApiError';
import { formatCurrency } from '@/utils/format';

function cleanPayload(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export default function PartnersPage() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  // RTK Query hooks
  const { data, isLoading, error, refetch } = useGetPartnersQuery();
  const [createPartner, { isLoading: isCreating }] = useCreatePartnerMutation();
  const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation();
  const [lockPartner] = useLockPartnerMutation();

  const partners = data?.items || [];
  const saving = isCreating || isUpdating;

  const partnerTypeOptions = [
    { value: 'CUSTOMER', label: t('partners.customer') },
    { value: 'VENDOR', label: t('partners.vendor') },
    { value: 'AGENT', label: t('partners.agent') },
    { value: 'CARRIER', label: t('partners.carrier') },
    { value: 'BOTH', label: t('partners.customerVendor') }
  ];

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return partners.filter((item) => {
      const matchesSearch = !keyword || [
        item.code, item.name, item.taxCode, item.phone, item.email, item.type
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
      const matchesType = typeFilter === 'all' || item.partnerType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [partners, search, typeFilter]);

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
    const payload = cleanPayload(values);
    try {
      if (editingPartner) {
        delete payload.code;
        await updatePartner({ id: editingPartner.backendId, ...payload }).unwrap();
        message.success(t('partners.updateSuccess'));
      } else {
        await createPartner(payload).unwrap();
        message.success(t('partners.createSuccess'));
      }
      setModalOpen(false);
    } catch (err) {
      message.error(getApiError(err, t, 'partners.saveError'));
    }
  }

  async function handleLock(record) {
    try {
      await lockPartner(record.backendId).unwrap();
      message.success(t('partners.lockSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'partners.lockError'));
    }
  }

  const columns = [
    { title: t('partners.code'), dataIndex: 'code', key: 'code', width: 130 },
    { title: t('partners.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('partners.type'),
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => <Tag color={type === 'Customer' ? 'blue' : 'orange'}>{type}</Tag>
    },
    { title: t('partners.taxCode'), dataIndex: 'taxCode', key: 'taxCode', width: 150 },
    {
      title: 'Công nợ thực tế',
      dataIndex: 'actualDebt',
      key: 'actualDebt',
      width: 170,
      align: 'right',
      render: (value) => formatCurrency(value || 0)
    },
    { title: t('partners.contact'), dataIndex: 'contactPerson', key: 'contactPerson', width: 180 },
    { title: t('partners.phone'), dataIndex: 'phone', key: 'phone', width: 140 },
    { title: t('partners.email'), dataIndex: 'email', key: 'email', width: 210 },
    {
      title: t('partners.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? t('partners.active') : t('partners.inactive')}</Tag>
    },
    {
      title: t('partners.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title={t('partners.lockPartner')}
            description={t('partners.lockDescription')}
            okText={t('partners.lock')}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleLock(record)}
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
          <h1 className="page-title">{t('partners.title')}</h1>
          <p className="page-subtitle">{t('partners.subtitle')}</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('partners.refresh')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('partners.addPartner')}
          </Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={t('partners.loadError')} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder={t('partners.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 200 }}
              options={[
                { value: 'all', label: t('partners.allTypes') },
                ...partnerTypeOptions
              ]}
            />
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1320 }}
        />
      </Card>

      <Modal
        title={editingPartner ? t('partners.editPartner') : t('partners.createPartner')}
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
              label={t('partners.partnerCode')}
              rules={[{ required: true, message: t('partners.partnerCodeRequired') }]}
            >
              <Input disabled={Boolean(editingPartner)} placeholder="CUS001" />
            </Form.Item>
            <Form.Item
              name="partnerType"
              label={t('partners.partnerType')}
              rules={[{ required: true, message: t('partners.partnerTypeRequired') }]}
            >
              <Select options={partnerTypeOptions} />
            </Form.Item>
          </div>
          <Form.Item name="name" label={t('partners.partnerName')} rules={[{ required: true, message: t('partners.partnerNameRequired') }]}>
            <Input placeholder="Company name" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <Form.Item name="taxCode" label={t('partners.taxCode')}>
              <Input placeholder="Tax code" />
            </Form.Item>
            <Form.Item name="contactPerson" label={t('partners.contactPerson')}>
              <Input placeholder="Primary contact" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={t('partners.phone')}
              rules={[{ pattern: /^[0-9+\-\s().]{7,20}$/, message: t('partners.phoneValidation') }]}
            >
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item name="email" label={t('partners.email')} rules={[{ type: 'email', message: t('partners.emailValidation') }]}>
              <Input placeholder="name@company.com" />
            </Form.Item>
          </div>
          <Form.Item name="address" label={t('partners.address')}>
            <Input.TextArea rows={3} placeholder="Business address" />
          </Form.Item>
          {editingPartner ? (
            <Form.Item name="isActive" label={t('partners.status')}>
              <Select
                options={[
                  { value: true, label: t('partners.active') },
                  { value: false, label: t('partners.inactive') }
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
