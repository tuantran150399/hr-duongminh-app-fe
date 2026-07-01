'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Progress,
  Row,
  Statistic,
  Table,
  Typography
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import PageHeader from '@/components/PageHeader';
import StatusTag from '@/components/StatusTag';
import {
  useGetDebtSummaryQuery,
  useGetDebtCustomersQuery,
  useGetDebtItemsByCustomerQuery
} from '@/store/services/debtsApi';
import { formatCurrency, formatDate } from '@/utils/format';

export default function DebtsPage() {
  const { t, language } = useLanguage();

  const [statusFilter, setStatusFilter] = useState('all');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Queries
  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useGetDebtSummaryQuery();
  const { data: customersData, isLoading: customersLoading, error: customersError, refetch: refetchCustomers } = useGetDebtCustomersQuery({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const { data: detailData, isLoading: detailLoading, isFetching: detailFetching } = useGetDebtItemsByCustomerQuery(selectedCustomerId, { skip: !selectedCustomerId });

  const summary = useMemo(() => summaryData || {}, [summaryData]);
  const customers = useMemo(() => customersData?.items || [], [customersData]);
  const details = useMemo(() => detailData?.items || [], [detailData]);
  const debtStatusLabels = {
    normal: t('debts.statusNormal'),
    near_limit: t('debts.statusNearLimit'),
    over_limit: t('debts.statusOverLimit'),
    overdue: t('debts.statusOverdue')
  };

  // Table columns (Customers)
  const customerColumns = [
    { title: t('debts.customerName'), dataIndex: 'name', key: 'name', width: 250 },
    {
      title: t('debts.currentDebt'),
      dataIndex: 'currentDebt',
      key: 'currentDebt',
      align: 'right',
      render: (v) => <strong>{formatCurrency(v)}</strong>
    },
    {
      title: t('debts.creditLimit'),
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      align: 'right',
      render: (v) => formatCurrency(v)
    },
    {
      title: t('debts.usagePercent'),
      dataIndex: 'usagePercent',
      key: 'usagePercent',
      align: 'right',
      render: (v) => {
        if (v === null || v === undefined) return '-';
        let color = 'inherit';
        if (v >= 100) color = '#cf1322'; // error
        else if (v >= 80) color = '#d46b08'; // warning
        else color = '#389e0d'; // success
        return <span style={{ color, fontWeight: 500 }}>{v.toFixed(1)}%</span>;
      }
    },
    {
      title: t('debts.status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (v) => (
        <StatusTag
          value={debtStatusLabels[v] || v}
          colorMap={{
            [t('debts.statusNormal')]: 'success',
            [t('debts.statusNearLimit')]: 'gold',
            [t('debts.statusOverLimit')]: 'error',
            [t('debts.statusOverdue')]: 'magenta'
          }}
        />
      )
    }
  ];

  // Table columns (Items Detail)
  const detailColumns = [
    {
      title: t('debts.itemType'),
      dataIndex: 'itemType',
      key: 'itemType',
      render: (v) => v === 'DEBIT_NOTE' ? t('debts.debitNote') : t('debts.receivable')
    },
    { title: t('debts.invoiceCode'), dataIndex: 'invoiceCode', key: 'invoiceCode' },
    { title: t('debts.jobCode'), dataIndex: 'jobCode', key: 'jobCode' },
    { title: t('debts.description'), dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: t('debts.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v) => <strong>{formatCurrency(v)}</strong>
    },
    {
      title: t('debts.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (v) => formatDate(v, language)
    },
    {
      title: t('debts.isOverdue'),
      dataIndex: 'isOverdue',
      key: 'isOverdue',
      align: 'center',
      render: (v) => (
        <StatusTag
          value={v ? t('debts.statusOverdue') : t('debts.statusNormal')}
          colorMap={{
            [t('debts.statusOverdue')]: 'magenta',
            [t('debts.statusNormal')]: 'success'
          }}
        />
      )
    }
  ];

  // Stats calculation
  const usageRatio = summary.totalLimit > 0 ? (summary.totalDebt / summary.totalLimit) * 100 : 0;

  return (
    <DashboardLayout>
      <PageHeader
        title={t('debts.title')}
        subtitle={t('debts.subtitle')}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => { refetchSummary(); refetchCustomers(); setStatusFilter('all'); }}>
            {t('common.resetFilters')}
          </Button>
        }
      />

      <FilterCard
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all', label: t('common.allStatuses') },
          { value: 'normal', label: t('debts.statusNormal') },
          { value: 'near_limit', label: t('debts.statusNearLimit') },
          { value: 'over_limit', label: t('debts.statusOverLimit') },
          { value: 'overdue', label: t('debts.statusOverdue') }
        ]}
        showDateRange={false}
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder=" "
      />

      {(summaryError || customersError) && (
        <Alert type="error" showIcon message={t('debts.loadError')} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
        <Col xs={24} md={18}>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card size="small" loading={summaryLoading}>
                <Statistic title={t('debts.totalDebt')} value={summary.totalDebt} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#cf1322' }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={summaryLoading}>
                <Statistic title={t('debts.totalLimit')} value={summary.totalLimit} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#096dd9' }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={summaryLoading}>
                <Statistic title={t('debts.remainingLimit')} value={summary.remainingLimit} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#389e0d' }} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small" loading={summaryLoading}>
                <Statistic title={t('debts.overdueDebt')} value={summary.overdueDebt} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#eb2f96' }} />
              </Card>
            </Col>
          </Row>
        </Col>
        <Col xs={24} md={6} style={{ textAlign: 'center' }}>
          <Progress type="dashboard" percent={Number(usageRatio.toFixed(1))} />
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {t('debts.usagePercent')}
          </Typography.Paragraph>
        </Col>
      </Row>

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={customersLoading}
          columns={customerColumns}
          dataSource={customers}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedCustomerId(record.backendId);
              setDetailDrawerOpen(true);
            },
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <Drawer
        title={t('debts.detailDrawerTitle')}
        placement="right"
        width={700}
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
        destroyOnClose
      >
        <Table
          rowKey="backendId"
          loading={detailLoading || detailFetching}
          columns={detailColumns}
          dataSource={details}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />
      </Drawer>
    </DashboardLayout>
  );
}
