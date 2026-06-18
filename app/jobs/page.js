'use client';

import {
  Alert,
  Button,
  Card,
  Empty,
  Table,
  Typography,
  App,
  Tag
} from 'antd';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import StatusTag from '@/components/StatusTag';
import FilterCard from '@/components/FilterCard';
import { useLanguage } from '@/components/AppProviders';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { getJobStatusOptions } from '@/config/jobConstants';

function formatDisplayDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadJobsCsv(rows, t) {
  const jobStatusOptions = getJobStatusOptions(t);
  const headers = [
    t('jobs.jobNo'), t('jobs.customer'), t('jobs.status'),
    t('jobs.origin'), t('jobs.destination'),
    t('jobs.etd'), t('jobs.eta'),
    t('jobs.shipper'), t('jobs.consignee'), t('jobs.agent'),
    t('jobs.cargoType'), t('jobs.container'), t('jobs.coType')
  ];

  const records = rows.map((job) => [
    job.job_no, job.customer, (jobStatusOptions.find(o => o.value === job.raw?.status)?.label || job.status),
    job.origin, job.destination,
    formatDisplayDate(job.etd), formatDisplayDate(job.eta),
    job.raw?.shipperName || job.raw?.shipper || '',
    job.raw?.consigneeName || job.raw?.consignee || '',
    job.raw?.agentName || job.raw?.agent || '',
    job.raw?.cargoType || '',
    job.raw?.containerNo || job.raw?.container || '',
    job.raw?.coType || ''
  ]);

  const csv = [headers, ...records]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `jobs-${stamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function ExpandedRow({ record, t }) {
  const router = useRouter();
  const raw = record.raw || {};

  return (
    <div className="expanded-row-detail">
      <div className="detail-grid">
        <div>
          <span className="detail-label">{t('jobs.shipper')}</span>
          <span className="detail-value">{raw.shipperName || raw.shipper || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.consignee')}</span>
          <span className="detail-value">{raw.consigneeName || raw.consignee || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.agent')}</span>
          <span className="detail-value">{raw.agentName || raw.agent || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.cargoType')}</span>
          <span className="detail-value">{raw.cargoType || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.origin')}</span>
          <span className="detail-value">{record.origin || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.destination')}</span>
          <span className="detail-value">{record.destination || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.container')}</span>
          <span className="detail-value detail-mono">{raw.containerNo || raw.container || '-'}</span>
        </div>
        <div>
          <span className="detail-label">{t('jobs.coType')}</span>
          <span className="detail-value">{raw.coType || '-'}</span>
        </div>
      </div>
      <div className="detail-actions">
        <Button
          size="small"
          onClick={() => router.push(`/jobs/detail?id=${record.backendId || record.id}`)}
        >
          {t('jobs.detail')}
        </Button>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const allColumnKeys = ['job_no', 'customer', 'status', 'origin', 'destination', 'etd', 'eta'];
  const [visibleColumns, setVisibleColumns] = useState(allColumnKeys);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    if (!settingsOpen) return;
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const { data: jobsData, isLoading: jobsLoading, error: jobsError, refetch } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();

  const partnersById = useMemo(() => {
    const partners = partnersData?.items || [];
    return partners.reduce((result, partner) => {
      if (partner) result[partner.backendId] = partner;
      return result;
    }, {});
  }, [partnersData]);

  const jobs = useMemo(() => {
    // jobsData.items đã được normalizeJob() trong transformResponse của jobsApi.
    // Không gọi normalizeJob() lần 2 để tránh mất jobCode (job.jobCode sẽ undefined trên object đã normalize).
    // Chỉ bổ sung tên khách hàng từ partnersById nếu cần.
    const rawItems = jobsData?.items || [];
    return rawItems.map((job) => {
      if (!job) return null;
      const partnerName = job.partnerId != null
        ? (partnersById[job.partnerId]?.name || job.customer)
        : job.customer;
      return { ...job, customer: partnerName };
    }).filter(Boolean);
  }, [jobsData, partnersById]);

  const jobStatusOptions = useMemo(() => getJobStatusOptions(t), [t]);

  const statusOptions = useMemo(
    () => {
      const rawStatuses = Array.from(new Set(jobs.map((item) => item.raw?.status).filter(Boolean)));
      return [
        { value: 'all', label: t('jobs.allStatuses') },
        ...rawStatuses.map((rawStatus) => {
          const opt = jobStatusOptions.find(o => o.value === rawStatus);
          return { value: rawStatus, label: opt ? opt.label : rawStatus };
        })
      ];
    },
    [jobs, jobStatusOptions, t]
  );

  const filteredJobs = jobs.filter((job) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      job.job_no?.toLowerCase().includes(query) ||
      job.customer?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || job.raw?.status === statusFilter;

    let matchesDate = true;
    if (dateRange?.length === 2) {
      const value = job.etd || job.eta || job.raw?.createdAt;
      const recordDate = value ? new Date(value) : null;
      if (!recordDate || Number.isNaN(recordDate.getTime())) {
        matchesDate = false;
      } else {
        const startDate = dateRange[0].toDate();
        const endDate = dateRange[1].toDate();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = recordDate >= startDate && recordDate <= endDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const columnLabelMap = {
    job_no: t('jobs.jobNo'),
    customer: t('jobs.customer'),
    status: t('jobs.status'),
    origin: t('jobs.origin'),
    destination: t('jobs.destination'),
    etd: t('jobs.etd'),
    eta: t('jobs.eta')
  };

  const allColumnsDefinition = [
    {
      title: t('jobs.jobNo'),
      dataIndex: 'job_no',
      key: 'job_no',
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no)),
      render: (value) => <span style={{ fontWeight: 600, color: '#0057c2' }}>{value || '-'}</span>
    },
    { title: t('jobs.customer'), dataIndex: 'customer', key: 'customer', sorter: (a, b) => String(a.customer).localeCompare(String(b.customer)) },
    { 
      title: t('jobs.status'), 
      dataIndex: ['raw', 'status'], 
      key: 'status', 
      render: (rawStatus, record) => {
        const opt = jobStatusOptions.find(o => o.value === rawStatus.toUpperCase());
        const label = opt ? opt.label : (record.status || '-');
        const color = { DRAFT: 'default', IN_PROGRESS: 'green', CLOSED: 'black', CANCELLED: 'red' }[rawStatus.toUpperCase()] || 'default';
        return <Tag color={color}>{label}</Tag>;
      } 
    },
    { title: t('jobs.origin'), dataIndex: 'origin', key: 'origin' },
    { title: t('jobs.destination'), dataIndex: 'destination', key: 'destination' },
    { title: t('jobs.etd'), dataIndex: 'etd', key: 'etd', render: formatDisplayDate },
    { title: t('jobs.eta'), dataIndex: 'eta', key: 'eta', render: formatDisplayDate }
  ];

  const columns = allColumnsDefinition.filter((col) => visibleColumns.includes(col.key));

  function toggleColumn(key) {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const errorMessage = jobsError ? t('jobs.loadError') : '';

  function handleReset() {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(null);
  }

  function handleExport() {
    if (!filteredJobs.length) {
      message.warning(t('jobs.noJobsToExport'));
      return;
    }
    downloadJobsCsv(filteredJobs, t);
    message.success(`${t('jobs.export')}: ${filteredJobs.length}`);
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('jobs.title')}
        subtitle={t('jobs.subtitle')}
        actions={
          <div className="page-actions">
            <Button icon={<DownloadOutlined />} onClick={handleExport}>{t('jobs.export')}</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/jobs/create')}>
              {t('jobs.createJob')}
            </Button>
          </div>
        }
      />

      <FilterCard
        searchValue={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        searchPlaceholder={t('jobs.searchPlaceholder')}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onReset={handleReset}
      />

      <Card style={{ borderRadius: 8, overflow: 'hidden' }}>
        {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ margin: 16 }} /> : null}
        <div className="shipment-toolbar">
          <span className="shipment-toolbar-total">{t('jobs.totalLabel')}: {filteredJobs.length}</span>
          <div className="toolbar-actions" style={{ position: 'relative' }} ref={settingsRef}>
            <Button
              className="toolbar-icon-button"
              icon={<ReloadOutlined />}
              onClick={refetch}
              aria-label="Refresh jobs"
            />
            <Button
              className="toolbar-icon-button"
              icon={<SettingOutlined />}
              aria-label="Table settings"
              onClick={() => setSettingsOpen((prev) => !prev)}
            />
            {settingsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 10,
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  minWidth: 180
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#555' }}>
                  {t('jobs.columnSettings') || 'Columns'}
                </div>
                {allColumnKeys.map((key) => (
                  <div key={key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(key)}
                        onChange={() => toggleColumn(key)}
                        style={{ cursor: 'pointer' }}
                      />
                      {columnLabelMap[key]}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Table
          rowKey="id"
          loading={jobsLoading}
          columns={columns}
          dataSource={filteredJobs}
          locale={{
            emptyText: <Empty description={errorMessage ? t('jobs.backendUnavailable') : t('jobs.noJobsFound')} />
          }}
          pagination={{
            pageSize: 10,
            total: filteredJobs.length,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`
          }}
          expandable={{
            expandedRowRender: (record) => <ExpandedRow record={record} t={t} />,
            expandRowByClick: true
          }}
          size="small"
          onRow={() => ({ style: { cursor: 'pointer' } })}
        />
      </Card>
    </DashboardLayout>
  );
}
