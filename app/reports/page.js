'use client';

import {
  Alert, App, Button, DatePicker, Empty, Select, Skeleton, Tabs, Tooltip
} from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
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
import { formatCurrency, formatDate } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import api from '@/services/api';
import styles from './page.module.css';

const { RangePicker } = DatePicker;
const DEBT_REPORT_KEYS = new Set(['receivables', 'payables', 'overdue-receivables', 'overdue-payables']);
const CHART_COLORS = ['#0866d9', '#f0a128', '#16a16c', '#e05260', '#7456d8', '#13a8a8'];

async function exportReport(reportKey, params) {
  const response = await api.get(`/reports/${reportKey}/export`, { params, responseType: 'blob' });
  return {
    blob: response.data,
    fileName: response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/^"|"$/g, '') || `${reportKey}.xlsx`
  };
}

function normalizeItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function compactNumber(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}K`;
  return amount.toLocaleString();
}

const STATUS_TRANSLATION_KEYS = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid'
};

function statusLabel(value, t) {
  const key = STATUS_TRANSLATION_KEYS[value];
  return key ? t(`reports.statusLabels.${key}`) : String(value || '-').replaceAll('_', ' ');
}

function MetricStrip({ metrics }) {
  return (
    <div className={styles.metricStrip}>
      {metrics.map((metric) => (
        <div className={styles.metric} key={metric.label}>
          <span>{metric.label}</span>
          <strong className={metric.negative ? styles.negative : ''}>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

function GroupedBarChart({ data, labelFor, series, t }) {
  const maxValue = Math.max(
    ...data.flatMap((item) => series.map((entry) => Math.abs(Number(item[entry.key] || 0)))),
    1
  );

  return (
    <div className={styles.chartScroll}>
      <div className={styles.groupChart} style={{ minWidth: `${Math.max(720, data.length * 105)}px` }}>
        <div className={styles.grid}><i /><i /><i /><i /></div>
        {data.map((item, itemIndex) => (
          <div className={styles.chartGroup} key={`${labelFor(item)}-${itemIndex}`}>
            <div className={styles.bars}>
              {series.map((entry) => {
                const value = Number(item[entry.key] || 0);
                return (
                  <Tooltip
                    key={entry.key}
                    title={`${entry.label}: ${formatCurrency(value)}`}
                  >
                    <div className={styles.barSlot}>
                      <span>{compactNumber(value)}</span>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${Math.max((Math.abs(value) / maxValue) * 100, 2)}%`,
                          background: value < 0 ? '#e05260' : entry.color
                        }}
                      />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            <div className={styles.groupLabel}>{labelFor(item)}</div>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        {series.map((entry) => <span key={entry.key}><i style={{ background: entry.color }} />{entry.label}</span>)}
        <small>{t('reports.chartHoverHint')}</small>
      </div>
    </div>
  );
}

