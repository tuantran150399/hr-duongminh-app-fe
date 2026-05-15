'use client';

import {
  Alert, Badge, Button, Card, Col, DatePicker, Form,
  Input, InputNumber, Modal, Popconfirm, Row, Select,
  Space, Statistic, Table, Tag, Tooltip, Typography, message
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReconciliationOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useApproveAdjustmentMutation,
  useDeleteAdjustmentMutation
} from '@/store/services/adjustmentsApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { formatCurrency } from '@/utils/format';

const ADJUSTMENT_TYPES = [
  'REVENUE_ADJUSTMENT',
  'COST_ADJUSTMENT',
  'RECONCILIATION',
  'WRITE_OFF'
];

const TYPE_COLOR = {
  REVENUE_ADJUSTMENT: 'green',
  COST_ADJUSTMENT:    'orange',
  RECONCILIATION:     'blue',
  WRITE_OFF:          'red'
};

function TypeLabel({ t, value }) {
  const map = {
    REVENUE_ADJUSTMENT: t('adjustments.revenueAdj'),
    COST_ADJUSTMENT:    t('adjustments.costAdj'),
    RECONCILIATION:     t('adjustments.reconciliation'),
    WRITE_OFF:          t('adjustments.writeOff')
  };
  return (
    <Tag color={TYPE_COLOR[value] ?? 'default'}>
      {map[value] ?? value}
    </Tag>
  );
}

