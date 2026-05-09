'use client';

import { Alert, Card, Col, Row, Spin } from 'antd';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useGetDashboardStatsQuery } from '@/store/services/dashboardApi';
import { formatCurrency } from '@/utils/format';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();

  return (
    <DashboardLayout>
      <h1 className="page-title">Dashboard</h1>
      {isLoading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" showIcon message="Unable to load dashboard data from the backend." />
      ) : stats ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card title="Total Jobs">
              <p className="summary-number">{stats.totalJobs}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title="Total Revenue">
              <p className="summary-number">{formatCurrency(stats.totalRevenue)}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title="Total Cost">
              <p className="summary-number">{formatCurrency(stats.totalCost)}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title="Profit">
              <p className="summary-number">{formatCurrency(stats.profit)}</p>
            </Card>
          </Col>
        </Row>
      ) : null}
    </DashboardLayout>
  );
}
