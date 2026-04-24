'use client';

import { Card, Col, Row, Spin } from 'antd';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getDashboardStats } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/format';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;

    getDashboardStats().then((data) => {
      if (active) setStats(data);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <h1 className="page-title">Dashboard</h1>
      {!stats ? (
        <Spin />
      ) : (
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
      )}
    </DashboardLayout>
  );
}
