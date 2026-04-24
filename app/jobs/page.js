'use client';

import { Card, Table, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getJobs } from '@/services/jobService';

const statusColors = {
  Completed: 'green',
  'In Progress': 'blue',
  Pending: 'orange'
};

export default function JobsPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getJobs()
      .then((result) => {
        if (!active) return;
        setData(result.items || []);
        if (result.meta) {
          setPagination({
            current: result.meta.page,
            pageSize: result.meta.limit,
            total: result.meta.total
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

  const columns = [
    { title: 'Job No', dataIndex: 'job_no', key: 'job_no' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>
    },
    { title: 'Origin', dataIndex: 'origin', key: 'origin' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination' }
  ];

  return (
    <DashboardLayout>
      <h1 className="page-title">Jobs</h1>
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={pagination.total ? pagination : { pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => router.push(`/jobs/detail?id=${record.backendId || record.id}`),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>
    </DashboardLayout>
  );
}
