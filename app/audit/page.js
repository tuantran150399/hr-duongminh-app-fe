'use client';

import { Alert, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getAuditLogs } from '@/services/adminService';

const { RangePicker } = DatePicker;

function renderJson(value) {
  if (!value) return '-';
  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();

  async function loadLogs(params = {}) {
    setLoading(true);
    setError('');
    try {
      const result = await getAuditLogs(params);
      setLogs(result.items);
      setMeta(result.meta);
    } catch {
      setError('Unable to load audit logs from the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function submitFilters(values) {
    const range = values.range || [];
    loadLogs({
      entityName: values.entityName || undefined,
      entityId: values.entityId || undefined,
      action: values.action || undefined,
      dateFrom: range[0]?.format?.('YYYY-MM-DD'),
      dateTo: range[1]?.format?.('YYYY-MM-DD')
    });
  }

  const columns = [
    { title: 'Time', dataIndex: 'createdAt', key: 'createdAt', render: (value) => value || '-' },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (value) => <Tag color="blue">{value}</Tag> },
    { title: 'Entity', dataIndex: 'entityName', key: 'entityName' },
    { title: 'Entity ID', dataIndex: 'entityId', key: 'entityId' },
    { title: 'User ID', dataIndex: 'userId', key: 'userId' },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress' },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" onClick={() => setSelected(record)}>View</Button>
    }
  ];

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>Audit Logs</h2>
          <p>Read-only system activity trail for sensitive operations.</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => loadLogs()}>Refresh</Button>
      </div>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={submitFilters}>
          <div className="accounting-filter-row">
            <Form.Item name="entityName" label="Entity">
              <Input allowClear placeholder="jobs, partners, revenue_entries" prefix={<SearchOutlined />} />
            </Form.Item>
            <Form.Item name="entityId" label="Entity ID">
              <Input allowClear />
            </Form.Item>
            <Form.Item name="action" label="Action">
              <Select
                allowClear
                options={['CREATE', 'UPDATE', 'DELETE', 'POST', 'VOID', 'LOGIN'].map((value) => ({ value, label: value }))}
              />
            </Form.Item>
            <Form.Item name="range" label="Date range">
              <RangePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button type="primary" htmlType="submit">Apply</Button>
                <Button onClick={() => { form.resetFields(); loadLogs(); }}>Reset</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={logs}
          pagination={{
            pageSize: meta?.limit || 10,
            total: meta?.total || logs.length
          }}
        />
      </Card>

      <Drawer title="Audit Detail" open={Boolean(selected)} onClose={() => setSelected(null)} width={720}>
        {selected ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Action">{selected.action}</Descriptions.Item>
            <Descriptions.Item label="Entity">{selected.entityName}</Descriptions.Item>
            <Descriptions.Item label="Entity ID">{selected.entityId}</Descriptions.Item>
            <Descriptions.Item label="User ID">{selected.userId}</Descriptions.Item>
            <Descriptions.Item label="IP address">{selected.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="User agent">{selected.userAgent}</Descriptions.Item>
            <Descriptions.Item label="Timestamp">{selected.createdAt}</Descriptions.Item>
            <Descriptions.Item label="Before">{renderJson(selected.oldValues)}</Descriptions.Item>
            <Descriptions.Item label="After">{renderJson(selected.newValues)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </DashboardLayout>
  );
}