export default function AdjustmentsPage() {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen]   = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [saving, setSaving]         = useState(false);

  const { data, isLoading, error }   = useGetAdjustmentsQuery({ limit: 100 });
  const { data: jobsData }           = useGetJobsQuery();
  const [createAdjustment]           = useCreateAdjustmentMutation();
  const [approveAdjustment]          = useApproveAdjustmentMutation();
  const [deleteAdjustment]           = useDeleteAdjustmentMutation();

  const adjustments = data?.items ?? [];
  const jobs        = jobsData?.items ?? [];

  const jobOptions = useMemo(
    () => jobs.map((j) => ({ value: j.backendId, label: `${j.job_no ?? j.jobCode} — ${j.customer ?? ''}` })),
    [jobs]
  );

  const filtered = useMemo(
    () => typeFilter === 'all' ? adjustments : adjustments.filter((a) => a.type === typeFilter),
    [adjustments, typeFilter]
  );

  const pendingCount  = adjustments.filter((a) => !a.approvedAt).length;
  const totalRevAdj   = adjustments
    .filter((a) => a.type === 'REVENUE_ADJUSTMENT')
    .reduce((s, a) => s + Number(a.amount ?? 0), 0);
  const totalCostAdj  = adjustments
    .filter((a) => a.type === 'COST_ADJUSTMENT')
    .reduce((s, a) => s + Number(a.amount ?? 0), 0);

  async function handleCreate(values) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        docDate: values.docDate?.format?.('YYYY-MM-DD') ?? values.docDate ?? undefined
      };
      await createAdjustment(payload).unwrap();
      message.success(t('adjustments.createSuccess'));
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error(t('adjustments.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id) {
    try {
      await approveAdjustment(id).unwrap();
      message.success(t('adjustments.approveSuccess'));
    } catch {
      message.error(t('adjustments.approveError'));
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAdjustment(id).unwrap();
      message.success(t('adjustments.deleteSuccess'));
    } catch {
      message.error(t('adjustments.deleteError'));
    }
  }

  const columns = [
    {
      title: t('adjustments.id'),
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (v) => <span style={{ color: '#888', fontSize: 12 }}>#{v}</span>
    },
    {
      title: t('adjustments.type'),
      dataIndex: 'type',
      key: 'type',
      width: 170,
      render: (v) => <TypeLabel t={t} value={v} />
    },
    {
      title: t('adjustments.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: t('adjustments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 160,
      render: (v, r) => (
        <span style={{ fontWeight: 700, color: Number(v) < 0 ? '#ff4d4f' : '#52c41a' }}>
          {Number(v) > 0 ? '+' : ''}{formatCurrency(v)}
        </span>
      )
    },
    {
      title: t('adjustments.currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 80
    },
    {
      title: t('adjustments.status'),
      key: 'status',
      width: 130,
      render: (_, r) => r.approvedAt
        ? <Tag icon={<CheckCircleOutlined />} color="green">{t('adjustments.approved')}</Tag>
        : <Badge status="processing" text={t('adjustments.pending')} />
    },
    {
      title: t('adjustments.docDate'),
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: t('adjustments.approvedAt'),
      key: 'approvedAt',
      width: 150,
      render: (_, r) => r.approvedAt
        ? new Date(r.approvedAt).toLocaleString()
        : '—'
    },
    {
      title: t('adjustments.actions'),
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          {!record.approvedAt && (
            <Popconfirm title={t('adjustments.approveConfirm')} onConfirm={() => handleApprove(record.backendId)}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} title={t('adjustments.approve')} />
            </Popconfirm>
          )}
          {!record.approvedAt && (
            <Popconfirm title={t('adjustments.deleteConfirm')} onConfirm={() => handleDelete(record.backendId)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
          {record.approvedAt && <Tag color="green">✓</Tag>}
        </Space>
      )
    }
  ];

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">
            <ReconciliationOutlined style={{ marginRight: 10, color: '#0057c2' }} />
            {t('adjustments.title')}
          </Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('adjustments.subtitle')}
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { form.resetFields(); setModalOpen(true); }}
        >
          {t('adjustments.createAdjustment')}
        </Button>
      </div>

      {error && (
        <Alert type="error" showIcon message={t('adjustments.loadError')} style={{ marginBottom: 16 }} />
      )}

      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('adjustments.totalAdjustments')}
              value={adjustments.length}
              prefix={<ReconciliationOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('adjustments.pendingApproval')}
              value={pendingCount}
              valueStyle={{ color: pendingCount > 0 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('adjustments.totalRevenueAdj')}
              value={totalRevAdj}
              formatter={formatCurrency}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('adjustments.totalCostAdj')}
              value={totalCostAdj}
              formatter={formatCurrency}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card className="table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Typography.Text strong>
            {filtered.length} {t('adjustments.totalAdjustments').toLowerCase()}
          </Typography.Text>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
            options={[
              { value: 'all', label: t('adjustments.allTypes') },
              ...ADJUSTMENT_TYPES.map((v) => ({
                value: v,
                label: <TypeLabel t={t} value={v} />
              }))
            ]}
          />
        </div>

        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 1100 }}
          rowClassName={(r) => r.approvedAt ? '' : 'ant-table-row-highlight'}
        />
      </Card>

      {/* ── Create modal ────────────────────────────────────────────────────── */}
      <Modal
        title={
          <Space><ReconciliationOutlined /> {t('adjustments.createTitle')}</Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="jobId"
                label={t('adjustments.jobLabel')}
                rules={[{ required: true, message: t('adjustments.jobRequired') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={jobOptions}
                  placeholder={t('adjustments.jobLabel')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label={t('adjustments.typeLabel')}
                rules={[{ required: true, message: t('adjustments.typeRequired') }]}
              >
                <Select
                  options={ADJUSTMENT_TYPES.map((v) => ({
                    value: v,
                    label: <TypeLabel t={t} value={v} />
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={t('adjustments.descriptionLabel')}
            rules={[{ required: true, message: t('adjustments.descriptionRequired') }]}
          >
            <Input.TextArea
              rows={2}
              placeholder={t('adjustments.descriptionPlaceholder')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="amount"
                label={
                  <Tooltip title={t('adjustments.amountNote')}>
                    {t('adjustments.amountLabel')} ⓘ
                  </Tooltip>
                }
                rules={[{ required: true, message: t('adjustments.amountRequired') }]}
              >
                <InputNumber style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="currency" label={t('adjustments.currencyLabel')} initialValue="VND">
                <Select
                  options={[
                    { value: 'VND', label: 'VND' },
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="docDate" label={t('adjustments.docDate')}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="originalEntryType" label={t('adjustments.originalEntryType')}>
                <Select
                  allowClear
                  options={[
                    { value: 'REVENUE', label: 'Revenue' },
                    { value: 'COST',    label: 'Cost'    }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="originalEntryId" label={t('adjustments.originalEntryId')}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label={t('adjustments.notesLabel')}>
            <Input.TextArea rows={2} placeholder={t('adjustments.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
