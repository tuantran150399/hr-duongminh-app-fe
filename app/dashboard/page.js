'use client';

import { Alert, Card, Col, Row, Spin } from 'antd';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useGetDashboardStatsQuery } from '@/store/services/dashboardApi';
import { useLanguage } from '@/components/AppProviders';
import { formatCurrency } from '@/utils/format';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();

  return (
    <DashboardLayout>
      <h1 className="page-title">{t('dashboard.title')}</h1>
      {isLoading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" showIcon message={t('dashboard.loadError')} />
      ) : stats ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card title={t('dashboard.totalJobs')}>
              <p className="summary-number">{stats.totalJobs}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title={t('dashboard.totalRevenue')}>
              <p className="summary-number">{formatCurrency(stats.totalRevenue)}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title={t('dashboard.totalCost')}>
              <p className="summary-number">{formatCurrency(stats.totalCost)}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card title={t('dashboard.profit')}>
              <p className="summary-number">{formatCurrency(stats.profit)}</p>
            </Card>
          </Col>
        </Row>
      ) : null}
    </DashboardLayout>
  );
}

