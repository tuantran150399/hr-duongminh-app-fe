'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
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
  FileAddOutlined,
  StopOutlined,
  UploadOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  createCostEntry,
  createRevenueEntry,
  getAccountingCost,
  getAccountingRevenue,
  postCostEntry,
  postRevenueEntry,
  updateCostPaymentStatus,
  updateRevenuePaymentStatus,
  voidCostEntry,
  voidRevenueEntry
} from '@/services/accountingService';
import { getJobs } from '@/services/jobService';
import { getPartners } from '@/services/partnerService';
import { formatCurrency } from '@/utils/format';

const statusColor = {
  Draft: 'default',
  Posted: 'green',
  Voided: 'red',
  Reversed: 'orange',
  Closed: 'blue',
  Paid: 'green',
  Partial: 'gold',
  Unpaid: 'red'
};

const paymentOptions = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' }
];

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

function cleanPayload(values) {
  const amount = Number(values.amount || 0);
  const exchangeRate = Number(values.exchangeRate || 1);
  const localAmount = values.localAmount === undefined || values.localAmount === null
    ? amount * exchangeRate
    : Number(values.localAmount);

  const payload = {
    ...values,
    amount,
    exchangeRate,
    localAmount,
    docDate: toDateString(values.docDate),
    dueDate: toDateString(values.dueDate)
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export default function AccountingPage() {
  const [form] = Form.useForm();
  const [revenue, setRevenue] = useState([]);
  const [cost, setCost] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [partners, setPartners] = useState([]);
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadError, setLoadError] = useState('');

  async function loadData() {
    setLoading(true);
    setLoadError('');

    try {
      const [revenueResult, costResult, jobsResult, partnerItems] = await Promise.all([
        getAccountingRevenue(),
        getAccountingCost(),
        getJobs(),
        getPartners()
      ]);

      setRevenue(revenueResult.items || []);
      setCost(costResult.items || []);
      setJobs(jobsResult.items || []);
      setPartners(partnerItems.filter((partner) => partner.isActive));
    } catch {
      setLoadError('Unable to load accounting data from the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const activeRows = activeTab === 'revenue' ? revenue : cost;
  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(activeRows.map((row) => row.status).filter(Boolean)))],
    [activeRows]
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activeRows.filter((row) => {
      const matchesSearch = !keyword || [row.job_no, row.description, row.currency, row.status, row.paymentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeRows, search, statusFilter]);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ value: job.backendId, label: `${job.job_no} - ${job.customer}` })),
    [jobs]
  );

  const vendorOptions = useMemo(
    () =>
      partners
        .filter((partner) => ['VENDOR', 'AGENT', 'CARRIER', 'BOTH'].includes(partner.partnerType))
        .map((partner) => ({ value: partner.backendId, label: `${partner.code} - ${partner.name}` })),
    [partners]
  );

  const totalAmount = filteredRows.reduce((sum, row) => sum + safeNumber(row.amount), 0);
  const postedAmount = filteredRows
    .filter((row) => row.status === 'Posted')
    .reduce((sum, row) => sum + safeNumber(row.amount), 0);
  const draftCount = filteredRows.filter((row) => row.status === 'Draft').length;
  const openPaymentAmount = filteredRows
    .filter((row) => row.paymentStatus !== 'Paid')
    .reduce((sum, row) => sum + safeNumber(row.amount), 0);

  function openCreateModal() {
    form.resetFields();
    form.setFieldsValue({
      currency: 'VND',
      exchangeRate: 1
    });
    setModalOpen(true);
  }

  async function submitEntry(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(values);
      if (activeTab === 'revenue') {
        delete payload.vendorId;
        await createRevenueEntry(payload);
      } else {
        await createCostEntry(payload);
      }
      message.success(activeTab === 'revenue' ? 'Revenue entry created.' : 'Cost entry created.');
      setModalOpen(false);
      await loadData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to create accounting entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(record) {
    try {
      if (activeTab === 'revenue') {
        await postRevenueEntry(record.backendId);
      } else {
        await postCostEntry(record.backendId);
      }
      message.success('Entry posted.');
      await loadData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to post entry.');
    }
  }

  async function handleVoid(record) {
    try {
      if (activeTab === 'revenue') {
        await voidRevenueEntry(record.backendId, 'Voided from Phase 1 frontend testing.');
      } else {
        await voidCostEntry(record.backendId, 'Voided from Phase 1 frontend testing.');
      }
      message.success('Entry voided.');
      await loadData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to void entry.');
    }
  }

  async function handlePaymentStatus(record, paymentStatus) {
    try {
      if (activeTab === 'revenue') {
        await updateRevenuePaymentStatus(record.backendId, paymentStatus);
      } else {
        await updateCostPaymentStatus(record.backendId, paymentStatus);
      }
      message.success('Payment status updated.');
      await loadData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to update payment status.');
    }
  }

  const columns = [
    {
      title: 'Job No.',
      dataIndex: 'job_no',
      key: 'job_no',
      width: 170,
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no))
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 160,
      sorter: (a, b) => safeNumber(a.amount) - safeNumber(b.amount),
      render: (value) => <strong>{formatCurrency(value)}</strong>
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 110
    },
    {
      title: 'Financial Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 150,
      render: (value, record) => (
        <Select
          value={value === '-' ? 'UNPAID' : String(value).toUpperCase()}
          options={paymentOptions}
          size="small"
          disabled={record.status === 'Voided'}
          onChange={(nextValue) => handlePaymentStatus(record, nextValue)}
          style={{ width: 120 }}
        />
      )
    },
    {
      title: 'Doc Date',
      dataIndex: 'date',
      key: 'date',
      width: 140
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Popconfirm title="Post this draft entry?" okText="Post" onConfirm={() => handlePost(record)}>
            <Button
              icon={<UploadOutlined />}
              disabled={record.status !== 'Draft'}
              title="Post"
            />
          </Popconfirm>
          <Popconfirm
            title="Void this accounting entry?"
            okText="Void"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleVoid(record)}
          >
            <Button
              danger
              icon={<StopOutlined />}
              disabled={record.status === 'Voided'}
              title="Void"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'revenue',
      label: `Revenue (${revenue.length})`
    },
    {
      key: 'cost',
      label: `Cost (${cost.length})`
    }
  ];

  return (
    <DashboardLayout>
      <div className="accounting-page">
        <div className="page-header">
          <div>
            <Typography.Title level={1} className="page-title">Accounting</Typography.Title>
            <Typography.Paragraph className="page-subtitle">
              Revenue, cost, posting, voiding, and payment tracking per job.
            </Typography.Paragraph>
          </div>
          <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
            {activeTab === 'revenue' ? 'Create Revenue' : 'Create Cost'}
          </Button>
        </div>

        {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

        <Row gutter={[16, 16]} className="accounting-summary-grid">
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title={activeTab === 'revenue' ? 'Total Revenue' : 'Total Cost'} value={totalAmount} formatter={formatCurrency} prefix={<WalletOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title="Posted" value={postedAmount} formatter={formatCurrency} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title="Open Payment" value={openPaymentAmount} formatter={formatCurrency} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title="Draft Items" value={draftCount} />
            </Card>
          </Col>
        </Row>

        <Card className="table-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Tabs
              activeKey={activeTab}
              items={tabItems}
              onChange={(key) => {
                setActiveTab(key);
                setStatusFilter('all');
                setSearch('');
              }}
            />
            <Space wrap>
              <Input.Search
                allowClear
                value={search}
                placeholder="Search job, description, status"
                onChange={(event) => setSearch(event.target.value)}
                style={{ width: 280 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 160 }}
                options={statusOptions.map((status) => ({
                  value: status,
                  label: status === 'all' ? 'All statuses' : status
                }))}
              />
            </Space>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredRows}
            scroll={{ x: 1180 }}
            locale={{ emptyText: <Empty description="No accounting records found." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        <Modal
          title={activeTab === 'revenue' ? 'Create Revenue Entry' : 'Create Cost Entry'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          destroyOnHidden
          width={760}
        >
          <Form form={form} layout="vertical" onFinish={submitEntry}>
            <Form.Item name="jobId" label="Job No." rules={[{ required: true, message: 'Job is required.' }]}>
              <Select showSearch optionFilterProp="label" options={jobOptions} placeholder="Select job" />
            </Form.Item>
            {activeTab === 'cost' ? (
              <Form.Item name="vendorId" label="Vendor / Agent" rules={[{ required: true, message: 'Vendor is required for cost entries.' }]}>
                <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder="Select vendor" />
              </Form.Item>
            ) : null}
            <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Description is required.' }]}>
              <Input placeholder="Accounting description" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Currency is required.' }]}>
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
                <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Amount is required.' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="exchangeRate" label="Exchange Rate" rules={[{ required: true, message: 'Exchange rate is required.' }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="localAmount" label="Local Amount">
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="docDate" label="Document Date">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="dueDate" label="Due Date">
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="refNumber" label="Reference No.">
                  <Input placeholder="Reference number" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="invoiceNumber" label="Invoice No.">
                  <Input placeholder="Invoice number" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Notes" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
