'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
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
  App
} from 'antd';
import {
  EditOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import { useGetDebtPoliciesQuery, useUpsertDebtPolicyMutation } from '@/store/services/debtPoliciesApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import { decimalInputProps, integerInputProps, toDatePickerValue } from '@/utils/formUtils';

export default function DebtPoliciesPage() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [search, setSearch] = useState('');

  const { data: policiesData, isLoading: loading, error: loadErrorObj } = useGetDebtPoliciesQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const [upsertDebtPolicy] = useUpsertDebtPolicyMutation();

  const policies = useMemo(() => policiesData?.items || [], [policiesData]);
  const allPartners = useMemo(() => partnersData?.items || [], [partnersData]);
  const partners = useMemo(() => allPartners.filter((partner) => partner.isActive), [allPartners]);
  const loadError = loadErrorObj ? t('debtPolicies.loadError') : '';

  const partnersById = useMemo(
    () => allPartners.reduce((map, partner) => {
      map[partner.backendId] = partner;
      return map;
    }, {}),
    [allPartners]
  );

  const filteredPolicies = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return policies;

    return policies.filter((policy) => {
      const partner = partnersById[policy.partnerId];
      const searchable = [
        partner?.name,
        partner?.code,
        policy.maxDebtAmount,
        policy.maxDebtAgeDays
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [policies, search, partnersById]);

  const partnerOptions = useMemo(
    () => {
      const customerPartners = partners.filter((partner) => ['CUSTOMER', 'BOTH'].includes(partner.partnerType));
      const options = customerPartners.map((partner) => ({
        value: partner.backendId,
        label: `${partner.code} - ${partner.name}`
      }));

      if (editingPolicy?.partnerId && !options.some((option) => option.value === editingPolicy.partnerId)) {
        const selectedPartner = partnersById[editingPolicy.partnerId];
        if (selectedPartner) {
          options.unshift({
            value: selectedPartner.backendId,
            label: `${selectedPartner.code} - ${selectedPartner.name}`
          });
        }
      }

      return options;
    },
    [partners, partnersById, editingPolicy]
  );

  function openUpsertModal(record = null) {
    form.resetFields();
    setEditingPolicy(record);
    if (record) {
      form.setFieldsValue({
        partnerId: record.partnerId,
        startDate: toDatePickerValue(record.startDate),
        endDate: toDatePickerValue(record.endDate),
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
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        maxDebtAmount: values.maxDebtAmount !== undefined ? Number(values.maxDebtAmount) : null
      };
      const res = await upsertDebtPolicy(payload).unwrap();
      if (res && (res.error || (res.statusCode && res.statusCode >= 400))) {
        message.error(getApiError({ data: res }, t, 'debtPolicies.saveError'));
        return;
      }
      message.success(t('debtPolicies.saveSuccess'));
      setModalOpen(false);
      setEditingPolicy(null);
    } catch (err) {
      message.error(getApiError(err, t, 'debtPolicies.saveError'));
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
        const partner = partnersById[record.partnerId];
        return <strong>{partner
          ? `${partner.code} - ${partner.name}`
          : t('debtPolicies.partnerIdFallback', { id: record.partnerId ?? '-' })}</strong>;
      }
    },
    {
      title: t('debtPolicies.effectivePeriod'),
      key: 'effectiveRange',
      width: 220,
      render: (_, record) => (
        <span>
          {record.startDate || '-'} - {record.endDate || t('debtPolicies.noEndDate')}
        </span>
      )
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

      <FilterCard
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        showDateRange={false}
      />

      <Card className="table-card" style={{ marginTop: 16 }}>
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={filteredPolicies}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={t('debtPolicies.modalTitle')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingPolicy(null);
        }}
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
              disabled={Boolean(editingPolicy)}
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label={t('debtPolicies.startDate')}
            rules={[{ required: true, message: t('debtPolicies.startDateRequired') }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="endDate" label={t('debtPolicies.endDate')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="maxDebtAmount" label={t('debtPolicies.maxDebtAmountOptional')}>
            <InputNumber
              {...decimalInputProps}
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder={t('debtPolicies.amountPlaceholder')}
            />
          </Form.Item>

          <Form.Item name="maxDebtAgeDays" label={t('debtPolicies.maxDebtAgeDaysOptional')}>
            <InputNumber
              {...integerInputProps}
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
