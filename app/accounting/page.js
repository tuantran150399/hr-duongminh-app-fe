'use client';

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileAddOutlined,
  FilterOutlined,
  RiseOutlined,
  SearchOutlined,
  WalletOutlined
} from '@ant-design/icons';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
  Alert,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/AppProviders';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getAccountingCost, getAccountingRevenue } from '@/services/accountingService';
import { formatCurrency } from '@/utils/format';

const { RangePicker } = DatePicker;

const statusAppearance = {
  Paid: 'status-success',
  Issued: 'status-info',
  Draft: 'status-muted',
  Approved: 'status-emerald',
  Pending: 'status-warning'
};

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildExportContent(rows, format, headers) {
  const exportRows = rows.map((row) => ({
    job_no: row.job_no,
    amount: safeNumber(row.amount),
    status: row.status,
    date: row.date
  }));

  const values = exportRows.map((row) => [row.job_no, row.amount, row.status, row.date]);

  if (format === 'excel') {
    const content = [headers, ...values]
      .map((line) => line.join('\t'))
      .join('\n');

    return {
      blob: new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' }),
      extension: 'xls'
    };
  }

  const content = [headers, ...values]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return {
    blob: new Blob([content], { type: 'text/csv;charset=utf-8;' }),
    extension: 'csv'
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AccountingPage() {
  const { t } = useLanguage();
  const [revenue, setRevenue] = useState([]);
  const [cost, setCost] = useState([]);
  const [revenuePagination, setRevenuePagination] = useState({ current: 1, pageSize: 6 });
  const [costPagination, setCostPagination] = useState({ current: 1, pageSize: 6 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [loadError, setLoadError] = useState('');

  const tabMeta = useMemo(
    () => ({
      revenue: {
        title: t('accounting.revenue'),
        description: t('accounting.revenueDescription'),
        createLabel: t('accounting.createInvoice')
      },
      cost: {
        title: t('accounting.cost'),
        description: t('accounting.costDescription'),
        createLabel: t('accounting.addCostEntry')
      }
    }),
    [t]
  );

  useEffect(() => {
    let active = true;

    Promise.all([getAccountingRevenue(), getAccountingCost()])
      .then(([revenueResult, costResult]) => {
        if (!active) return;

        const revenueItems = revenueResult.items || [];
        const costItems = costResult.items || [];

        setRevenue(revenueItems);
        setCost(costItems);
        setRevenuePagination((current) => ({
          ...current,
          total: revenueResult.meta?.total || revenueItems.length
        }));
        setCostPagination((current) => ({
          ...current,
          total: costResult.meta?.total || costItems.length
        }));
      })
      .catch(() => {
        if (active) setLoadError('Unable to load accounting data from the backend.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeRows = activeTab === 'revenue' ? revenue : cost;
  const currentPagination = activeTab === 'revenue' ? revenuePagination : costPagination;
  const statusOptions = ['all', ...Array.from(new Set(activeRows.map((item) => item.status)))];

  const filteredRows = activeRows.filter((item) => {
    const matchesSearch = !searchTerm || item.job_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    let matchesDate = true;
    if (dateRange?.length === 2) {
      const recordDate = new Date(item.date);
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = recordDate >= startDate && recordDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalAmount = filteredRows.reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const paidAmount = filteredRows
    .filter((item) => item.status === 'Paid')
    .reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const outstandingAmount = filteredRows
    .filter((item) => item.status !== 'Paid')
    .reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const draftCount = filteredRows.filter((item) => item.status === 'Draft').length;

  const statusSummary = statusOptions
    .filter((status) => status !== 'all')
    .map((status) => {
      const amount = filteredRows
        .filter((item) => item.status === status)
        .reduce((sum, item) => sum + safeNumber(item.amount), 0);

      return {
        status,
        amount,
        percent: totalAmount ? Math.round((amount / totalAmount) * 100) : 0
      };
    })
    .filter((item) => item.amount > 0);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / currentPagination.pageSize));

  function updateCurrentPagination(nextPagination) {
    if (activeTab === 'revenue') {
      setRevenuePagination((current) => ({ ...current, ...nextPagination }));
      return;
    }

    setCostPagination((current) => ({ ...current, ...nextPagination }));
  }

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(null);
    updateCurrentPagination({ current: 1 });
  }

  function updateSearch(value) {
    setSearchTerm(value);
    updateCurrentPagination({ current: 1 });
  }

  function updateStatus(value) {
    setStatusFilter(value);
    updateCurrentPagination({ current: 1 });
  }

  function updateDateRange(value) {
    setDateRange(value);
    updateCurrentPagination({ current: 1 });
  }

  function exportRows(format) {
    if (!filteredRows.length) {
      message.info(t('common.noDataToExport'));
      return;
    }

    const headers = [
      t('accounting.jobNumber'),
      t('accounting.amount'),
      t('accounting.status'),
      t('accounting.date')
    ];

    const { blob, extension } = buildExportContent(filteredRows, format, headers);
    downloadBlob(blob, `accounting-${activeTab}.${extension}`);
    message.success(t('common.exportSuccess', { count: filteredRows.length }));
  }

  function handleCreateAction() {
    message.info(t('common.underPreparation', { label: tabMeta[activeTab].createLabel }));
  }

  const columns = [
    {
      title: t('accounting.jobNumber'),
      dataIndex: 'job_no',
      key: 'job_no',
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no)),
      render: (value) => (
        <div className="accounting-job-cell">
          <span className="accounting-job-number">{value}</span>
          <span className="accounting-job-subcopy">
            {activeTab === 'revenue' ? t('accounting.receivableRecord') : t('accounting.payableRecord')}
          </span>
        </div>
      )
    },
    {
      title: t('accounting.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => safeNumber(a.amount) - safeNumber(b.amount),
      render: (value) => <span className="accounting-amount-cell">{formatCurrency(value)}</span>
    },
    {
      title: t('accounting.status'),
      dataIndex: 'status',
      key: 'status',
      filters: statusOptions
        .filter((status) => status !== 'all')
        .map((status) => ({ text: status, value: status })),
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => String(a.status).localeCompare(String(b.status)),
      render: (value) => (
        <span className={`accounting-status-pill ${statusAppearance[value] || 'status-muted'}`}>
          {value}
        </span>
      )
    },
    {
      title: t('accounting.date'),
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (value) => <span className="accounting-date-cell">{value}</span>
    },
    {
      title: t('accounting.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" className="table-inline-action">
            {t('accounting.view')}
          </Button>
          <Button type="link" className="table-inline-action">
            {record.status === 'Paid' ? t('accounting.receipt') : t('accounting.remind')}
          </Button>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'revenue',
      label: (
        <span className="accounting-tab-label">
          {t('accounting.revenue')}
          <span className="accounting-tab-count">{revenue.length}</span>
        </span>
      )
    },
    {
      key: 'cost',
      label: (
        <span className="accounting-tab-label">
          {t('accounting.cost')}
          <span className="accounting-tab-count">{cost.length}</span>
        </span>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="accounting-page">
        <div className="accounting-hero">
          <div className="accounting-hero-copy">
            <Breadcrumb
              items={[
                { title: t('accounting.breadcrumb1') },
                { title: t('accounting.breadcrumb2') },
                { title: t('accounting.breadcrumb3') }
              ]}
              className="accounting-breadcrumb"
            />
            <div className="accounting-title-row">
              <div>
                <Typography.Title level={1} className="page-title accounting-title">
                  {t('accounting.title')}
                </Typography.Title>
                <Typography.Paragraph className="accounting-subtitle">
                  {t('accounting.subtitle')}
                </Typography.Paragraph>
              </div>
            </div>
          </div>

          <div className="accounting-hero-actions">
            <RangePicker
              className="accounting-range-filter"
              value={dateRange}
              onChange={updateDateRange}
              format="DD/MM/YYYY"
              allowClear
            />
            <Button icon={<DownloadOutlined />} onClick={() => exportRows('csv')}>
              {t('common.exportCsv')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportRows('excel')}>
              {t('common.exportExcel')}
            </Button>
            <Button type="primary" icon={<FileAddOutlined />} onClick={handleCreateAction}>
              {tabMeta[activeTab].createLabel}
            </Button>
          </div>
        </div>

        <Row gutter={[16, 16]} className="accounting-summary-grid">
          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-blue">
              <Statistic
                title={activeTab === 'revenue' ? t('accounting.totalRevenue') : t('accounting.totalCost')}
                value={totalAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<WalletOutlined />}
              />
              <div className="summary-meta">{t('accounting.acrossRecords', { count: filteredRows.length })}</div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-green">
              <Statistic
                title={t('accounting.paidSettled')}
                value={paidAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<CheckCircleOutlined />}
              />
              <div className="summary-meta">
                {totalAmount
                  ? t('accounting.trackedValue', { percent: Math.round((paidAmount / totalAmount) * 100) })
                  : t('accounting.noPaidRecords')}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-amber">
              <Statistic
                title={t('accounting.outstanding')}
                value={outstandingAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<ClockCircleOutlined />}
              />
              <div className="summary-meta">
                {t('accounting.openRecords', {
                  count: filteredRows.filter((item) => item.status !== 'Paid').length
                })}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-slate">
              <Statistic title={t('accounting.draftItems')} value={draftCount} prefix={<RiseOutlined />} />
              <div className="summary-meta">{t('accounting.draftsExcluded')}</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="accounting-insight-grid">
          <Col xs={24} xl={16}>
            <Card className="accounting-main-card">
              {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}
              <div className="accounting-card-toolbar">
                <div>
                  <Typography.Title level={4} className="accounting-section-title">
                    {t('accounting.invoiceOperations')}
                  </Typography.Title>
                  <Typography.Paragraph className="accounting-section-copy">
                    {tabMeta[activeTab].description}
                  </Typography.Paragraph>
                </div>

                <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} className="accounting-tabs" />
              </div>

              <div className="accounting-filter-row">
                <Input
                  value={searchTerm}
                  onChange={(event) => updateSearch(event.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder={t('common.searchByJobNumber')}
                  className="accounting-search-input"
                  allowClear
                />

                <Select
                  value={statusFilter}
                  onChange={updateStatus}
                  className="accounting-status-filter"
                  suffixIcon={<FilterOutlined />}
                  options={statusOptions.map((status) => ({
                    value: status,
                    label: status === 'all' ? t('common.allStatuses') : status
                  }))}
                />

                <Button onClick={resetFilters}>{t('common.resetFilters')}</Button>
              </div>

              <div className="accounting-table-shell">
                <div className="accounting-table-meta">
                  <span>{t('accounting.recordsInView', { count: filteredRows.length })}</span>
                  <span>{t('accounting.pageOf', { current: currentPagination.current, total: totalPages })}</span>
                </div>

                <Table
                  rowKey="id"
                  loading={loading}
                  columns={columns}
                  dataSource={filteredRows}
                  locale={{
                    emptyText: (
                      <Empty
                        description={
                          activeTab === 'revenue'
                            ? t('accounting.noRevenueRecords')
                            : t('accounting.noCostRecords')
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )
                  }}
                  pagination={{
                    current: currentPagination.current,
                    pageSize: currentPagination.pageSize,
                    total: filteredRows.length,
                    showSizeChanger: false,
                    showQuickJumper: false,
                    showTotal: (total, range) =>
                      t('accounting.rowRange', {
                        start: range[0],
                        end: range[1],
                        total
                      })
                  }}
                  onChange={(pagination) => {
                    updateCurrentPagination({
                      current: pagination.current,
                      pageSize: pagination.pageSize
                    });
                  }}
                  className="accounting-table"
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card className="accounting-side-card">
              <div className="accounting-side-card-header">
                <div>
                  <Typography.Title level={4} className="accounting-section-title">
                    {t('accounting.statusDistribution')}
                  </Typography.Title>
                  <Typography.Paragraph className="accounting-section-copy">
                    {t('accounting.statusDistributionCopy')}
                  </Typography.Paragraph>
                </div>
              </div>

              <div className="accounting-status-chart">
                {statusSummary.length ? (
                  statusSummary.map((item) => (
                    <div key={item.status} className="accounting-chart-row">
                      <div className="accounting-chart-label-row">
                        <span className={`accounting-status-pill ${statusAppearance[item.status] || 'status-muted'}`}>
                          {item.status}
                        </span>
                        <span className="accounting-chart-value">{formatCurrency(item.amount)}</span>
                      </div>
                      <Progress
                        percent={item.percent}
                        showInfo={false}
                        strokeColor="#0057c2"
                        trailColor="#e9eef6"
                        size={['100%', 10]}
                      />
                    </div>
                  ))
                ) : (
                  <Empty description={t('accounting.noChartData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>

              <div className="accounting-note-card">
                <CalendarOutlined />
                <div>
                  <strong>{t('accounting.reviewCadenceTitle')}</strong>
                  <span>{t('accounting.reviewCadenceCopy')}</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}
