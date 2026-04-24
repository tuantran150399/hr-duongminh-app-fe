'use client';

import { Card, Table, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getAccountingCost, getAccountingRevenue } from '@/services/accountingService';
import { formatCurrency } from '@/utils/format';

const columns = [
  { title: 'Job No', dataIndex: 'job_no', key: 'job_no' },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (value) => formatCurrency(value)
  },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Date', dataIndex: 'date', key: 'date' }
];

export default function AccountingPage() {
  const [revenue, setRevenue] = useState([]);
  const [cost, setCost] = useState([]);
  const [revenuePagination, setRevenuePagination] = useState({ pageSize: 10 });
  const [costPagination, setCostPagination] = useState({ pageSize: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([getAccountingRevenue(), getAccountingCost()])
      .then(([revenueResult, costResult]) => {
        if (!active) return;
        setRevenue(revenueResult.items || []);
        setCost(costResult.items || []);
        if (revenueResult.meta) {
          setRevenuePagination({
            current: revenueResult.meta.page,
            pageSize: revenueResult.meta.limit,
            total: revenueResult.meta.total
          });
        }
        if (costResult.meta) {
          setCostPagination({
            current: costResult.meta.page,
            pageSize: costResult.meta.limit,
            total: costResult.meta.total
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <h1 className="page-title">Accounting</h1>
      <Card>
        <Tabs
          items={[
            {
              key: 'revenue',
              label: 'Revenue',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={columns}
                  dataSource={revenue}
                  pagination={revenuePagination.total ? revenuePagination : { pageSize: 10 }}
                />
              )
            },
            {
              key: 'cost',
              label: 'Cost',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={columns}
                  dataSource={cost}
                  pagination={costPagination.total ? costPagination : { pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
