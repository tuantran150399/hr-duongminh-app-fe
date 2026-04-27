'use client';

import { useEffect, useState } from 'react';
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
  message
} from 'antd';
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

const tabMeta = {
  revenue: {
    title: 'Revenue',
    description: 'Customer invoices, payment collection, and aging.',
    createLabel: 'Create Invoice'
  },
  cost: {
    title: 'Cost',
    description: 'Vendor costs, approvals, and settlement tracking.',
    createLabel: 'Add Cost Entry'
  }
};

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildExportContent(rows, format) {
  const exportRows = rows.map((row) => ({
    job_no: row.job_no,
    amount: safeNumber(row.amount),
    status: row.status,
    date: row.date
  }));

  const headers = ['Job Number', 'Amount', 'Status', 'Date'];
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
  const [revenue, setRevenue] = useState([]);
  const [cost, setCost] = useState([]);
  const [revenuePagination, setRevenuePagination] = useState({ current: 1, pageSize: 6 });
  const [costPagination, setCostPagination] = useState({ current: 1, pageSize: 6 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

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
    const matchesSearch =
      !searchTerm ||
      item.job_no?.toLowerCase().includes(searchTerm.toLowerCase());

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

  function handleTabChange(key) {
    setActiveTab(key);
  }

  function exportRows(format) {
    if (!filteredRows.length) {
      message.info('There is no data to export for the current view.');
      return;
    }

    const { blob, extension } = buildExportContent(filteredRows, format);
    downloadBlob(blob, `accounting-${activeTab}.${extension}`);
    message.success(`Exported ${filteredRows.length} rows.`);
  }

  function handleCreateAction() {
    message.info(`${tabMeta[activeTab].createLabel} is ready for the next implementation step.`);
  }

  const columns = [
    {
      title: 'Job Number',
      dataIndex: 'job_no',
      key: 'job_no',
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no)),
      render: (value) => (
        <div className="accounting-job-cell">
          <span className="accounting-job-number">{value}</span>
          <span className="accounting-job-subcopy">
            {activeTab === 'revenue' ? 'Receivable record' : 'Payable record'}
          </span>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      sorter: (a, b) => safeNumber(a.amount) - safeNumber(b.amount),
      render: (value) => <span className="accounting-amount-cell">{formatCurrency(value)}</span>
    },
    {
      title: 'Status',
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (value) => <span className="accounting-date-cell">{value}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" className="table-inline-action">
            View
          </Button>
          <Button type="link" className="table-inline-action">
            {record.status === 'Paid' ? 'Receipt' : 'Remind'}
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
          Revenue
          <span className="accounting-tab-count">{revenue.length}</span>
        </span>
      )
    },
    {
      key: 'cost',
      label: (
        <span className="accounting-tab-label">
          Cost
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
                { title: 'Operations' },
                { title: 'Finance' },
                { title: 'Accounting dashboard' }
              ]}
              className="accounting-breadcrumb"
            />
            <div className="accounting-title-row">
              <div>
                <Typography.Title level={1} className="page-title accounting-title">
                  Accounting
                </Typography.Title>
                <Typography.Paragraph className="accounting-subtitle">
                  Track receivables, payables, and cash collection from one operational workspace.
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
              Export CSV
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportRows('excel')}>
              Export Excel
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
                title={activeTab === 'revenue' ? 'Total Revenue' : 'Total Cost'}
                value={totalAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<WalletOutlined />}
              />
              <div className="summary-meta">Across {filteredRows.length} finance records</div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-green">
              <Statistic
                title="Paid / Settled"
                value={paidAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<CheckCircleOutlined />}
              />
              <div className="summary-meta">
                {totalAmount ? `${Math.round((paidAmount / totalAmount) * 100)}% of tracked value` : 'No paid records yet'}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-amber">
              <Statistic
                title="Outstanding"
                value={outstandingAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<ClockCircleOutlined />}
              />
              <div className="summary-meta">
                {filteredRows.filter((item) => item.status !== 'Paid').length} open records need follow-up
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card className="accounting-summary-card accent-slate">
              <Statistic
                title="Draft Items"
                value={draftCount}
                prefix={<RiseOutlined />}
              />
              <div className="summary-meta">Drafts are excluded from settled cash flow</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="accounting-insight-grid">
          <Col xs={24} xl={16}>
            <Card className="accounting-main-card">
              <div className="accounting-card-toolbar">
                <div>
                  <Typography.Title level={4} className="accounting-section-title">
                    Invoice operations
                  </Typography.Title>
                  <Typography.Paragraph className="accounting-section-copy">
                    {tabMeta[activeTab].description}
                  </Typography.Paragraph>
                </div>

                <Tabs
                  activeKey={activeTab}
                  items={tabItems}
                  onChange={handleTabChange}
                  className="accounting-tabs"
                />
              </div>

              <div className="accounting-filter-row">
                <Input
                  value={searchTerm}
                  onChange={(event) => updateSearch(event.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="Search by job number"
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
                    label: status === 'all' ? 'All statuses' : status
                  }))}
                />

                <Button onClick={resetFilters}>Reset filters</Button>
              </div>

              <div className="accounting-table-shell">
                <div className="accounting-table-meta">
                  <span>{filteredRows.length} records in view</span>
                  <span>Page {currentPagination.current} of {totalPages}</span>
                </div>

                <Table
                  rowKey="id"
                  loading={loading}
                  columns={columns}
                  dataSource={filteredRows}
                  locale={{
                    emptyText: (
                      <Empty
                        description={`No ${activeTab} records match the current filters.`}
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
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`
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
                    Status distribution
                  </Typography.Title>
                  <Typography.Paragraph className="accounting-section-copy">
                    A quick view of where cash flow is concentrated.
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
                  <Empty
                    description="No chart data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>

              <div className="accounting-note-card">
                <CalendarOutlined />
                <div>
                  <strong>Review cadence</strong>
                  <span>Use the date range filter to review period-end collections and vendor settlement trends.</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  );
}
