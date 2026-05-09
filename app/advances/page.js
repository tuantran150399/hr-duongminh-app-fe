'use client';

import {
  Alert, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber,
  Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tag,
  Typography, message
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, DollarOutlined,
  FileAddOutlined, SafetyCertificateOutlined, WalletOutlined
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { formatCurrency } from '@/utils/format';
import { getEmployees } from '@/services/hrmService';
import {
  useGetAdvancesQuery,
  useCreateAdvanceMutation,
  useApproveAdvanceMutation,
  useRejectAdvanceMutation,
  useSettleAdvanceMutation
} from '@/store/services/advancesApi';
import { useEffect } from 'react';

const statusColor = {
  PENDING: 'orange',
  APPROVED: 'blue',
  SETTLED: 'green',
  REJECTED: 'red',
  OVERDUE: 'red',
};

const statusLabel = {
  PENDING: 'Cho duyet',
  APPROVED: 'Da duyet',
  SETTLED: 'Da hoan ung',
  REJECTED: 'Tu choi',
  OVERDUE: 'Qua han',
};

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

function isOverdue(record) {
  if (record.status !== 'APPROVED' || !record.dueDate) return false;
  return String(record.dueDate) < new Date().toISOString().slice(0, 10);
}

export default function AdvancesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeError, setEmployeeError] = useState('');

  const [form] = Form.useForm();
  const [settleForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const { data: advancesData, isLoading, error, refetch } = useGetAdvancesQuery();
  const [createAdvance, { isLoading: isCreating }] = useCreateAdvanceMutation();
  const [approveAdvance] = useApproveAdvanceMutation();
  const [rejectAdvance, { isLoading: isRejecting }] = useRejectAdvanceMutation();
  const [settleAdvance, { isLoading: isSettling }] = useSettleAdvanceMutation();

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      try {
        const result = await getEmployees({ limit: 200 });
        if (active) {
          setEmployees(result.items || []);
          setEmployeeError('');
        }
      } catch {
        if (active) {
          setEmployees([]);
          setEmployeeError('Khong the tai danh sach nhan vien.');
        }
      }
    }

    loadEmployees();
    return () => {
      active = false;
    };
  }, []);

  const employeeMap = useMemo(
    () => employees.reduce((result, employee) => {
      result[employee.id] = employee;
      return result;
    }, {}),
    [employees]
  );

  const advances = useMemo(
    () =>
      (advancesData?.items || []).map((item) => {
        const employee = employeeMap[item.employeeId];
        const normalizedStatus = isOverdue(item) ? 'OVERDUE' : item.status;
        return {
          ...item,
          key: item.id,
          employeeCode: employee?.employeeCode || `EMP-${item.employeeId}`,
          employeeName: employee?.fullName || `Employee #${item.employeeId}`,
          settledAmount: Number(item.settledAmount || 0),
          amount: Number(item.amount || 0),
          status: normalizedStatus,
        };
      }),
    [advancesData?.items, employeeMap]
  );

  const filtered = useMemo(
    () => (statusFilter === 'all' ? advances : advances.filter((advance) => advance.status === statusFilter)),
    [advances, statusFilter]
  );

  const totalAdvanced = advances
    .filter((advance) => ['APPROVED', 'OVERDUE'].includes(advance.status))
    .reduce((sum, advance) => sum + Number(advance.amount || 0), 0);
  const pendingCount = advances.filter((advance) => advance.status === 'PENDING').length;
  const overdueCount = advances.filter((advance) => advance.status === 'OVERDUE').length;

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.status === 'ACTIVE')
        .map((employee) => ({
          value: employee.id,
          label: `${employee.employeeCode} - ${employee.fullName}`
        })),
    [employees]
  );

  async function submitAdvance(values) {
    const payload = {
      employeeId: Number(values.employeeId),
      amount: Number(values.amount),
      currency: values.currency || 'VND',
      purpose: values.purpose,
      dueDate: toDateString(values.dueDate),
      ...(values.jobId ? { jobId: Number(values.jobId) } : {})
    };

    try {
      await createAdvance(payload).unwrap();
      message.success('Da tao yeu cau tam ung.');
      setModalOpen(false);
      form.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || 'Khong the tao yeu cau tam ung.');
    }
  }

  async function handleApprove(record) {
    try {
      await approveAdvance(record.id).unwrap();
      message.success('Da duyet tam ung.');
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || 'Khong the duyet tam ung.');
    }
  }

  function openRejectModal(record) {
    setSelectedRecord(record);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  }

  async function handleReject(values) {
    try {
      await rejectAdvance({ id: selectedRecord.id, reason: values.reason }).unwrap();
      message.success('Da tu choi tam ung.');
      setRejectModalOpen(false);
      setSelectedRecord(null);
      rejectForm.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || 'Khong the tu choi tam ung.');
    }
  }

  function openSettleModal(record) {
    setSelectedRecord(record);
    settleForm.setFieldsValue({
      amount: Math.max(Number(record.amount || 0) - Number(record.settledAmount || 0), 0),
      notes: ''
    });
    setSettleModalOpen(true);
  }

  async function handleSettle(values) {
    try {
      await settleAdvance({
        id: selectedRecord.id,
        payload: {
          amount: Number(values.amount)
        }
      }).unwrap();
      message.success('Da hoan ung thanh cong.');
      setSettleModalOpen(false);
      setSelectedRecord(null);
      settleForm.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || 'Khong the hoan ung.');
    }
  }

  const columns = [
    { title: 'Ma NV', dataIndex: 'employeeCode', key: 'employeeCode', width: 110 },
    { title: 'Nhan vien', dataIndex: 'employeeName', key: 'employeeName', render: (value) => <strong>{value}</strong> },
    {
      title: 'So tien',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 170,
      render: (value, record) => <strong style={{ color: '#0057c2' }}>{formatCurrency(value)} {record.currency}</strong>
    },
    { title: 'Muc dich', dataIndex: 'purpose', key: 'purpose', render: (value) => value || '-' },
    { title: 'Han hoan ung', dataIndex: 'dueDate', key: 'dueDate', width: 140, render: (value) => value || '-' },
    {
      title: 'Trang thai',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => <Tag color={statusColor[status] || 'default'}>{statusLabel[status] || status}</Tag>
    },
    {
      title: 'Thao tac',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' ? (
            <>
              <Popconfirm title="Duyet tam ung nay?" onConfirm={() => handleApprove(record)}>
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} />
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => openRejectModal(record)} />
            </>
          ) : null}
          {['APPROVED', 'OVERDUE'].includes(record.status) ? (
            <Button
              size="small"
              type="primary"
              icon={<SafetyCertificateOutlined />}
              style={record.status === 'OVERDUE' ? { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' } : { backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => openSettleModal(record)}
            >
              Hoan ung
            </Button>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">Tam ung & Hoan ung</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            Quan ly quy trinh nhan vien tam ung va hoan ung tu backend thuc.
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<FileAddOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ currency: 'VND' });
            setModalOpen(true);
          }}
        >
          Tao tam ung
        </Button>
      </div>

      {error ? <Alert type="error" showIcon message="Khong the tai du lieu tam ung tu backend." style={{ marginBottom: 16 }} /> : null}
      {employeeError ? <Alert type="warning" showIcon message={employeeError} style={{ marginBottom: 16 }} /> : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Tong dang tam ung" value={totalAdvanced} formatter={(value) => formatCurrency(value)} prefix={<DollarOutlined />} valueStyle={{ color: '#0057c2' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Cho duyet" value={pendingCount} prefix={<WalletOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Qua han hoan ung" value={overdueCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: overdueCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <div style={{ marginBottom: 16 }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 220 }}
            options={[
              { value: 'all', label: 'Tat ca trang thai' },
              { value: 'PENDING', label: 'Cho duyet' },
              { value: 'APPROVED', label: 'Da duyet' },
              { value: 'SETTLED', label: 'Da hoan ung' },
              { value: 'OVERDUE', label: 'Qua han' },
              { value: 'REJECTED', label: 'Tu choi' },
            ]}
          />
        </div>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="Chua co du lieu tam ung." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title="Tao yeu cau tam ung"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        destroyOnHidden
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={submitAdvance}>
          <Form.Item name="employeeId" label="Nhan vien" rules={[{ required: true, message: 'Nhan vien la bat buoc.' }]}>
            <Select showSearch optionFilterProp="label" options={employeeOptions} placeholder="Chon nhan vien" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="amount" label="So tien tam ung" rules={[{ required: true, message: 'So tien la bat buoc.' }]}>
                <InputNumber min={1} step={500000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label="Don vi tien te" initialValue="VND">
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="purpose" label="Muc dich su dung">
            <Input.TextArea rows={2} placeholder="Ghi ro muc dich tam ung..." />
          </Form.Item>
          <Form.Item name="dueDate" label="Han hoan ung" rules={[{ required: true, message: 'Han hoan ung la bat buoc.' }]}>
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xac nhan hoan ung"
        open={settleModalOpen}
        onCancel={() => setSettleModalOpen(false)}
        onOk={() => settleForm.submit()}
        confirmLoading={isSettling}
        destroyOnHidden
      >
        <Form form={settleForm} layout="vertical" onFinish={handleSettle}>
          <Form.Item name="amount" label="So tien hoan ung" rules={[{ required: true, message: 'So tien la bat buoc.' }]}>
            <InputNumber min={0.01} step={100000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chu">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tu choi tam ung"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
        confirmLoading={isRejecting}
        okButtonProps={{ danger: true }}
        okText="Tu choi"
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Ly do tu choi" rules={[{ required: true, message: 'Ly do la bat buoc.' }]}>
            <Input.TextArea rows={3} placeholder="Vui long ghi ro ly do..." />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
