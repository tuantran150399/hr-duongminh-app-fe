'use client';

import { Alert, Empty, Skeleton, Tooltip } from 'antd';
import { ArrowUpOutlined, BarChartOutlined, ContainerOutlined } from '@ant-design/icons';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery
} from '@/store/services/dashboardApi';
import { useLanguage } from '@/components/AppProviders';
import { formatCurrency } from '@/utils/format';
import styles from './page.module.css';

function formatPeriod(period, t) {
  if (!/^\d{4}-\d{2}$/.test(period || '')) return period || '-';
  const [year, month] = period.split('-');
  return t('dashboard.monthYear', { month: Number(month), year });
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}K`;
  return String(amount);
}

function RevenueChart({ data, t, title, noDataLabel }) {
  const entries = (Array.isArray(data?.data) ? data.data : [])
    .map((entry) => ({
      period: entry.period,
      amount: Number(entry.totalAmount || 0),
      count: Number(entry.count || 0)
    }))
    .filter((entry) => Number.isFinite(entry.amount))
    .slice(-12);

  const maxAmount = Math.max(...entries.map((entry) => entry.amount), 1);

  return (
    <section className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <div>
          <span className={styles.sectionLabel}>{title}</span>
          <h2>{t('dashboard.monthlyRevenueTrend')}</h2>
        </div>
        <div className={styles.chartLegend}>
          <span />
          {t('dashboard.recordedRevenue')}
        </div>
      </div>

      {entries.length ? (
        <div className={styles.chartBody}>
          <div className={styles.axisLabels}>
            <span>{formatCompactCurrency(maxAmount)}</span>
            <span>{formatCompactCurrency(maxAmount / 2)}</span>
            <span>0</span>
          </div>
          <div className={styles.plot}>
            <div className={styles.gridLines} aria-hidden="true"><i /><i /><i /></div>
            <div className={styles.bars}>
              {entries.map((entry, index) => (
                <Tooltip
                  key={`${entry.period}-${index}`}
                  title={(
                    <div>
                      <strong>{formatPeriod(entry.period, t)}</strong>
                      <div>{formatCurrency(entry.amount)}</div>
                      <div>{t('dashboard.entryCount', { count: entry.count })}</div>
                    </div>
                  )}
                >
                  <div className={styles.barColumn}>
                    <span className={styles.barValue}>{formatCompactCurrency(entry.amount)}</span>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.max((entry.amount / maxAmount) * 100, 3)}%` }}
                    />
                    <span className={styles.period}>{formatPeriod(entry.period, t)}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Empty className={styles.emptyChart} description={noDataLabel} />
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();
  const { data: revenueChart, isLoading: chartLoading } = useGetRevenueChartQuery();

  return (
    <DashboardLayout>
      <main className={styles.dashboard}>
        <header className={styles.heading}>
          <div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.subtitle')}</p>
          </div>
          <div className={styles.liveStatus}><span />{t('dashboard.liveData')}</div>
        </header>

        {error ? <Alert type="error" showIcon message={t('dashboard.loadError')} /> : null}

        {isLoading ? (
          <div className={styles.summaryGrid}><Skeleton active /><Skeleton active /></div>
        ) : stats ? (
          <section className={styles.summaryGrid}>
            <article className={`${styles.metricCard} ${styles.jobsCard}`}>
              <div className={styles.metricIcon}><ContainerOutlined /></div>
              <div>
                <span className={styles.metricLabel}>{t('dashboard.totalJobs')}</span>
                <strong className={styles.metricValue}>{Number(stats.totalJobs || 0).toLocaleString()}</strong>
                <p>{t('dashboard.allShipments')}</p>
              </div>
            </article>

            <article className={`${styles.metricCard} ${styles.revenueCard}`}>
              <div className={styles.metricIcon}><BarChartOutlined /></div>
              <div className={styles.revenueContent}>
                <span className={styles.metricLabel}>{t('dashboard.totalRevenue')}</span>
                <strong className={styles.metricValue}>{formatCurrency(stats.totalRevenue)}</strong>
                <p><ArrowUpOutlined /> {t('dashboard.recordedRevenue')}</p>
              </div>
            </article>
          </section>
        ) : null}

        {chartLoading ? (
          <section className={styles.chartPanel}><Skeleton active paragraph={{ rows: 8 }} /></section>
        ) : (
          <RevenueChart
            data={revenueChart}
            t={t}
            title={t('dashboard.totalRevenue')}
            noDataLabel={t('accounting.chart.noData')}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