function DonutChart({ data, t }) {
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const stops = data.map((item, index) => {
    const previousTotal = data
      .slice(0, index)
      .reduce((sum, previousItem) => sum + Number(previousItem.count || 0), 0);
    const start = total ? (previousTotal / total) * 100 : 0;
    const end = total ? ((previousTotal + Number(item.count || 0)) / total) * 100 : 0;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <div className={styles.donutLayout}>
      <div className={styles.donut} style={{ background: `conic-gradient(${stops.join(', ')})` }}>
        <div><strong>{total}</strong><span>{t('reports.shipmentCount', { count: total })}</span></div>
      </div>
      <div className={styles.donutLegend}>
        {data.map((item, index) => (
          <div key={item.status}>
            <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span>{statusLabel(item.status, t)}</span>
            <strong>{item.count}</strong>
            <small>{total ? `${Math.round((Number(item.count) / total) * 100)}%` : '0%'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalChart({ data, labelFor, valueKey, secondaryFor }) {
  const maxValue = Math.max(...data.map((item) => Math.abs(Number(item[valueKey] || 0))), 1);

  return (
    <div className={styles.horizontalChart}>
      {data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        return (
          <Tooltip title={formatCurrency(value)} key={item.id || `${labelFor(item)}-${index}`}>
            <div className={styles.horizontalRow}>
              <div className={styles.rowHeading}>
                <span>{labelFor(item)}</span>
                <strong>{formatCurrency(value)}</strong>
              </div>
              <div className={styles.track}>
                <i style={{ width: `${Math.max((Math.abs(value) / maxValue) * 100, 2)}%` }} />
              </div>
              {secondaryFor ? <small>{secondaryFor(item)}</small> : null}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('branch-summary');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const params = {};
  if (dateRange[0] && dateRange[1]) {
    params.dateFrom = dateRange[0].format('YYYY-MM-DD');
    params.dateTo = dateRange[1].format('YYYY-MM-DD');
  }
  if (selectedJobId) params.jobId = selectedJobId;

  const isDebtReport = DEBT_REPORT_KEYS.has(activeTab);
  const isMissingRequiredJob = isDebtReport && !selectedJobId;
  const queryOptions = (key) => ({ skip: activeTab !== key || (DEBT_REPORT_KEYS.has(key) && !selectedJobId) });

  const branchSummary = useGetBranchSummaryQuery(params, queryOptions('branch-summary'));
  const customerSummary = useGetCustomerSummaryQuery(params, queryOptions('customer-summary'));
  const pnl = useGetPnlQuery(params, queryOptions('pnl'));
  const cashFlow = useGetCashFlowQuery(params, queryOptions('cash-flow'));
  const jobStatus = useGetJobStatusSummaryQuery(params, queryOptions('job-status'));
  const receivables = useGetReceivablesQuery(params, queryOptions('receivables'));
  const payables = useGetPayablesQuery(params, queryOptions('payables'));
  const overdueReceivables = useGetOverdueReceivablesQuery(params, queryOptions('overdue-receivables'));
  const overduePayables = useGetOverduePayablesQuery(params, queryOptions('overdue-payables'));

  const queryMap = {
    'branch-summary': branchSummary,
    'customer-summary': customerSummary,
    pnl,
    'cash-flow': cashFlow,
    'job-status': jobStatus,
    receivables,
    payables,
    'overdue-receivables': overdueReceivables,
    'overdue-payables': overduePayables
  };
  const activeQuery = queryMap[activeTab] || {};
  const data = isMissingRequiredJob ? [] : normalizeItems(activeQuery.data);

  const { data: branchesRaw = [] } = useGetBranchesQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const { data: jobsData } = useGetJobsQuery();
  const branches = useMemo(() => (Array.isArray(branchesRaw) ? branchesRaw : branchesRaw?.items || []), [branchesRaw]);
  const partners = useMemo(() => partnersData?.items || [], [partnersData]);
  const jobs = useMemo(() => jobsData?.items || [], [jobsData]);
  const branchMap = useMemo(() => Object.fromEntries(branches.map((item) => [item.backendId, item])), [branches]);
  const partnerMap = useMemo(() => Object.fromEntries(partners.map((item) => [item.backendId, item])), [partners]);
  const jobMap = useMemo(() => Object.fromEntries(jobs.map((item) => [item.backendId, item])), [jobs]);
  const jobOptions = useMemo(() => jobs.map((job) => ({
    value: job.backendId,
    label: `${job.job_no || job.raw?.jobCode || job.id} - ${job.customer || ''}`
  })), [jobs]);

  const labels = {
    revenue: t('reports.totalRevenue'), cost: t('reports.totalCost'), profit: t('reports.profit'),
    cashIn: t('reports.totalInflow'), cashOut: t('reports.totalOutflow'), netCash: t('reports.netCashFlow')
  };

  const financialSeries = [
    { key: 'totalRevenue', label: labels.revenue, color: '#0866d9' },
    { key: 'totalCost', label: labels.cost, color: '#f0a128' },
    { key: 'profit', label: labels.profit, color: '#16a16c' }
  ];
  const cashSeries = [
    { key: 'cashIn', label: labels.cashIn, color: '#0866d9' },
    { key: 'cashOut', label: labels.cashOut, color: '#f0a128' },
    { key: 'netCashFlow', label: labels.netCash, color: '#16a16c' }
  ];

  function sum(key) {
    return data.reduce((total, item) => total + Number(item[key] || 0), 0);
  }

  function getMetrics() {
    if (['branch-summary', 'customer-summary', 'pnl'].includes(activeTab)) {
      const profit = sum('profit');
      return [
        { label: labels.revenue, value: formatCurrency(sum('totalRevenue')) },
        { label: labels.cost, value: formatCurrency(sum('totalCost')) },
        { label: labels.profit, value: formatCurrency(profit), negative: profit < 0 }
      ];
    }
    if (activeTab === 'cash-flow') {
      const net = sum('netCashFlow');
      return [
        { label: labels.cashIn, value: formatCurrency(sum('cashIn')) },
        { label: labels.cashOut, value: formatCurrency(sum('cashOut')) },
        { label: labels.netCash, value: formatCurrency(net), negative: net < 0 }
      ];
    }
    if (activeTab === 'job-status') {
      return [{ label: t('reports.count'), value: sum('count').toLocaleString() }];
    }
    return [
      { label: t('reports.totalAmount'), value: formatCurrency(sum(activeTab.startsWith('overdue') ? 'localAmount' : 'totalAmount')) },
      { label: t('reports.entryCount'), value: (activeTab.startsWith('overdue') ? data.length : sum('count')).toLocaleString() }
    ];
  }

  function renderChart() {
    if (!data.length) return <Empty className={styles.empty} description={t('accounting.chart.noData')} />;
    if (activeTab === 'branch-summary') {
      return <GroupedBarChart data={data} labelFor={(item) => branchMap[item.branchId]?.name || item.branchId} series={financialSeries} t={t} />;
    }
    if (activeTab === 'customer-summary') {
      return <GroupedBarChart data={data} labelFor={(item) => partnerMap[item.partnerId]?.name || item.partnerId} series={financialSeries} t={t} />;
    }
    if (activeTab === 'pnl') {
      return <GroupedBarChart data={data} labelFor={(item) => item.period} series={financialSeries} t={t} />;
    }
    if (activeTab === 'cash-flow') {
      return <GroupedBarChart data={data} labelFor={(item) => item.period} series={cashSeries} t={t} />;
    }
    if (activeTab === 'job-status') return <DonutChart data={data} t={t} />;
    if (['receivables', 'payables'].includes(activeTab)) {
      return <HorizontalChart data={data} valueKey="totalAmount" labelFor={(item) => statusLabel(item.paymentStatus, t)} secondaryFor={(item) => t('reports.entriesCount', { count: item.count })} />;
    }
    return (
      <HorizontalChart
        data={data}
        valueKey="localAmount"
        labelFor={(item) => jobMap[item.jobId]?.job_no || `#${item.jobId}`}
        secondaryFor={(item) => t('reports.dueDateValue', { date: formatDate(item.dueDate, language) })}
      />
    );
  }

  async function handleExport() {
    if (isMissingRequiredJob) return message.warning(t('reports.jobRequiredForDebt'));
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

  const tabItems = [
    ['branch-summary', t('reports.branchSummary')], ['customer-summary', t('reports.customerSummary')],
    ['job-status', t('reports.jobStatus')], ['receivables', t('reports.receivables')],
    ['payables', t('reports.payables')], ['overdue-receivables', t('reports.overdueReceivables')],
    ['overdue-payables', t('reports.overduePayables')], ['pnl', t('reports.pnl')],
    ['cash-flow', t('reports.cashFlow')]
  ].map(([key, label]) => ({ key, label }));

  return (
    <DashboardLayout>
      <main className={styles.reports}>
        <header className={styles.header}>
          <div><h1>{t('reports.title')}</h1><p>{t('reports.subtitle')}</p></div>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>{t('reports.exportExcel')}</Button>
        </header>

        <section className={styles.filters}>
          <div className={styles.filterTitle}><FilterOutlined /><span>{t('reports.filters')}</span></div>
          <div className={styles.filterControl}>
            <label>{t('reports.dateRange')}</label>
            <RangePicker value={dateRange} onChange={(value) => setDateRange(value || [null, null])} />
          </div>
          <div className={styles.filterControl}>
            <label>{t('reports.jobNo')}</label>
            <Select allowClear showSearch optionFilterProp="label" value={selectedJobId} onChange={setSelectedJobId} options={jobOptions} placeholder={t('reports.selectJob')} />
          </div>
        </section>

        {isMissingRequiredJob ? <Alert type="warning" showIcon message={t('reports.jobRequiredForDebt')} /> : null}
        {activeQuery.error ? <Alert type="error" showIcon message={t('reports.loadError')} /> : null}

        <section className={styles.reportPanel}>
          <Tabs className={styles.tabs} activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          {activeQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : isMissingRequiredJob ? null : (
            <>
              <MetricStrip metrics={getMetrics()} />
              <div className={styles.chartTitle}>
                <div><span>{t('reports.dataVisualization')}</span><h2>{tabItems.find((item) => item.key === activeTab)?.label}</h2></div>
                <small>{dateRange[0] && dateRange[1] ? `${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}` : t('reports.allTime')}</small>
              </div>
              <div className={styles.chartCanvas}>{renderChart()}</div>
            </>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
