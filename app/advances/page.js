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
import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import { formatCurrency } from '@/utils/format';
import { getEmployees } from '@/services/hrmService';
import {
  useGetAdvancesQuery,
  useCreateAdvanceMutation,
  useApproveAdvanceMutation,
  useRejectAdvanceMutation,
  useSettleAdvanceMutation
} from '@/store/services/advancesApi';

const statusColor = {
  PENDING: 'orange',
  APPROVED: 'blue',
  SETTLED: 'green',
  REJECTED: 'red',
  OVERDUE: 'red',
};

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

function isOverdue(record) {
  if (record.status !== 'APPROVED' || !record.dueDate) return false;
  return String(record.dueDate) < new Date().toISOString().slice(0, 10);
}

export default function AdvancesPage() {
  const { t } = useLanguage();
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
          setEmployeeError(t('advances.loadEmployeeError'));
        }
      }
    }

    loadEmployees();
    return () => {
      active = false;
    };
  }, [t]);

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
      message.success(t('advances.createSuccess'));
      setModalOpen(false);
      form.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || t('advances.createError'));
    }
  }

  async function handleApprove(record) {
    try {
      await approveAdvance(record.id).unwrap();
      message.success(t('advances.approveSuccess'));
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || t('advances.approveError'));
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
      message.success(t('advances.rejectSuccess'));
      setRejectModalOpen(false);
      setSelectedRecord(null);
      rejectForm.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || t('advances.rejectError'));
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
      message.success(t('advances.settleSuccess'));
      setSettleModalOpen(false);
      setSelectedRecord(null);
      settleForm.resetFields();
      refetch();
    } catch (requestError) {
      message.error(requestError?.data?.message || t('advances.settleError'));
    }
  }

  const statusLabelMap = {
    PENDING: t('advances.pending'),
    APPROVED: t('advances.approved'),
    SETTLED: t('advances.settled'),
    REJECTED: t('advances.rejected'),
    OVERDUE: t('advances.overdue'),
  };

  const columns = [
    { title: t('advances.empCode'), dataIndex: 'employeeCode', key: 'employeeCode', width: 110 },
    { title: t('advances.employee'), dataIndex: 'employeeName', key: 'employeeName', render: (value) => <strong>{value}</strong> },
    {
      title: t('advances.amount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 170,
      render: (value, record) => <strong style={{ color: '#0057c2' }}>{formatCurrency(value)} {record.currency}</strong>
    },
    { title: t('advances.purpose'), dataIndex: 'purpose', key: 'purpose', render: (value) => value || '-' },
    { title: t('advances.dueDate'), dataIndex: 'dueDate', key: 'dueDate', width: 140, render: (value) => value || '-' },
    {
      title: t('advances.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => <Tag color={statusColor[status] || 'default'}>{statusLabelMap[status] || status}</Tag>
    },
    {
      title: t('advances.actions'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' ? (
            <>
              <Popconfirm title={t('advances.approveConfirm')} onConfirm={() => handleApprove(record)}>
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
              {t('advances.reimburse')}
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
          <Typography.Title level={1} className="page-title">{t('advances.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('advances.subtitle')}
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
          {t('advances.createAdvance')}
        </Button>
      </div>

      {error ? <Alert type="error" showIcon message={t('advances.loadError')} style={{ marginBottom: 16 }} /> : null}
      {employeeError ? <Alert type="warning" showIcon message={employeeError} style={{ marginBottom: 16 }} /> : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('advances.totalAdvancing')} value={totalAdvanced} formatter={(value) => formatCurrency(value)} prefix={<DollarOutlined />} valueStyle={{ color: '#0057c2' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('advances.pendingApproval')} value={pendingCount} prefix={<WalletOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('advances.overdueReimbursement')} value={overdueCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: overdueCount > 0 ? '#ff4d4f' : '#52c41a' }} />
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
              { value: 'all', label: t('advances.allStatuses') },
              { value: 'PENDING', label: t('advances.pending') },
              { value: 'APPROVED', label: t('advances.approved') },
              { value: 'SETTLED', label: t('advances.settled') },
              { value: 'OVERDUE', label: t('advances.overdue') },
              { value: 'REJECTED', label: t('advances.rejected') },
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
          locale={{ emptyText: <Empty description={t('advances.noData')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title={t('advances.createModalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isCreating}
        destroyOnHidden
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={submitAdvance}>
          <Form.Item name="employeeId" label={t('advances.employeeLabel')} rules={[{ required: true, message: t('advances.employeeRequired') }]}>
            <Select showSearch optionFilterProp="label" options={employeeOptions} placeholder={t('advances.selectEmployee')} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="amount" label={t('advances.advanceAmount')} rules={[{ required: true, message: t('advances.amountRequired') }]}>
                <InputNumber min={1} step={500000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label={t('advances.currency')} initialValue="VND">
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="purpose" label={t('advances.purposeLabel')}>
            <Input.TextArea rows={2} placeholder={t('advances.purposePlaceholder')} />
          </Form.Item>
          <Form.Item name="dueDate" label={t('advances.dueDateLabel')} rules={[{ required: true, message: t('advances.dueDateRequired') }]}>
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('advances.settleModalTitle')}
        open={settleModalOpen}
        onCancel={() => setSettleModalOpen(false)}
        onOk={() => settleForm.submit()}
        confirmLoading={isSettling}
        destroyOnHidden
      >
        <Form form={settleForm} layout="vertical" onFinish={handleSettle}>
          <Form.Item name="amount" label={t('advances.settleAmount')} rules={[{ required: true, message: t('advances.amountRequired') }]}>
            <InputNumber min={0.01} step={100000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t('advances.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('advances.rejectModalTitle')}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
        confirmLoading={isRejecting}
        okButtonProps={{ danger: true }}
        okText={t('advances.rejectButton')}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label={t('advances.rejectReason')} rules={[{ required: true, message: t('advances.reasonRequired') }]}>
            <Input.TextArea rows={3} placeholder={t('advances.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
