'use client';

import { Alert, Card, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getPartners } from '@/services/partnerService';

export default function PartnersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getPartners()
      .then((items) => {
        if (active) setData(items);
      })
      .catch(() => {
        if (active) setError('Unable to load partners from the backend.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={type === 'Customer' ? 'blue' : 'orange'}>{type}</Tag>
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' }
  ];

  return (
    <DashboardLayout>
      <h1 className="page-title">Partners</h1>
      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </DashboardLayout>
  );
}
