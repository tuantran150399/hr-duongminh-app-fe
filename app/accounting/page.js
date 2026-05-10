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
  Tooltip,
  Typography,
  Upload,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  FileAddOutlined,
  StopOutlined,
  SwapOutlined,
  UploadOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  useGetAccountingRevenueQuery,
  useGetAccountingCostQuery,
  useCreateRevenueEntryMutation,
  useCreateCostEntryMutation,
  useImportCostEntriesMutation,
  usePostRevenueEntryMutation,
  usePostCostEntryMutation,
  useVoidRevenueEntryMutation,
  useVoidCostEntryMutation,
  useUpdateRevenuePaymentStatusMutation,
  useUpdateCostPaymentStatusMutation,
  useGetRevenueChartQuery,
  useGetCostChartQuery
} from '@/store/services/accountingApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useMarkCostAsCobMutation } from '@/store/services/cobApi';
import { formatCurrency } from '@/utils/format';
import { useLanguage } from '@/components/AppProviders';

const CHART_COLORS = [
  '#0057c2', '#52c41a', '#fa8c16', '#ff4d4f',
  '#13c2c2', '#722ed1', '#eb2f96', '#fadb14'
];

function ChartRow({ revenueChart, costChart, t }) {
  function extractEntries(data) {
    if (!data) return [];
    return Array.isArray(data?.data) ? data.data
      : Array.isArray(data) ? data
      : Object.entries(data ?? {}).map(([status, total]) => ({ status, total }));
  }

  function renderMonthlyChart(data, titleKey, barColor, accentColor) {
    const entries = extractEntries(data);
    if (!entries.length) {
      return (
        <Card style={{ height: 320 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>{t(titleKey)}</div>
          <div style={{ color: '#aaa', textAlign: 'center', paddingTop: 80 }}>
            {t('accounting.chart.noData')}
          </div>
        </Card>
      );
    }

    const maxVal = Math.max(...entries.map(e => Number(e.totalAmount ?? e.total ?? 0)), 1);
    const totalValue = entries.reduce((s, e) => s + Number(e.totalAmount ?? e.total ?? 0), 0);
    const totalCount = entries.reduce((s, e) => s + Number(e.count ?? 0), 0);
    const barWidth = Math.max(24, Math.min(48, Math.floor(320 / entries.length)));

    return (
      <Card style={{ height: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{t(titleKey)}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {totalCount} {t('accounting.chart.entries')} · {formatCurrency(totalValue)}
          </div>
        </div>

        {/* Vertical bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 4px' }}>
          {entries.map((e, i) => {
            const val = Number(e.totalAmount ?? e.total ?? 0);
            const pct = (val / maxVal * 100).toFixed(1);
            const heightPx = Math.max(4, (val / maxVal) * 160);
            return (
              <Tooltip
                key={e.period || e.status || i}
                title={
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.period || e.status}</div>
                    <div>{t('accounting.chart.amount')}: {formatCurrency(val)}</div>
                    {e.count !== undefined && <div>{t('accounting.chart.entries')}: {e.count}</div>}
                  </div>
                }
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, color: '#595959', marginBottom: 4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: barWidth + 8
                  }}>
                    {val > 0 ? formatCurrency(val) : ''}
                  </div>
                  <div
                    style={{
                      width: barWidth,
                      height: heightPx,
                      background: `linear-gradient(180deg, ${barColor} 0%, ${accentColor} 100%)`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      cursor: 'pointer',
                      minHeight: 4
                    }}
                  />
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* Period labels */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 4px 0', borderTop: '1px solid #f0f0f0' }}>
          {entries.map((e, i) => (
            <div key={e.period || i} style={{
              flex: 1, textAlign: 'center', fontSize: 11, color: '#8c8c8c',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {(e.period || '').replace(/^\d{4}-/, '')}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} md={12}>
        {renderMonthlyChart(revenueChart, 'accounting.chart.revenueTitle', '#0057c2', '#40a9ff')}
      </Col>
      <Col xs={24} md={12}>
        {renderMonthlyChart(costChart, 'accounting.chart.costTitle', '#ff4d4f', '#ff7a7a')}
      </Col>
    </Row>
  );
}

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
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('revenue');
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // COB modal state
  const [cobModalOpen, setCobModalOpen] = useState(false);
  const [cobCostRecord, setCobCostRecord] = useState(null);
  const [cobCustomerId, setCobCustomerId] = useState(null);
  const [cobSaving, setCobSaving] = useState(false);

  // RTK Query hooks
  const { data: revenueData, isLoading: loadingRevenue, error: revenueError } = useGetAccountingRevenueQuery();
  const { data: costData, isLoading: loadingCost, error: costError } = useGetAccountingCostQuery();
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();

  const [createRevenueEntry] = useCreateRevenueEntryMutation();
  const [createCostEntry] = useCreateCostEntryMutation();
  const [importCostEntries] = useImportCostEntriesMutation();
  const [postRevenueEntry] = usePostRevenueEntryMutation();
  const [postCostEntry] = usePostCostEntryMutation();
  const [voidRevenueEntry] = useVoidRevenueEntryMutation();
  const [voidCostEntry] = useVoidCostEntryMutation();
  const [updateRevenuePaymentStatus] = useUpdateRevenuePaymentStatusMutation();
  const [updateCostPaymentStatus] = useUpdateCostPaymentStatusMutation();
  const [markCostAsCob] = useMarkCostAsCobMutation();

  const { data: revenueChartData } = useGetRevenueChartQuery();
  const { data: costChartData }    = useGetCostChartQuery();

  const revenue = revenueData?.items || [];
  const cost = costData?.items || [];
  const jobs = jobsData?.items || [];
  const partners = (partnersData?.items || []).filter(p => p.isActive);
  const loading = loadingRevenue || loadingCost;
  const loadError = (revenueError || costError) ? 'Unable to load accounting data from the backend.' : '';

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
        .filter((partner) => ['VENDOR', 'BOTH'].includes(partner.partnerType))
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
        await createRevenueEntry(payload).unwrap();
      } else {
        await createCostEntry(payload).unwrap();
      }
      message.success(activeTab === 'revenue' ? 'Revenue entry created.' : 'Cost entry created.');
      setModalOpen(false);
      
    } catch (err) {
      message.error(err?.data?.message || 'Unable to create accounting entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(record) {
    try {
      if (activeTab === 'revenue') {
        await postRevenueEntry(record.backendId).unwrap();
      } else {
        await postCostEntry(record.backendId).unwrap();
      }
      message.success('Entry posted.');
      
    } catch (err) {
      message.error(err?.data?.message || 'Unable to post entry.');
    }
  }

  async function handleVoid(record) {
    try {
      if (activeTab === 'revenue') {
        await voidRevenueEntry({ id: record.backendId, reason: 'Voided.' }).unwrap();
      } else {
        await voidCostEntry({ id: record.backendId, reason: 'Voided.' }).unwrap();
      }
      message.success('Entry voided.');
      
    } catch (err) {
      message.error(err?.data?.message || 'Unable to void entry.');
    }
  }

  async function handlePaymentStatus(record, paymentStatus) {
    try {
      if (activeTab === 'revenue') {
        await updateRevenuePaymentStatus({ id: record.backendId, paymentStatus }).unwrap();
      } else {
        await updateCostPaymentStatus({ id: record.backendId, paymentStatus }).unwrap();
      }
      message.success('Payment status updated.');
      
    } catch (err) {
      message.error(err?.data?.message || 'Unable to update payment status.');
    }
  }

  async function handleCostImport(options) {
    const { file, onError, onSuccess } = options;

    try {
      const result = await importCostEntries(file).unwrap();
      const errorSuffix = result.errorCount ? ` ${result.errorCount} row(s) failed.` : '';
      message.success(`Imported ${result.createdCount || 0} cost row(s).${errorSuffix}`);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err?.data?.message || 'Unable to import cost file.';
      message.error(errorMessage);
      onError?.(err);
    }
  }

  // ─── COB automation ─────────────────────────────────────────────────────────

  const customerOptions = useMemo(
    () =>
      partners
        .filter((partner) => ['CUSTOMER', 'BOTH'].includes(partner.partnerType))
        .map((partner) => ({ value: partner.backendId, label: `${partner.code} - ${partner.name}` })),
    [partners]
  );

  function openCobModal(record) {
    setCobCostRecord(record);
    setCobCustomerId(null);
    setCobModalOpen(true);
  }

  async function handleCobSubmit() {
    if (!cobCustomerId) {
      message.warning('Please select a customer to charge.');
      return;
    }

    setCobSaving(true);
    try {
      await markCostAsCob({ costId: cobCostRecord.backendId, partnerId: cobCustomerId }).unwrap();
      message.success('Cost marked as charge-on-behalf. A receivable has been auto-created.');
      setCobModalOpen(false);
      setCobCostRecord(null);
    } catch (err) {
      message.error(err?.data?.message || 'Unable to mark cost as COB.');
    } finally {
      setCobSaving(false);
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
          disabled={record.status !== 'Posted'}
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
      width: activeTab === 'cost' ? 210 : 160,
      render: (_, record) => (
        <Space>
          <Popconfirm title="Post this draft entry?" okText="Post" onConfirm={() => handlePost(record)}>
            <Button
              icon={<UploadOutlined />}
              disabled={record.status !== 'Draft'}
              title="Post"
            />
          </Popconfirm>
          {activeTab === 'cost' && record.status === 'Posted' && (
            <Tooltip title="Chi hộ — charge customer on behalf">
              <Button
                icon={<SwapOutlined />}
                onClick={() => openCobModal(record)}
                style={{ color: '#1677ff' }}
                title="Mark as COB"
              />
            </Tooltip>
          )}
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
          <div className="page-actions">
            {activeTab === 'cost' ? (
              <Upload
                accept=".xlsx,.xls,.csv"
                showUploadList={false}
                customRequest={handleCostImport}
              >
                <Button icon={<UploadOutlined />}>
                  Import Cost Excel
                </Button>
              </Upload>
            ) : null}
            <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
              {activeTab === 'revenue' ? 'Create Revenue' : 'Create Cost'}
            </Button>
          </div>
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

        {/* Revenue / Cost chart row */}
        <ChartRow revenueChart={revenueChartData} costChart={costChartData} t={t} />

        <Card className="table-card" style={{ marginTop: 16 }}>
          <div className="accounting-card-toolbar">
            <Tabs
              className="responsive-tabs"
              activeKey={activeTab}
              items={tabItems}
              onChange={(key) => {
                setActiveTab(key);
                setStatusFilter('all');
                setSearch('');
              }}
            />
            <Space wrap className="page-actions">
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

        {/* COB Modal — Mark cost as charge-on-behalf */}
        <Modal
          title={
            <Space>
              <SwapOutlined />
              Chi hộ — Charge on Behalf
            </Space>
          }
          open={cobModalOpen}
          onCancel={() => { setCobModalOpen(false); setCobCostRecord(null); }}
          onOk={handleCobSubmit}
          confirmLoading={cobSaving}
          destroyOnHidden
          width={500}
        >
          <Alert
            type="info"
            showIcon
            message="Auto-receivable"
            description="When you mark this cost as COB, the system will automatically create a matching receivable from the selected customer, linked to the same Job No."
            style={{ marginBottom: 16 }}
          />
          {cobCostRecord && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div><strong>Cost entry:</strong> {cobCostRecord.description}</div>
              <div><strong>Amount:</strong> {formatCurrency(cobCostRecord.amount)} {cobCostRecord.currency}</div>
              <div><strong>Job:</strong> {cobCostRecord.job_no}</div>
            </div>
          )}
          <Typography.Text>Select the customer to charge this cost to:</Typography.Text>
          <Select
            showSearch
            optionFilterProp="label"
            options={customerOptions}
            placeholder="Select customer"
            value={cobCustomerId}
            onChange={setCobCustomerId}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
