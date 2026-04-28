'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getJobs } from '@/services/jobService';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const statusColor = {
  New: 'default',
  InProgress: 'processing',
  'In Progress': 'processing',
  Completed: 'success',
  Closed: 'success',
  Pending: 'warning',
  Cancelled: 'error',
  Canceled: 'error'
};

function formatDisplayDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
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
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    let active = true;

    getJobs()
      .then((result) => {
        if (!active) return;
        const items = result.items || [];
        setJobs(items);
        setPagination((current) => ({
          ...current,
          current: result.meta?.page || 1,
          pageSize: result.meta?.limit || current.pageSize,
          total: result.meta?.total || items.length
        }));
      })
      .catch(() => {
        if (active) setError('Unable to load jobs from the backend.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(jobs.map((item) => item.status).filter(Boolean)))],
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
      filters: statusOptions
        .filter((status) => status !== 'all')
        .map((status) => ({ text: status, value: status })),
      onFilter: (value, record) => record.status === value,
      render: (value) => <Tag color={statusColor[value] || 'default'}>{value || '-'}</Tag>
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

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>Jobs</h2>
          <p>Manage logistics jobs from live backend data.</p>
        </div>
        <div className="shipment-page-actions">
          <Button icon={<DownloadOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/jobs/create')}>
            Create Job
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 8, marginBottom: 24, border: '1px solid #e2e2e2' }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Search</Text>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Job number or customer"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              size="large"
            />
          </Col>
          <Col xs={24} md={6}>
            <Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Status</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              style={{ width: '100%' }}
              options={statusOptions.map((status) => ({
                value: status,
                label: status === 'all' ? 'All statuses' : status
              }))}
            />
          </Col>
          <Col xs={24} md={7}>
            <Text style={{ color: '#414755', fontSize: 14, fontWeight: 500 }}>Date Range</Text>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} md={3}>
            <Button
              block
              size="large"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateRange(null);
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, overflow: 'hidden' }}>
        {error ? <Alert type="error" showIcon message={error} style={{ margin: 16 }} /> : null}
        <div className="shipment-toolbar">
          <span className="shipment-toolbar-total">Total: {pagination.total || filteredJobs.length} jobs</span>
          <Space>
            <ReloadOutlined style={{ color: '#727786' }} />
            <SettingOutlined style={{ color: '#727786' }} />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredJobs}
          locale={{
            emptyText: <Empty description={error ? 'Backend data is unavailable.' : 'No jobs found.'} />
          }}
          pagination={{
            ...pagination,
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
