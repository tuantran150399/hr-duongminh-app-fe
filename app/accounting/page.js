'use client';

import {
  App,
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
  Upload
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
import FilterCard from '@/components/FilterCard';
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
import { formatCurrency, formatDate } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import { decimalInputProps } from '@/utils/formUtils';
import { useLanguage } from '@/components/AppProviders';

function formatCompactCurrency(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '0';
  if (Math.abs(amount) >= 1000000000) return `${(amount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(amount) >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

function formatPeriodLabel(period, locale, t) {
  if (!period) return '-';
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    return t('accounting.monthYear', { month: Number(month), year });
  }

  const date = new Date(period);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(date);
  }

  return String(period);
}

function ChartRow({ revenueChart, costChart, t, language }) {
  const chartText = {
    revenueTitle: t('accounting.chart.revenueTitle'),
    costTitle: t('accounting.chart.costTitle'),
    noData: t('accounting.chart.noData'),
    amount: t('accounting.chart.amount'),
    entries: t('accounting.chart.entries')
  };

  function extractEntries(data) {
    if (!data) return [];
    return Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : Object.entries(data ?? {}).map(([status, total]) => ({ status, total }));
  }

  function renderMonthlyChart(data, title, barColor, accentColor) {
    const entries = extractEntries(data)
      .map((entry, index) => ({
        ...entry,
        chartKey: entry.period || entry.status || index,
        chartValue: Number(entry.totalAmount ?? entry.total ?? 0),
        chartCount: Number(entry.count ?? 0),
        chartLabel: entry.period || entry.status || `#${index + 1}`
      }))
      .filter((entry) => Number.isFinite(entry.chartValue));

    if (!entries.length) {
      return (
        <Card style={{ height: 320 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16, color: '#0f172a' }}>{title}</div>
          <div style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 80 }}>
            {chartText.noData}
          </div>
        </Card>
      );
    }

    const maxVal = Math.max(...entries.map((entry) => entry.chartValue), 1);
    const totalValue = entries.reduce((sum, entry) => sum + entry.chartValue, 0);
    const totalCount = entries.reduce((sum, entry) => sum + entry.chartCount, 0);
    const barWidth = Math.max(24, Math.min(48, Math.floor(320 / entries.length)));
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    return (
      <Card style={{ height: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {totalCount} {chartText.entries}
            </div>
          </div>
          <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {formatCurrency(totalValue)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 4px' }}>
          {entries.map((entry) => {
            const val = entry.chartValue;
            const heightPx = Math.max(8, (val / maxVal) * 160);
            return (
              <Tooltip
                key={entry.chartKey}
                title={
                  <div>
                    <div style={{ fontWeight: 600 }}>{formatPeriodLabel(entry.chartLabel, locale, t)}</div>
                    <div>{chartText.amount}: {formatCurrency(val)}</div>
                    {entry.chartCount > 0 ? <div>{chartText.entries}: {entry.chartCount}</div> : null}
                  </div>
                }
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#64748b',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: barWidth + 10
                    }}
                  >
                    {val > 0 ? formatCompactCurrency(val) : ''}
                  </div>
                  <div
                    style={{
                      width: barWidth,
                      height: heightPx,
                      background: `linear-gradient(180deg, ${barColor} 0%, ${accentColor} 100%)`,
                      borderRadius: '8px 8px 0 0',
                      boxShadow: `0 10px 20px ${accentColor}33`,
                      transition: 'height 0.5s ease',
                      cursor: 'pointer',
                      minHeight: 8
                    }}
                  />
                </div>
              </Tooltip>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '6px 4px 0', borderTop: '1px solid #f0f0f0' }}>
          {entries.map((entry) => (
            <div
              key={entry.chartKey}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 11,
                color: '#8c8c8c',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {formatPeriodLabel(entry.chartLabel, locale, t)}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} md={12}>
        {renderMonthlyChart(revenueChart, chartText.revenueTitle, '#0057c2', '#40a9ff')}
      </Col>
      <Col xs={24} md={12}>
        {renderMonthlyChart(costChart, chartText.costTitle, '#ff4d4f', '#ff7a7a')}
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

const paymentOptionsKeys = ['UNPAID', 'PARTIAL', 'PAID'];

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
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('revenue');
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentChange, setPendingPaymentChange] = useState(null);

  const statusLabelMap = {
    Draft: t('accounting.statusDraft'),
    Posted: t('accounting.statusPosted'),
    Voided: t('accounting.statusVoided'),
    Reversed: t('accounting.statusReversed'),
    Closed: t('accounting.statusClosed')
  };

  const paymentLabelMap = {
    UNPAID: t('accounting.unpaid'),
    PARTIAL: t('accounting.partial'),
    PAID: t('accounting.paid')
  };

  const paymentOptions = paymentOptionsKeys.map((key) => ({
    value: key,
    label: paymentLabelMap[key] || key
  }));

  const paymentMethodLabelMap = {
    CASH: t('accounting.paymentMethodCash'),
    BANK: t('accounting.paymentMethodBank')
  };

  const paymentMethodOptions = [
    { value: 'CASH', label: paymentMethodLabelMap.CASH },
    { value: 'BANK', label: paymentMethodLabelMap.BANK }
  ];

  // COB modal state
  const [cobModalOpen, setCobModalOpen] = useState(false);
  const [cobCostRecord, setCobCostRecord] = useState(null);
  const [cobCustomerId, setCobCustomerId] = useState(null);
  const [cobSaving, setCobSaving] = useState(false);

  // RTK Query hooks
  const { data: revenueData, isLoading: loadingRevenue, error: revenueError } = useGetAccountingRevenueQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  const { data: costData, isLoading: loadingCost, error: costError } = useGetAccountingCostQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
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
  const { data: costChartData } = useGetCostChartQuery();

  const revenue = revenueData?.items || [];
  const cost = costData?.items || [];
  const jobs = jobsData?.items || [];
  const partners = (partnersData?.items || []).filter(p => p.isActive);
  const loading = loadingRevenue || loadingCost;
  const loadError = (revenueError || costError) ? t('accounting.loadError') : '';

  const activeRows = activeTab === 'revenue' ? revenue : cost;
  const allStatusesLabel = t('accounting.allStatuses') === 'accounting.allStatuses'
    ? t('common.allStatuses')
    : t('accounting.allStatuses');
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return activeRows;

    return activeRows.filter((row) => {
      return [row.job_no, row.description, row.currency, row.status, row.paymentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [activeRows, search]);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({
      value: job.backendId,
      label: `${job.job_no || job.raw?.jobCode || job.id} - ${job.customer || job.raw?.partnerName || ''}`
    })),
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
      message.success(t('accounting.createSuccess'));
      setModalOpen(false);

    } catch (err) {
      message.error(getApiError(err, t, 'accounting.createError'));
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
      message.success(t('accountingForm.postSuccess'));

    } catch (err) {
      message.error(getApiError(err, t, 'accountingForm.postError'));
    }
  }

  async function handleVoid(record) {
    try {
      if (activeTab === 'revenue') {
        await voidRevenueEntry({ id: record.backendId, reason: 'Voided.' }).unwrap();
      } else {
        await voidCostEntry({ id: record.backendId, reason: 'Voided.' }).unwrap();
      }
      message.success(t('accountingForm.voidSuccess'));

    } catch (err) {
      message.error(getApiError(err, t, 'accountingForm.voidError'));
    }
  }

  async function savePaymentStatus(record, payload) {
    try {
      if (activeTab === 'revenue') {
        await updateRevenuePaymentStatus({ id: record.backendId, ...payload }).unwrap();
      } else {
        await updateCostPaymentStatus({ id: record.backendId, ...payload }).unwrap();
      }
      message.success(t('accountingForm.paymentUpdated'));

    } catch (err) {
      message.error(getApiError(err, t, 'accountingForm.paymentError'));
    }
  }

  async function handlePaymentStatus(record, paymentStatus) {
    if (paymentStatus === 'UNPAID') {
      await savePaymentStatus(record, { paymentStatus });
      return;
    }

    setPendingPaymentChange({ record, paymentStatus });
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      paymentMethod: record.paymentMethod || 'CASH',
      accountRef: record.paymentAccountRef || '',
      paidAmount: paymentStatus === 'PARTIAL' ? Number(record.paidAmount || 0) || undefined : undefined
    });
    setPaymentModalOpen(true);
  }

  async function submitPaymentMethod(values) {
    if (!pendingPaymentChange) return;
    await savePaymentStatus(pendingPaymentChange.record, {
      paymentStatus: pendingPaymentChange.paymentStatus,
      paymentMethod: values.paymentMethod,
      accountRef: values.accountRef,
      paidAmount: pendingPaymentChange.paymentStatus === 'PARTIAL' ? Number(values.paidAmount) : undefined
    });
    setPaymentModalOpen(false);
    setPendingPaymentChange(null);
  }

  async function handleCostImport(options) {
    const { file, onError, onSuccess } = options;

    try {
      const result = await importCostEntries(file).unwrap();
      const errorSuffix = result.errorCount ? ` ${result.errorCount} row(s) failed.` : '';
      message.success(t('accounting.importSuccess', { count: result.createdCount || 0 }) + errorSuffix);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = getApiError(err, t, 'accounting.unableToImport');
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
      message.warning(t('accountingForm.selectCustomer'));
      return;
    }

    setCobSaving(true);
    try {
      await markCostAsCob({ costId: cobCostRecord.backendId, partnerId: cobCustomerId }).unwrap();
      message.success(t('accountingForm.cobSuccess'));
      setCobModalOpen(false);
      setCobCostRecord(null);
    } catch (err) {
      message.error(getApiError(err, t, 'accountingForm.cobError'));
    } finally {
      setCobSaving(false);
    }
  }

  const columns = [
    {
      title: t('accountingForm.jobNo'),
      dataIndex: 'job_no',
      key: 'job_no',
      width: 170,
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no))
    },
    { title: t('accountingForm.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('accountingForm.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 160,
      sorter: (a, b) => safeNumber(a.amount) - safeNumber(b.amount),
      render: (value, record) => {
        const paidAmount = Number(record.paidAmount || 0);
        const remainingAmount = Math.max(Number(value || 0) - paidAmount, 0);
        return (
          <Space direction="vertical" size={1} style={{ textAlign: 'right' }}>
            <strong>{formatCurrency(value)}</strong>
            {paidAmount > 0 ? <small>{t('accounting.paidAmount')}: {formatCurrency(paidAmount)}</small> : null}
            {paidAmount > 0 ? <small>{t('accounting.remainingAmount')}: {formatCurrency(remainingAmount)}</small> : null}
          </Space>
        );
      }
    },
    {
      title: t('accountingForm.currency'),
      dataIndex: 'currency',
      key: 'currency',
      width: 110
    },
    {
      title: t('accounting.status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value) => <Tag color={statusColor[value] || 'default'}>{statusLabelMap[value] || value}</Tag>
    },
    {
      title: t('accounting.paymentStatus'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 180,
      render: (value, record) => {
        const isSynthetic = record.raw?.sourceType && !['REVENUE_ENTRY', 'COST_ENTRY'].includes(record.raw.sourceType);
        return (
          <Space direction="vertical" size={4}>
            <Select
              value={value === '-' ? 'UNPAID' : String(value).toUpperCase()}
              options={paymentOptions}
              size="small"
              disabled={record.status !== 'Posted' || isSynthetic}
              onChange={(nextValue) => handlePaymentStatus(record, nextValue)}
              style={{ width: 130 }}
            />
            {record.paymentMethod ? (
              <Tag color={record.paymentMethod === 'BANK' ? 'blue' : 'green'}>
                {paymentMethodLabelMap[record.paymentMethod] || record.paymentMethod}
              </Tag>
            ) : null}
          </Space>
        );
      }
    },
    {
      title: t('accountingForm.docDate'),
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (val) => formatDate(val, language)
    },
    {
      title: t('accountingForm.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      render: (val) => formatDate(val, language)
    },
    {
      title: t('accounting.actions'),
      key: 'actions',
      width: activeTab === 'cost' ? 210 : 160,
      render: (_, record) => {
        const isSynthetic = record.raw?.sourceType && !['REVENUE_ENTRY', 'COST_ENTRY'].includes(record.raw.sourceType);
        if (isSynthetic) {
          return <Tag>{record.raw?.sourceType}</Tag>;
        }
        return (
          <Space>
            <Popconfirm title={t('accountingForm.postConfirm')} okText={t('accountingForm.postOk')} onConfirm={() => handlePost(record)}>
              <Button
                icon={<UploadOutlined />}
                disabled={record.status !== 'Draft'}
                title={t('accountingForm.postOk')}
              />
            </Popconfirm>
            {activeTab === 'cost' && record.status === 'Posted' && (
              <Tooltip title={t('accountingForm.cobTooltip')}>
                <Button
                  icon={<SwapOutlined />}
                  onClick={() => openCobModal(record)}
                  style={{ color: '#1677ff' }}
                  title={t('accountingForm.markCob')}
                />
              </Tooltip>
            )}
            <Popconfirm
              title={t('accountingForm.voidConfirm')}
              okText={t('accountingForm.voidOk')}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleVoid(record)}
            >
              <Button
                danger
                icon={<StopOutlined />}
                disabled={record.status === 'Voided'}
                title={t('accountingForm.voidOk')}
              />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const tabItems = [
    {
      key: 'revenue',
      label: `${t('accounting.revenue')} (${revenue.length})`
    },
    {
      key: 'cost',
      label: `${t('accounting.cost')} (${cost.length})`
    }
  ];

  return (
    <DashboardLayout>
      <div className="accounting-page">
        <div className="page-header">
          <div>
            <Typography.Title level={1} className="page-title">{t('accounting.title')}</Typography.Title>
            <Typography.Paragraph className="page-subtitle">
              {t('accounting.subtitle')}
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
                  {t('accounting.importExcel')}
                </Button>
              </Upload>
            ) : null}
            <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
              {activeTab === 'revenue' ? t('accounting.createRevenue') : t('accounting.createCost')}
            </Button>
          </div>
        </div>

        {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

        <Row gutter={[16, 16]} className="accounting-summary-grid">
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title={activeTab === 'revenue' ? t('accounting.totalRevenue') : t('accounting.totalCost')} value={totalAmount} formatter={formatCurrency} prefix={<WalletOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title={t('accountingForm.posted')} value={postedAmount} formatter={formatCurrency} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title={t('accountingForm.openPayment')} value={openPaymentAmount} formatter={formatCurrency} />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic title={t('accountingForm.draftItems')} value={draftCount} />
            </Card>
          </Col>
        </Row>

        {/* Revenue / Cost chart row */}
        <ChartRow revenueChart={revenueChartData} costChart={costChartData} t={t} language={language} />

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
          </div>

          <FilterCard
            searchValue={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            searchPlaceholder={t('accountingForm.searchPlaceholder')}
            statusValue={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: 'all', label: allStatusesLabel },
              { value: 'Draft', label: statusLabelMap.Draft },
              { value: 'Posted', label: statusLabelMap.Posted },
              { value: 'Voided', label: statusLabelMap.Voided },
              { value: 'Reversed', label: statusLabelMap.Reversed },
              { value: 'Closed', label: statusLabelMap.Closed }
            ]}
            showDateRange={false}
          />

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredRows}
            scroll={{ x: 1180 }}
            locale={{ emptyText: <Empty description={t('accountingForm.noRecords')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>

        <Modal
          title={activeTab === 'revenue' ? t('accounting.createRevenue') : t('accounting.createCost')}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          destroyOnHidden
          width={760}
        >
          <Form form={form} layout="vertical" onFinish={submitEntry}>
            <Form.Item name="jobId" label={t('accountingForm.jobNo')} rules={[{ required: true, message: t('accountingForm.jobRequired') }]}>
              <Select showSearch optionFilterProp="label" options={jobOptions} placeholder={t('accountingForm.selectJob')} />
            </Form.Item>
            {activeTab === 'cost' ? (
              <Form.Item name="vendorId" label={t('accountingForm.vendorAgent')} rules={[{ required: true, message: t('accountingForm.vendorRequired') }]}>
                <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder={t('accountingForm.selectVendor')} />
              </Form.Item>
            ) : null}
            <Form.Item name="description" label={t('accountingForm.description')} rules={[{ required: true, message: t('accountingForm.descriptionRequired') }]}>
              <Input placeholder={t('accountingForm.descriptionPlaceholder')} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="currency" label={t('accountingForm.currency')} rules={[{ required: true, message: t('accountingForm.currencyRequired') }]}>
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
                <Form.Item name="amount" label={t('accountingForm.amount')} rules={[{ required: true, message: t('accountingForm.amountRequired') }]}>
                  <InputNumber {...decimalInputProps} min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="exchangeRate" label={t('accountingForm.exchangeRate')} rules={[{ required: true, message: t('accountingForm.exchangeRateRequired') }]}>
                  <InputNumber {...decimalInputProps} min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="localAmount" label={t('accountingForm.localAmount')}>
                  <InputNumber {...decimalInputProps} min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="docDate" label={t('accountingForm.docDate')}>
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="dueDate" label={t('accountingForm.dueDate')}>
                  <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="refNumber" label={t('accountingForm.refNumber')}>
                  <Input placeholder={t('accountingForm.refPlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="invoiceNumber" label={t('accountingForm.invoiceNumber')}>
                  <Input placeholder={t('accountingForm.invoicePlaceholder')} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label={t('accountingForm.notes')}>
              <Input.TextArea rows={3} placeholder={t('accountingForm.notesPlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>

        {/* COB Modal — Mark cost as charge-on-behalf */}
        <Modal
          title={t('accounting.paymentMethod')}
          open={paymentModalOpen}
          onCancel={() => { setPaymentModalOpen(false); setPendingPaymentChange(null); }}
          onOk={() => paymentForm.submit()}
          destroyOnHidden
          width={460}
        >
          <Form form={paymentForm} layout="vertical" onFinish={submitPaymentMethod}>
            {pendingPaymentChange?.paymentStatus === 'PARTIAL' ? (
              <Form.Item
                name="paidAmount"
                label={t('accounting.paidAmount')}
                rules={[{ required: true, message: t('accounting.paidAmountRequired') }]}
              >
                <InputNumber {...decimalInputProps} min={0.01} style={{ width: '100%' }} />
              </Form.Item>
            ) : null}
            <Form.Item
              name="paymentMethod"
              label={t('accounting.paymentMethod')}
              rules={[{ required: true, message: t('accounting.paymentMethodRequired') }]}
            >
              <Select options={paymentMethodOptions} />
            </Form.Item>
            <Form.Item name="accountRef" label={t('accounting.accountRef')}>
              <Input placeholder={t('accounting.accountRefPlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            <Space>
              <SwapOutlined />
              {t('accountingForm.cobTooltip')}
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
            message={t('accountingForm.markCob')}
            description={t('accountingForm.cobDescription')}
            style={{ marginBottom: 16 }}
          />
          {cobCostRecord && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div><strong>{t('accountingForm.description')}:</strong> {cobCostRecord.description}</div>
              <div><strong>{t('accountingForm.amount')}:</strong> {formatCurrency(cobCostRecord.amount)} {cobCostRecord.currency}</div>
              <div><strong>{t('accountingForm.jobNo')}:</strong> {cobCostRecord.job_no}</div>
            </div>
          )}
          <Typography.Text>{t('accountingForm.selectCustomer')}:</Typography.Text>
          <Select
            showSearch
            optionFilterProp="label"
            options={customerOptions}
            placeholder={t('accountingForm.selectCustomer')}
            value={cobCustomerId}
            onChange={setCobCustomerId}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}
