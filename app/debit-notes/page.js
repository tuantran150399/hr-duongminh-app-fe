'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
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
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FileAddOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetDebitNotesQuery,
  useCreateDebitNoteMutation,
  usePostDebitNoteMutation,
  useVoidDebitNoteMutation,
  useSendDebitNoteMutation
} from '@/store/services/debitNotesApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetServicePricesQuery } from '@/store/services/pricingApi';
import { formatCurrency } from '@/utils/format';

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

// ─── Auto-Pricing Line Items Component ────────────────────────────────────────

function LineItemsEditor({ lineItems, setLineItems, allPrices, selectedPartnerId, selectedJobId, jobs, t }) {
  // Find applicable tariffs based on selected customer + job route
  const suggestedPrices = useMemo(() => {
    if (!allPrices?.length) return [];

    const selectedJob = jobs.find((j) => j.backendId === selectedJobId);

    return allPrices.filter((price) => {
      if (price.isActive === false) return false;

      // Match by partner: customer-specific or general tariff
      const partnerMatch = !price.partnerId || price.partnerId === selectedPartnerId;
      if (!partnerMatch) return false;

      // If a job is selected, try to match route
      if (selectedJob) {
        const origin = (selectedJob.origin || selectedJob.raw?.pol || '').toLowerCase();
        const dest = (selectedJob.destination || selectedJob.raw?.pod || '').toLowerCase();
        const routeFrom = (price.routeFrom || '').toLowerCase();
        const routeTo = (price.routeTo || '').toLowerCase();

        if (routeFrom && origin && !origin.includes(routeFrom) && !routeFrom.includes(origin)) return false;
        if (routeTo && dest && !dest.includes(routeTo) && !routeTo.includes(dest)) return false;
      }

      return true;
    });
  }, [allPrices, selectedPartnerId, selectedJobId, jobs]);

  function applyPricing() {
    if (!suggestedPrices.length) {
      message.info(t('debitNotes.noPricingFound'));
      return;
    }

    const newLines = suggestedPrices.map((price, index) => ({
      key: `auto-${Date.now()}-${index}`,
      serviceType: price.serviceType || '',
      description: [
        price.serviceType,
        price.shipmentMode,
        [price.routeFrom, price.routeTo].filter(Boolean).join(' → '),
        price.unit ? `(${price.unit})` : '',
        price.notes
      ].filter(Boolean).join(' — '),
      quantity: 1,
      unitPrice: Number(price.amount || 0),
      amount: Number(price.amount || 0),
      currency: price.currency || 'VND',
      pricingId: price.id,
      isAutoFilled: true
    }));

    setLineItems(newLines);
    message.success(t('debitNotes.pricingApplied', { count: newLines.length }));
  }

  function addEmptyLine() {
    setLineItems([
      ...lineItems,
      {
        key: `manual-${Date.now()}`,
        serviceType: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        currency: 'VND',
        pricingId: null,
        isAutoFilled: false
      }
    ]);
  }

  function updateLine(key, field, value) {
    setLineItems(
      lineItems.map((line) => {
        if (line.key !== key) return line;
        const updated = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
        }
        return updated;
      })
    );
  }

  function removeLine(key) {
    setLineItems(lineItems.filter((line) => line.key !== key));
  }

  const totalAmount = lineItems.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const lineColumns = [
    {
      title: t('debitNotes.serviceType'),
      dataIndex: 'serviceType',
      width: 130,
      render: (value, record) => (
        <Input
          value={value}
          size="small"
          placeholder="CUSTOMS"
          onChange={(e) => updateLine(record.key, 'serviceType', e.target.value)}
        />
      )
    },
    {
      title: t('debitNotes.lineDescription'),
      dataIndex: 'description',
      render: (value, record) => (
        <Space size={4} style={{ width: '100%' }}>
          <Input
            value={value}
            size="small"
            placeholder={t('debitNotes.descriptionPlaceholder')}
            onChange={(e) => updateLine(record.key, 'description', e.target.value)}
            style={{ flex: 1 }}
          />
          {record.isAutoFilled && (
            <Tooltip title={t('debitNotes.autoFilledFromPricing')}>
              <ThunderboltOutlined style={{ color: '#faad14', fontSize: 14 }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: t('debitNotes.qty'),
      dataIndex: 'quantity',
      width: 80,
      render: (value, record) => (
        <InputNumber
          value={value}
          size="small"
          min={1}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'quantity', v)}
        />
      )
    },
    {
      title: t('debitNotes.unitPrice'),
      dataIndex: 'unitPrice',
      width: 140,
      render: (value, record) => (
        <InputNumber
          value={value}
          size="small"
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateLine(record.key, 'unitPrice', v)}
        />
      )
    },
    {
      title: t('debitNotes.lineAmount'),
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value) => <strong>{formatCurrency(value)}</strong>
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
        />
      )
    }
  ];

  return (
    <>
      <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
        {t('debitNotes.lineItems')}
      </Divider>

      {selectedPartnerId && (
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('debitNotes.pricingHint')} ({suggestedPrices.length} {t('debitNotes.tariffAvailable')})
          </Typography.Text>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={applyPricing}
            disabled={!suggestedPrices.length}
            style={{ backgroundColor: suggestedPrices.length ? '#fffbe6' : undefined }}
          >
            {t('debitNotes.autoApplyPricing')}
          </Button>
        </div>
      )}

      <Table
        dataSource={lineItems}
        columns={lineColumns}
        rowKey="key"
        size="small"
        pagination={false}
        footer={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addEmptyLine}>
              {t('debitNotes.addLine')}
            </Button>
            <Typography.Text strong style={{ fontSize: 14 }}>
              {t('debitNotes.total')}: {formatCurrency(totalAmount)}
            </Typography.Text>
          </div>
        )}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DebitNotesPage() {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [voidForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const statusColor = {
    DRAFT: 'default',
    POSTED: 'blue',
    SENT: 'green',
    VOIDED: 'red'
  };

  const { data: notesData, isLoading: loading, error: loadErrorObj, refetch } = useGetDebitNotesQuery();
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const { data: pricingData } = useGetServicePricesQuery();
  const [createDebitNote] = useCreateDebitNoteMutation();
  const [postDebitNote] = usePostDebitNoteMutation();
  const [voidDebitNote] = useVoidDebitNoteMutation();
  const [sendDebitNote] = useSendDebitNoteMutation();

  const notes = notesData?.items || [];
  const jobs = jobsData?.items || [];
  const partners = (partnersData?.items || []).filter((p) => p.isActive);
  const allPrices = pricingData?.items || [];
  const loadError = loadErrorObj ? t('debitNotes.loadError') : '';

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ value: job.backendId, label: `${job.job_no} - ${job.customer}` })),
    [jobs]
  );

  const customerOptions = useMemo(
    () =>
      partners
        .filter((p) => ['CUSTOMER', 'BOTH'].includes(p.partnerType))
        .map((p) => ({ value: p.backendId, label: `${p.code} - ${p.name}` })),
    [partners]
  );

  // Auto-fill customer when a job is selected
  const handleJobChange = useCallback(
    (jobId) => {
      setSelectedJobId(jobId);
      if (!jobId) return;
      const job = jobs.find((j) => j.backendId === jobId);
      if (job?.raw?.partnerId) {
        form.setFieldsValue({ partnerId: job.raw.partnerId });
        setSelectedPartnerId(job.raw.partnerId);
      }
    },
    [jobs, form]
  );

  function openCreateModal() {
    form.resetFields();
    form.setFieldsValue({ currency: 'VND' });
    setLineItems([]);
    setSelectedPartnerId(null);
    setSelectedJobId(null);
    setModalOpen(true);
  }

  async function submitEntry(values) {
    if (!lineItems.length) {
      message.warning(t('debitNotes.noLineItems'));
      return;
    }

    setSaving(true);
    try {
      const totalAmount = lineItems.reduce((sum, line) => sum + Number(line.amount || 0), 0);

      const payload = {
        partnerId: values.partnerId,
        jobId: values.jobId || undefined,
        currency: values.currency,
        docDate: toDateString(values.docDate),
        dueDate: toDateString(values.dueDate),
        description: values.description || '',
        amount: totalAmount,
        lineItems: lineItems.map((line) => ({
          serviceType: line.serviceType,
          description: line.description,
          quantity: Number(line.quantity || 1),
          unitPrice: Number(line.unitPrice || 0),
          amount: Number(line.amount || 0),
          currency: line.currency,
          pricingId: line.pricingId || undefined
        }))
      };

      await createDebitNote(payload).unwrap();
      message.success(t('debitNotes.createSuccess'));
      setModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || t('debitNotes.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(record) {
    try {
      await postDebitNote(record.backendId).unwrap();
      message.success(t('debitNotes.postSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('debitNotes.postError'));
    }
  }

  async function handleSend(record) {
    try {
      await sendDebitNote(record.backendId).unwrap();
      message.success(t('debitNotes.sendSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('debitNotes.sendError'));
    }
  }

  function openVoidModal(record) {
    setSelectedRecord(record);
    voidForm.resetFields();
    setVoidModalOpen(true);
  }

  async function handleVoid(values) {
    setSaving(true);
    try {
      await voidDebitNote({ id: selectedRecord.backendId, reason: values.reason }).unwrap();
      message.success(t('debitNotes.voidSuccess'));
      setVoidModalOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      message.error(err?.data?.message || t('debitNotes.voidError'));
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      title: t('debitNotes.noteNo'),
      dataIndex: 'backendId',
      key: 'backendId',
      width: 80,
      render: (value) => <strong>DN-{value}</strong>
    },
    {
      title: t('debitNotes.customer'),
      key: 'customer',
      width: 200,
      render: (_, record) => {
        const customer = partners.find((p) => p.backendId === record.raw?.partnerId);
        return customer?.name || '-';
      }
    },
    {
      title: t('debitNotes.jobNo'),
      key: 'job_no',
      width: 140,
      render: (_, record) => {
        const job = jobs.find((j) => j.backendId === record.jobId);
        return job?.job_no || record.job_no || '-';
      }
    },
    {
      title: t('debitNotes.amount'),
      key: 'amount',
      align: 'right',
      width: 150,
      render: (_, record) => <strong>{formatCurrency(record.amount)} {record.currency}</strong>
    },
    {
      title: t('debitNotes.docDate'),
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: t('debitNotes.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120
    },
    {
      title: t('debitNotes.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => {
        const raw = value?.toUpperCase().replace(/\s/g, '_');
        return <Tag color={statusColor[raw] || 'default'}>{value}</Tag>;
      }
    },
    {
      title: t('debitNotes.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const raw = record.status?.toUpperCase().replace(/\s/g, '_');
        const isDraft = raw === 'DRAFT';
        const isPosted = raw === 'POSTED';

        return (
          <Space>
            {isDraft && (
              <Popconfirm title={t('debitNotes.postConfirm')} onConfirm={() => handlePost(record)}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} title={t('debitNotes.post')} />
              </Popconfirm>
            )}
            {isPosted && (
              <Popconfirm title={t('debitNotes.sendConfirm')} onConfirm={() => handleSend(record)}>
                <Button size="small" icon={<SendOutlined />} title={t('debitNotes.send')} />
              </Popconfirm>
            )}
            {(isDraft || isPosted) && (
              <Button danger size="small" icon={<CloseCircleOutlined />} title={t('debitNotes.void')} onClick={() => openVoidModal(record)} />
            )}
          </Space>
        );
      }
    }
  ];

  const totalAmount = notes.reduce((sum, n) => sum + Number(n.amount || 0), 0);
  const draftCount = notes.filter((n) => n.status?.toUpperCase() === 'DRAFT').length;
  const postedCount = notes.filter((n) => n.status?.toUpperCase() === 'POSTED').length;
  const sentCount = notes.filter((n) => n.status?.toUpperCase() === 'SENT').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('debitNotes.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('debitNotes.subtitle')}
          </Typography.Paragraph>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('common.resetFilters')}</Button>
          <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
            {t('debitNotes.create')}
          </Button>
        </Space>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.totalValue')} value={totalAmount} formatter={(v) => formatCurrency(v)} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.drafts')} value={draftCount} valueStyle={{ color: '#8c8c8c' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.posted')} value={postedCount} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('debitNotes.sent')} value={sentCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={notes}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* ── Create Modal with Auto-Pricing ── */}
      <Modal
        title={
          <Space>
            <FileAddOutlined />
            {t('debitNotes.createTitle')}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={920}
      >
        <Form form={form} layout="vertical" onFinish={submitEntry}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="partnerId" label={t('debitNotes.customer')} rules={[{ required: true, message: t('debitNotes.customerRequired') }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={customerOptions}
                  placeholder={t('debitNotes.selectCustomer')}
                  onChange={(value) => setSelectedPartnerId(value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="jobId" label={t('debitNotes.jobOptional')}>
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={jobOptions}
                  placeholder={t('debitNotes.selectJob')}
                  onChange={handleJobChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currency" label={t('debitNotes.currency')} rules={[{ required: true }]}>
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="docDate" label={t('debitNotes.docDate')}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dueDate" label={t('debitNotes.dueDate')}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={t('debitNotes.description')}>
            <Input placeholder={t('debitNotes.descriptionPlaceholder')} />
          </Form.Item>
        </Form>

        {/* Line Items with Auto-Pricing */}
        <LineItemsEditor
          lineItems={lineItems}
          setLineItems={setLineItems}
          allPrices={allPrices}
          selectedPartnerId={selectedPartnerId}
          selectedJobId={selectedJobId}
          jobs={jobs}
          t={t}
        />
      </Modal>

      {/* Void Modal */}
      <Modal
        title={t('debitNotes.voidTitle')}
        open={voidModalOpen}
        onCancel={() => setVoidModalOpen(false)}
        onOk={() => voidForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
        okButtonProps={{ danger: true }}
        okText={t('debitNotes.void')}
      >
        <Form form={voidForm} layout="vertical" onFinish={handleVoid}>
          <Form.Item
            name="reason"
            label={t('debitNotes.voidReason')}
            rules={[{ required: true, message: t('debitNotes.voidReasonRequired') }]}
          >
            <Input.TextArea rows={3} placeholder={t('debitNotes.voidReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
