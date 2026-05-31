'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  ReloadOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetCobEntriesQuery,
  useCreateCobEntryMutation,
  useSettleCobEntryMutation,
  useUpdateCobEntryMutation,
  useDeleteCobEntryMutation,
  useGetCollectOnBehalfEntriesQuery,
  useCreateCollectOnBehalfEntryMutation,
  useSettleCollectOnBehalfMutation,
  useUpdateCollectOnBehalfEntryMutation,
  useDeleteCollectOnBehalfEntryMutation
} from '@/store/services/cobApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { formatCurrency } from '@/utils/format';

export default function CobPage() {
  const { t } = useLanguage();
  const [cobForm] = Form.useForm();
  const [collectForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [cobModalOpen, setCobModalOpen] = useState(false);
  const [collectModalOpen, setCollectModalOpen] = useState(false);

  // Data queries
  const { data: cobData, isLoading: cobLoading, error: cobError, refetch: refetchCob } = useGetCobEntriesQuery();
  const { data: collectData, isLoading: collectLoading, error: collectError, refetch: refetchCollect } = useGetCollectOnBehalfEntriesQuery();
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();

  const [createCobEntry] = useCreateCobEntryMutation();
  const [settleCobEntry] = useSettleCobEntryMutation();
  const [updateCobEntry] = useUpdateCobEntryMutation();
  const [deleteCobEntry] = useDeleteCobEntryMutation();
  const [createCollectEntry] = useCreateCollectOnBehalfEntryMutation();
  const [settleCollectEntry] = useSettleCollectOnBehalfMutation();
  const [updateCollectEntry] = useUpdateCollectOnBehalfEntryMutation();
  const [deleteCollectEntry] = useDeleteCollectOnBehalfEntryMutation();

  const cobEntries = useMemo(() => cobData?.items || [], [cobData]);
  const collectEntries = useMemo(() => collectData?.items || [], [collectData]);
  const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
  const partners = useMemo(
    () => (partnersData?.items || []).filter((p) => p.isActive),
    [partnersData]
  );

  const jobOptions = useMemo(
    () => jobs.map((j) => ({ value: j.backendId, label: `${j.job_no || j.id} - ${j.customer || ''}` })),
    [jobs]
  );

  const customerOptions = useMemo(
    () =>
      partners
        .filter((p) => ['CUSTOMER', 'BOTH'].includes(p.partnerType))
        .map((p) => ({ value: p.backendId, label: `${p.code} - ${p.name}` })),
    [partners]
  );

  const vendorOptions = useMemo(
    () =>
      partners
        .filter((p) => ['VENDOR', 'BOTH'].includes(p.partnerType))
        .map((p) => ({ value: p.backendId, label: `${p.code} - ${p.name}` })),
    [partners]
  );

  function getPartnerName(id) {
    return partners.find((p) => p.backendId === id)?.name || '-';
  }

  function getJobNo(id) {
    return jobs.find((j) => j.backendId === id)?.job_no || '-';
  }

  // ─── Charge-on-behalf ────────────────────────────────────────────────────────

  async function submitCob(values) {
    setSaving(true);
    try {
      await createCobEntry({ ...values, amount: Number(values.amount), paymentMethod: values.paymentMethod || undefined }).unwrap();
      message.success(t('cob.createCobSuccess'));
      setCobModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || t('cob.createCobError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSettleCob(record) {
    try {
      await settleCobEntry({ id: record.backendId }).unwrap();
      message.success(t('cob.settleSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('cob.settleError'));
    }
  }

  // ─── Collect-on-behalf ───────────────────────────────────────────────────────

  async function submitCollect(values) {
    setSaving(true);
    try {
      await createCollectEntry({ ...values, amount: Number(values.amount), paymentMethod: values.paymentMethod || undefined }).unwrap();
      message.success(t('cob.createCollectSuccess'));
      setCollectModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || t('cob.createCollectError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSettleCollect(record) {
    try {
      await settleCollectEntry({ id: record.backendId }).unwrap();
      message.success(t('cob.settleSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('cob.settleError'));
    }
  }

  // ─── Table columns ──────────────────────────────────────────────────────────

  const cobColumns = [
    { title: 'ID', dataIndex: 'backendId', key: 'id', width: 60 },
    {
      title: t('cob.vendor'),
      key: 'vendor',
      width: 180,
      render: (_, r) => getPartnerName(r.vendorId || r.raw?.vendorId)
    },
    {
      title: t('cob.customer'),
      key: 'customer',
      width: 180,
      render: (_, r) => getPartnerName(r.raw?.partnerId || r.raw?.customerId)
    },
    {
      title: t('cob.job'),
      key: 'job',
      width: 140,
      render: (_, r) => getJobNo(r.jobId || r.raw?.jobId)
    },
    {
      title: t('cob.receivableEntry'),
      key: 'receivableEntryId',
      width: 150,
      render: (_, r) => {
        const receivableEntryId = r.raw?.receivableEntryId;
        return receivableEntryId ? <Tag color="blue">#{receivableEntryId}</Tag> : '-';
      }
    },
    {
      title: t('cob.amount'),
      key: 'amount',
      align: 'right',
      width: 140,
      render: (_, r) => <strong>{formatCurrency(r.amount)} {r.currency}</strong>
    },
    {
      title: t('cob.paymentMethod'),
      key: 'paymentMethod',
      width: 140,
      render: (_, r) => {
        const method = r.paymentMethod || r.raw?.paymentMethod;
        if (!method) return '-';
        return <Tag color={method === 'CASH' ? 'gold' : 'cyan'}>{method === 'CASH' ? t('cob.paymentMethodCash') : t('cob.paymentMethodBank')}</Tag>;
      }
    },
    {
      title: t('cob.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v) => <Tag color={v?.toUpperCase() === 'SETTLED' ? 'green' : 'orange'}>{v}</Tag>
    },
    {
      title: t('cob.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const isOpen = record.status?.toUpperCase() !== 'SETTLED';
        return isOpen ? (
          <Space size={4}>
            <Popconfirm title={t('cob.settleConfirm')} onConfirm={() => handleSettleCob(record)}>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} title={t('cob.settle')} />
            </Popconfirm>
            <Popconfirm title={t('cob.deleteConfirm')} onConfirm={async () => {
              try {
                await deleteCobEntry(record.backendId).unwrap();
                message.success(t('cob.deleteSuccess'));
              } catch (err) {
                message.error(err?.data?.message || t('cob.deleteError'));
              }
            }}>
              <Button size="small" danger icon={<DeleteOutlined />} title={t('cob.delete')} />
            </Popconfirm>
          </Space>
        ) : null;
      }
    }
  ];

  const collectColumns = [
    { title: 'ID', dataIndex: 'backendId', key: 'id', width: 60 },
    {
      title: t('cob.customer'),
      key: 'customer',
      width: 180,
      render: (_, r) => getPartnerName(r.raw?.partnerId || r.raw?.customerId)
    },
    {
      title: t('cob.vendor'),
      key: 'vendor',
      width: 180,
      render: (_, r) => getPartnerName(r.vendorId || r.raw?.vendorId)
    },
    {
      title: t('cob.job'),
      key: 'job',
      width: 140,
      render: (_, r) => getJobNo(r.jobId || r.raw?.jobId)
    },
    {
      title: t('cob.relatedCobEntry'),
      key: 'relatedCobEntryId',
      width: 150,
      render: (_, r) => {
        const relatedCobEntryId = r.raw?.relatedCobEntryId;
        return relatedCobEntryId ? <Tag color="purple">#{relatedCobEntryId}</Tag> : '-';
      }
    },
    {
      title: t('cob.amount'),
      key: 'amount',
      align: 'right',
      width: 140,
      render: (_, r) => <strong>{formatCurrency(r.amount)} {r.currency}</strong>
    },
    {
      title: t('cob.paymentMethod'),
      key: 'paymentMethod',
      width: 140,
      render: (_, r) => {
        const method = r.paymentMethod || r.raw?.paymentMethod;
        if (!method) return '-';
        return <Tag color={method === 'CASH' ? 'gold' : 'cyan'}>{method === 'CASH' ? t('cob.paymentMethodCash') : t('cob.paymentMethodBank')}</Tag>;
      }
    },
    {
      title: t('cob.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v) => <Tag color={v?.toUpperCase() === 'SETTLED' ? 'green' : 'orange'}>{v}</Tag>
    },
    {
      title: t('cob.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const isOpen = record.status?.toUpperCase() !== 'SETTLED';
        return isOpen ? (
          <Space size={4}>
            <Popconfirm title={t('cob.settleConfirm')} onConfirm={() => handleSettleCollect(record)}>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} title={t('cob.settle')} />
            </Popconfirm>
            <Popconfirm title={t('cob.deleteConfirm')} onConfirm={async () => {
              try {
                await deleteCollectEntry(record.backendId).unwrap();
                message.success(t('cob.deleteSuccess'));
              } catch (err) {
                message.error(err?.data?.message || t('cob.deleteError'));
              }
            }}>
              <Button size="small" danger icon={<DeleteOutlined />} title={t('cob.delete')} />
            </Popconfirm>
          </Space>
        ) : null;
      }
    }
  ];

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const cobTotal = cobEntries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const cobPending = cobEntries.filter((e) => e.status?.toUpperCase() !== 'SETTLED').length;
  const collectTotal = collectEntries.reduce((s, e) => s + Number(e.amount || 0), 0);
  const collectPending = collectEntries.filter((e) => e.status?.toUpperCase() !== 'SETTLED').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('cob.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">{t('cob.subtitle')}</Typography.Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { refetchCob(); refetchCollect(); }}>
          {t('common.resetFilters')}
        </Button>
      </div>

      {(cobError || collectError) && (
        <Alert type="error" showIcon message={t('cob.loadError')} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('cob.totalCob')} value={cobTotal} formatter={(v) => formatCurrency(v)} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('cob.cobPending')} value={cobPending} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('cob.totalCollect')} value={collectTotal} formatter={(v) => formatCurrency(v)} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('cob.collectPending')} value={collectPending} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Tabs
          items={[
            {
              key: 'cob',
              label: (
                <span>
                  <SwapOutlined /> {t('cob.chargeOnBehalf')} ({cobEntries.length})
                </span>
              ),
              children: (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <Button type="primary" icon={<FileAddOutlined />} onClick={() => { cobForm.resetFields(); cobForm.setFieldsValue({ currency: 'VND' }); setCobModalOpen(true); }}>
                      {t('cob.createCob')}
                    </Button>
                  </div>
                  <Table
                    rowKey="backendId"
                    loading={cobLoading}
                    columns={cobColumns}
                    dataSource={cobEntries}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                </>
              )
            },
            {
              key: 'collect',
              label: (
                <span>
                  <SwapOutlined /> {t('cob.collectOnBehalf')} ({collectEntries.length})
                </span>
              ),
              children: (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <Button type="primary" icon={<FileAddOutlined />} onClick={() => { collectForm.resetFields(); collectForm.setFieldsValue({ currency: 'VND' }); setCollectModalOpen(true); }}>
                      {t('cob.createCollect')}
                    </Button>
                  </div>
                  <Table
                    rowKey="backendId"
                    loading={collectLoading}
                    columns={collectColumns}
                    dataSource={collectEntries}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      {/* COB Create Modal */}
      <Modal
        title={t('cob.createCobTitle')}
        open={cobModalOpen}
        onCancel={() => setCobModalOpen(false)}
        onOk={() => cobForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form form={cobForm} layout="vertical" onFinish={submitCob}>
          <Alert
            type="info"
            showIcon
            message={t('cob.autoReceivableNotice')}
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="vendorId" label={t('cob.vendor')} rules={[{ required: true, message: t('cob.vendorRequired') }]}>
            <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder={t('cob.selectVendor')} />
          </Form.Item>
          <Form.Item name="partnerId" label={t('cob.chargeToCustomer')} rules={[{ required: true, message: t('cob.customerRequired') }]}>
            <Select showSearch optionFilterProp="label" options={customerOptions} placeholder={t('cob.selectCustomer')} />
          </Form.Item>
          <Form.Item name="jobId" label={t('cob.job')} rules={[{ required: true, message: t('cob.jobRequired') }]}>
            <Select showSearch allowClear optionFilterProp="label" options={jobOptions} placeholder={t('cob.selectJob')} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('cob.amount')} rules={[{ required: true, message: t('cob.amountRequired') }]}>
                <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label={t('cob.currency')} rules={[{ required: true }]}>
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('cob.description')}>
            <Input.TextArea rows={2} placeholder={t('cob.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t('cob.paymentMethod')}>
            <Select
              allowClear
              placeholder={t('cob.selectPaymentMethod')}
              options={[
                { value: 'CASH', label: t('cob.paymentMethodCash') },
                { value: 'BANK', label: t('cob.paymentMethodBank') }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Collect-on-behalf Create Modal */}
      <Modal
        title={t('cob.createCollectTitle')}
        open={collectModalOpen}
        onCancel={() => setCollectModalOpen(false)}
        onOk={() => collectForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form form={collectForm} layout="vertical" onFinish={submitCollect}>
          <Form.Item name="partnerId" label={t('cob.customer')} rules={[{ required: true, message: t('cob.customerRequired') }]}>
            <Select showSearch optionFilterProp="label" options={customerOptions} placeholder={t('cob.selectCustomer')} />
          </Form.Item>
          <Form.Item name="vendorId" label={t('cob.payToVendor')} rules={[{ required: true, message: t('cob.vendorRequired') }]}>
            <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder={t('cob.selectVendor')} />
          </Form.Item>
          <Form.Item name="jobId" label={t('cob.jobOptional')}>
            <Select showSearch allowClear optionFilterProp="label" options={jobOptions} placeholder={t('cob.selectJob')} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('cob.amount')} rules={[{ required: true, message: t('cob.amountRequired') }]}>
                <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label={t('cob.currency')} rules={[{ required: true }]}>
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={t('cob.description')}>
            <Input.TextArea rows={2} placeholder={t('cob.descriptionPlaceholder')} />
          </Form.Item>
          <Form.Item name="paymentMethod" label={t('cob.paymentMethod')}>
            <Select
              allowClear
              placeholder={t('cob.selectPaymentMethod')}
              options={[
                { value: 'CASH', label: t('cob.paymentMethodCash') },
                { value: 'BANK', label: t('cob.paymentMethodBank') }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
