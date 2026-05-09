'use client';

import {
  Alert,
  Button,
  Card,
  Empty,
  message,
  Space,
  Table,
  Typography
} from 'antd';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import StatusTag from '@/components/StatusTag';
import FilterCard from '@/components/FilterCard';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { normalizeJob } from '@/utils/apiMappers';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { normalizePartner } from '@/utils/apiMappers';

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

function downloadJobsCsv(rows) {
  const headers = [
    'Job No.',
    'Customer',
    'Status',
    'Origin',
    'Destination',
    'ETD',
    'ETA',
    'Shipper',
    'Consignee',
    'Agent',
    'Cargo Type',
    'Container',
    'C/O Type'
  ];

  const records = rows.map((job) => [
    job.job_no,
    job.customer,
    job.status,
    job.origin,
    job.destination,
    formatDisplayDate(job.etd),
    formatDisplayDate(job.eta),
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

function ExpandedRow({ record }) {
  const router = useRouter();
  const raw = record.raw || {};

  return (
    <div className="expanded-row-detail">
      <div className="detail-grid">
        <div>
          <span className="detail-label">Shipper</span>
          <span className="detail-value">{raw.shipperName || raw.shipper || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Consignee</span>
          <span className="detail-value">{raw.consigneeName || raw.consignee || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Agent</span>
          <span className="detail-value">{raw.agentName || raw.agent || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Cargo Type</span>
          <span className="detail-value">{raw.cargoType || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Origin</span>
          <span className="detail-value">{record.origin || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Destination</span>
          <span className="detail-value">{record.destination || '-'}</span>
        </div>
        <div>
          <span className="detail-label">Container</span>
          <span className="detail-value detail-mono">{raw.containerNo || raw.container || '-'}</span>
        </div>
        <div>
          <span className="detail-label">C/O Type</span>
          <span className="detail-value">{raw.coType || '-'}</span>
        </div>
      </div>
      <div className="detail-actions">
        <Button
          size="small"
          onClick={() => router.push(`/jobs/detail?id=${record.backendId || record.id}`)}
        >
          Detail
        </Button>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  // RTK Query — lấy jobs và partners
  const { data: jobsData, isLoading: jobsLoading, error: jobsError, refetch } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();

  // Build partners map từ RTK Query cache
  const partnersById = useMemo(() => {
    const partners = partnersData?.items || [];
    return partners.reduce((result, raw) => {
      const partner = normalizePartner(raw);
      if (partner) result[partner.backendId] = partner;
      return result;
    }, {});
  }, [partnersData]);

  // Normalize jobs với partners map
  const jobs = useMemo(() => {
    const rawItems = jobsData?.items || [];
    return rawItems.map((job) => normalizeJob(job, partnersById)).filter(Boolean);
  }, [jobsData, partnersById]);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      ...Array.from(new Set(jobs.map((item) => item.status).filter(Boolean)))
        .map((status) => ({ value: status, label: status }))
    ],
    [jobs]
  );

  const filteredJobs = jobs.filter((job) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      job.job_no?.toLowerCase().includes(query) ||
      job.customer?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

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

  const columns = [
    {
      title: 'Job No.',
      dataIndex: 'job_no',
      key: 'job_no',
      sorter: (a, b) => String(a.job_no).localeCompare(String(b.job_no)),
      render: (value) => <span style={{ fontWeight: 600, color: '#0057c2' }}>{value || '-'}</span>
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a, b) => String(a.customer).localeCompare(String(b.customer))
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <StatusTag value={value} />
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin'
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination'
    },
    {
      title: 'ETD',
      dataIndex: 'etd',
      key: 'etd',
      render: formatDisplayDate
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      render: formatDisplayDate
    }
  ];

  const errorMessage = jobsError
    ? 'Unable to load jobs from the backend.'
    : '';

  function handleReset() {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(null);
  }

  function handleExport() {
    if (!filteredJobs.length) {
      message.warning('There are no jobs to export.');
      return;
    }

    downloadJobsCsv(filteredJobs);
    message.success(`Exported ${filteredJobs.length} jobs.`);
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Jobs"
        subtitle="Manage logistics jobs from live backend data."
        actions={
          <>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/jobs/create')}>
              Create Job
            </Button>
          </>
        }
      />

      <FilterCard
        searchValue={searchTerm}
        onSearchChange={(event) => setSearchTerm(event.target.value)}
        searchPlaceholder="Job number or customer"
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
          <span className="shipment-toolbar-total">Total: {filteredJobs.length} jobs</span>
          <Space>
            <ReloadOutlined style={{ color: '#727786', cursor: 'pointer' }} onClick={refetch} />
            <SettingOutlined style={{ color: '#727786' }} />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={jobsLoading}
          columns={columns}
          dataSource={filteredJobs}
          locale={{
            emptyText: <Empty description={errorMessage ? 'Backend data is unavailable.' : 'No jobs found.'} />
          }}
          pagination={{
            pageSize: 10,
            total: filteredJobs.length,
            showSizeChanger: false,
            showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`
          }}
          expandable={{
            expandedRowRender: (record) => <ExpandedRow record={record} />,
            expandRowByClick: true
          }}
          size="small"
          onRow={() => ({ style: { cursor: 'pointer' } })}
        />
      </Card>
    </DashboardLayout>
  );
}
