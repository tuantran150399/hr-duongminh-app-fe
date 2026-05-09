'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  EditOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import { useGetDebtPoliciesQuery, useUpsertDebtPolicyMutation } from '@/store/services/debtPoliciesApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { formatCurrency } from '@/utils/format';

export default function DebtPoliciesPage() {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: policiesData, isLoading: loading, error: loadErrorObj } = useGetDebtPoliciesQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const [upsertDebtPolicy] = useUpsertDebtPolicyMutation();

  const policies = policiesData?.items || [];
  const partners = (partnersData?.items || []).filter((partner) => partner.isActive);
  const loadError = loadErrorObj ? t('debtPolicies.loadError') : '';

  const partnerOptions = useMemo(
    () => partners.map((partner) => ({ value: partner.backendId, label: `${partner.code} - ${partner.name}` })),
    [partners]
  );

  function openUpsertModal(record = null) {
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        partnerId: record.partnerId,
        maxDebtAmount: record.maxDebtAmount,
        maxDebtAgeDays: record.maxDebtAgeDays,
        isActive: record.isActive
      });
    } else {
      form.setFieldsValue({ isActive: true });
    }
    setModalOpen(true);
  }

  async function submitEntry(values) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        maxDebtAmount: values.maxDebtAmount !== undefined ? Number(values.maxDebtAmount) : null
      };
      await upsertDebtPolicy(payload).unwrap();
      message.success(t('debtPolicies.saveSuccess'));
      setModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || t('debtPolicies.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      title: t('debtPolicies.partner'),
      key: 'partner',
      width: 250,
      render: (_, record) => {
        const partner = partners.find((item) => item.backendId === record.partnerId);
        return <strong>{partner ? partner.name : `Partner ID: ${record.partnerId}`}</strong>;
      }
    },
    {
      title: t('debtPolicies.maxDebtAmount'),
      dataIndex: 'maxDebtAmount',
      key: 'maxDebtAmount',
      align: 'right',
      width: 150,
      render: (value) => value ? formatCurrency(value) : t('debtPolicies.notAvailable')
    },
    {
      title: t('debtPolicies.maxDebtAgeDays'),
      dataIndex: 'maxDebtAgeDays',
      key: 'maxDebtAgeDays',
      align: 'right',
      width: 160,
      render: (value) => value ? t('debtPolicies.daysSuffix', { count: value }) : t('debtPolicies.notAvailable')
    },
    {
      title: t('debtPolicies.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('debtPolicies.active') : t('debtPolicies.inactive')}
        </Tag>
      )
    },
    {
      title: t('debtPolicies.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openUpsertModal(record)}
        />
      )
    }
  ];

  const activeCount = policies.filter((policy) => policy.isActive).length;
  const maxDebtTotal = policies
    .filter((policy) => policy.maxDebtAmount)
    .reduce((sum, policy) => sum + Number(policy.maxDebtAmount || 0), 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('debtPolicies.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('debtPolicies.subtitle')}
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<FileAddOutlined />} onClick={() => openUpsertModal()}>
          {t('debtPolicies.addPolicy')}
        </Button>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('debtPolicies.totalPolicies')} value={policies.length} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('debtPolicies.activePolicies')} value={activeCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title={t('debtPolicies.totalDebtLimit')} value={maxDebtTotal} formatter={(value) => formatCurrency(value)} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={policies}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={t('debtPolicies.modalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={submitEntry}>
          <Form.Item
            name="partnerId"
            label={t('debtPolicies.partner')}
            rules={[{ required: true, message: t('debtPolicies.partnerRequired') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={partnerOptions}
              placeholder={t('debtPolicies.selectPartner')}
              disabled={Boolean(form.getFieldValue('partnerId')) && modalOpen}
            />
          </Form.Item>

          <Form.Item name="maxDebtAmount" label={t('debtPolicies.maxDebtAmountOptional')}>
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder={t('debtPolicies.amountPlaceholder')}
            />
          </Form.Item>

          <Form.Item name="maxDebtAgeDays" label={t('debtPolicies.maxDebtAgeDaysOptional')}>
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder={t('debtPolicies.daysPlaceholder')}
            />
          </Form.Item>

          <Form.Item name="isActive" label={t('debtPolicies.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
