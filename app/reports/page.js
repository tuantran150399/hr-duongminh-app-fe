'use client';

import {
  Alert, Button, Card, Col, Row, Table, Tabs,
  Typography, DatePicker, Select, App
} from 'antd';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetBranchSummaryQuery,
  useGetCustomerSummaryQuery,
  useGetPnlQuery,
  useGetCashFlowQuery,
  useGetJobStatusSummaryQuery,
  useGetReceivablesQuery,
  useGetPayablesQuery,
  useGetOverdueReceivablesQuery,
  useGetOverduePayablesQuery
} from '@/store/services/reportsApi';
import { useGetBranchesQuery } from '@/store/services/adminExtApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import api from '@/services/api';

const { RangePicker } = DatePicker;

// Export remains a direct API call (blob download can't go through RTK Query easily)
async function exportReport(reportKey, params) {
  const response = await api.get(`/reports/${reportKey}/export`, {
    params,
    responseType: 'blob'
  });
  return {
    blob: response.data,
    fileName: response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/^"|"$/g, '') || `${reportKey}.xlsx`
  };
}

// Map tab → RTK query hook selector key
const REPORT_QUERY_MAP = {
  'branch-summary': 'branchSummary',
  'customer-summary': 'customerSummary',
  'pnl': 'pnl',
  'cash-flow': 'cashFlow',
  'job-status': 'jobStatus',
  'receivables': 'receivables',
  'payables': 'payables',
  'overdue-receivables': 'overdueReceivables',
  'overdue-payables': 'overduePayables'
};

const DEBT_REPORT_KEYS = new Set(['receivables', 'payables', 'overdue-receivables', 'overdue-payables']);

function normalizeItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('branch-summary');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const params = {};
  if (dateRange[0] && dateRange[1]) {
    params.dateFrom = dateRange[0].format('YYYY-MM-DD');
    params.dateTo = dateRange[1].format('YYYY-MM-DD');
  }
  if (selectedJobId) {
    params.jobId = selectedJobId;
  }
  const isDebtReport = DEBT_REPORT_KEYS.has(activeTab);
  const isMissingRequiredJob = isDebtReport && !selectedJobId;
  const skipDebtReport = !selectedJobId;

  // All reports are fetched but only the active one is used/shown
  const branchSummary = useGetBranchSummaryQuery(params);
  const customerSummary = useGetCustomerSummaryQuery(params);
  const pnl = useGetPnlQuery(params);
  const cashFlow = useGetCashFlowQuery(params);
  const jobStatus = useGetJobStatusSummaryQuery(params);
  const receivables = useGetReceivablesQuery(params, { skip: skipDebtReport });
  const payables = useGetPayablesQuery(params, { skip: skipDebtReport });
  const overdueReceivables = useGetOverdueReceivablesQuery(params, { skip: skipDebtReport });
  const overduePayables = useGetOverduePayablesQuery(params, { skip: skipDebtReport });

  const queryMap = {
    'branch-summary': branchSummary,
    'customer-summary': customerSummary,
    'pnl': pnl,
    'cash-flow': cashFlow,
    'job-status': jobStatus,
    'receivables': receivables,
    'payables': payables,
    'overdue-receivables': overdueReceivables,
    'overdue-payables': overduePayables
  };

  const activeQuery = queryMap[activeTab] || {};
  const { isLoading, error } = activeQuery;
  const data = isMissingRequiredJob ? [] : normalizeItems(activeQuery.data);

  // Lookup data for ID-to-name mapping
  const { data: branchesRaw = [] } = useGetBranchesQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const { data: jobsData } = useGetJobsQuery();

  const branches = useMemo(() => (Array.isArray(branchesRaw) ? branchesRaw : branchesRaw?.items || []), [branchesRaw]);
  const partners = useMemo(() => partnersData?.items || [], [partnersData]);
  const jobs = useMemo(() => jobsData?.items || [], [jobsData]);

  const branchMap = useMemo(() => branches.reduce((m, b) => ({ ...m, [b.backendId]: b }), {}), [branches]);
  const partnerMap = useMemo(() => partners.reduce((m, p) => ({ ...m, [p.backendId]: p }), {}), [partners]);
  const jobMap = useMemo(() => jobs.reduce((m, j) => ({ ...m, [j.backendId]: j }), {}), [jobs]);
  const jobOptions = useMemo(
    () => jobs.map((job) => ({
      value: job.backendId,
      label: `${job.job_no || job.raw?.jobCode || job.id} - ${job.customer || ''}`
    })),
    [jobs]
  );

  async function handleExport() {
    if (isMissingRequiredJob) {
      message.warning(t('reports.jobRequiredForDebt'));
      return;
    }

    try {
      const reportKey = activeTab === 'job-status' ? 'job-status-summary' : activeTab;
      const { blob, fileName } = await exportReport(reportKey, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decodeURIComponent(fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success(t('reports.exportStarted'));
    } catch (err) {
      message.error(getApiError(err, t, 'reports.exportError'));
    }
  }

  const columnsMap = {
    'branch-summary': [
      { title: t('reports.branchId'), dataIndex: 'branchId', key: 'branchId', render: (id) => branchMap[id]?.name || id },
      { title: t('reports.totalRevenue'), dataIndex: 'totalRevenue', key: 'totalRevenue', render: v => formatCurrency(v) },
      { title: t('reports.totalCost'), dataIndex: 'totalCost', key: 'totalCost', render: v => formatCurrency(v) },
      { title: t('reports.profit'), dataIndex: 'profit', key: 'profit', render: v => formatCurrency(v) }
    ],
    'customer-summary': [
      { title: t('reports.customerId'), dataIndex: 'partnerId', key: 'partnerId', render: (id) => partnerMap[id]?.name || id },
      { title: t('reports.totalRevenue'), dataIndex: 'totalRevenue', key: 'totalRevenue', render: v => formatCurrency(v) },
      { title: t('reports.totalCost'), dataIndex: 'totalCost', key: 'totalCost', render: v => formatCurrency(v) },
      { title: t('reports.profit'), dataIndex: 'profit', key: 'profit', render: v => formatCurrency(v) }
    ],
    'job-status': [
      { title: t('reports.status'), dataIndex: 'status', key: 'status' },
      { title: t('reports.count'), dataIndex: 'count', key: 'count' }
    ],
    'receivables': [
      { title: t('reports.paymentStatus'), dataIndex: 'paymentStatus', key: 'paymentStatus' },
      { title: t('reports.entryCount'), dataIndex: 'count', key: 'count' },
      { title: t('reports.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount', render: v => formatCurrency(v) }
    ],
    'payables': [
      { title: t('reports.paymentStatus'), dataIndex: 'paymentStatus', key: 'paymentStatus' },
      { title: t('reports.entryCount'), dataIndex: 'count', key: 'count' },
      { title: t('reports.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount', render: v => formatCurrency(v) }
    ],
    'overdue-receivables': [
      { title: t('reports.entryId'), dataIndex: 'id', key: 'id' },
      { title: t('reports.jobId'), dataIndex: 'jobId', key: 'jobId', render: (id) => jobMap[id]?.job_no || id },
      { title: t('reports.amount'), dataIndex: 'localAmount', key: 'localAmount', render: v => formatCurrency(v) },
      { title: t('reports.dueDate'), dataIndex: 'dueDate', key: 'dueDate' }
    ],
    'overdue-payables': [
      { title: t('reports.entryId'), dataIndex: 'id', key: 'id' },
      { title: t('reports.jobId'), dataIndex: 'jobId', key: 'jobId', render: (id) => jobMap[id]?.job_no || id },
      { title: t('reports.amount'), dataIndex: 'localAmount', key: 'localAmount', render: v => formatCurrency(v) },
      { title: t('reports.dueDate'), dataIndex: 'dueDate', key: 'dueDate' }
    ],
    'pnl': [
      { title: t('reports.period'), dataIndex: 'period', key: 'period' },
      { title: t('reports.revenue'), dataIndex: 'totalRevenue', key: 'totalRevenue', render: v => formatCurrency(v) },
      { title: t('reports.cost'), dataIndex: 'totalCost', key: 'totalCost', render: v => formatCurrency(v) },
      { title: t('reports.netProfit'), dataIndex: 'profit', key: 'profit', render: v => formatCurrency(v) }
    ],
    'cash-flow': [
      { title: t('reports.period'), dataIndex: 'period', key: 'period' },
      { title: t('reports.totalInflow'), dataIndex: 'cashIn', key: 'cashIn', render: v => formatCurrency(v) },
      { title: t('reports.totalOutflow'), dataIndex: 'cashOut', key: 'cashOut', render: v => formatCurrency(v) },
      { title: t('reports.netCashFlow'), dataIndex: 'netCashFlow', key: 'netCashFlow', render: v => formatCurrency(v) }
    ]
  };

  const tabItems = [
    { key: 'branch-summary', label: t('reports.branchSummary') },
    { key: 'customer-summary', label: t('reports.customerSummary') },
    { key: 'job-status', label: t('reports.jobStatus') },
    { key: 'receivables', label: t('reports.receivables') },
    { key: 'payables', label: t('reports.payables') },
    { key: 'overdue-receivables', label: t('reports.overdueReceivables') },
    { key: 'overdue-payables', label: t('reports.overduePayables') },
    { key: 'pnl', label: t('reports.pnl') },
    { key: 'cash-flow', label: t('reports.cashFlow') }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('reports.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('reports.subtitle')}
          </Typography.Paragraph>
        </div>
        <div className="page-actions">
          <Button onClick={handleExport}>{t('reports.exportExcel')}</Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={12}>
            <div className="report-filter-row">
              <span className="report-filter-label">{t('reports.dateRange')}:</span>
              <RangePicker value={dateRange} onChange={(val) => setDateRange(val || [null, null])} style={{ width: '100%', maxWidth: 360 }} />
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="report-filter-row">
              <span className="report-filter-label">{t('reports.jobNo')}:</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={selectedJobId}
                onChange={setSelectedJobId}
                options={jobOptions}
                placeholder={t('reports.selectJob')}
                style={{ width: '100%', maxWidth: 420 }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {isMissingRequiredJob && (
        <Alert
          type="warning"
          showIcon
          message={t('reports.jobRequiredForDebt')}
          style={{ marginBottom: 16 }}
        />
      )}

      {error && <Alert type="error" showIcon message={t('reports.loadError')} style={{ marginBottom: 16 }} />}

      <Card className="table-card">
        <Tabs className="responsive-tabs" activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          rowKey={(record, i) => record.id || record.branchId || record.partnerId || record.period || record.status || i}
          loading={isLoading}
          columns={columnsMap[activeTab] || []}
          dataSource={data}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </DashboardLayout>
  );
}
