'use client';

import { Suspense, useEffect, useState } from 'react';
import { Card, Col, Descriptions, Empty, Row, Spin, Table, Tag } from 'antd';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getJobById } from '@/services/jobService';
import { formatCurrency, sumAmounts } from '@/utils/format';

const moneyColumns = [
  { title: 'Description', dataIndex: 'description', key: 'description' },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (value) => formatCurrency(value)
  },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Date', dataIndex: 'date', key: 'date' }
];

function JobDetailContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(Boolean(jobId));

  useEffect(() => {
    let active = true;

    if (!jobId) {
      return () => {
        active = false;
      };
    }

    getJobById(jobId)
      .then((data) => {
        if (active) setJob(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  if (loading) {
    return (
      <DashboardLayout>
        <Spin />
      </DashboardLayout>
    );
  }

  if (!jobId || !job) {
    return (
      <DashboardLayout>
        <Empty description="Job not found" />
      </DashboardLayout>
    );
  }

  const revenueTotal = sumAmounts(job.revenue);
  const costTotal = sumAmounts(job.cost);
  const profit = job.profitSummary?.profit ?? revenueTotal - costTotal;

  return (
    <DashboardLayout>
      <h1 className="page-title">{job.job_no}</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Job Info">
            <Descriptions bordered column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label="Customer">{job.customer}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={job.status === 'Completed' ? 'green' : 'blue'}>{job.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Origin">{job.origin}</Descriptions.Item>
              <Descriptions.Item label="Destination">{job.destination}</Descriptions.Item>
              <Descriptions.Item label="ETD">{job.etd || '-'}</Descriptions.Item>
              <Descriptions.Item label="ETA">{job.eta || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Profit Summary">
            <p>Revenue: {formatCurrency(job.profitSummary?.totalRevenue ?? revenueTotal)}</p>
            <p>Cost: {formatCurrency(job.profitSummary?.totalCost ?? costTotal)}</p>
            <p className="summary-number">Profit: {formatCurrency(profit)}</p>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Revenue">
            <Table rowKey="id" columns={moneyColumns} dataSource={job.revenue} pagination={false} />
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Cost">
            <Table rowKey="id" columns={moneyColumns} dataSource={job.cost} pagination={false} />
          </Card>
        </Col>
      </Row>
    </DashboardLayout>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <Spin />
        </DashboardLayout>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
