'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileAddOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetPaymentRequestsQuery,
  useCreatePaymentRequestMutation,
  useApprovePaymentRequestMutation,
  useFinalApprovePaymentRequestMutation,
  useRejectPaymentRequestMutation
} from '@/store/services/paymentRequestsApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { formatCurrency } from '@/utils/format';

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

export default function PaymentRequestsPage() {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const statusColor = {
    PENDING_DEPARTMENT_APPROVAL: 'orange',
    DEPARTMENT_APPROVED: 'blue',
    REJECTED: 'red',
    FINAL_APPROVED: 'green'
  };

  const statusLabel = {
    PENDING_DEPARTMENT_APPROVAL: t('paymentRequests.pendingDepartmentApproval'),
    DEPARTMENT_APPROVED: t('paymentRequests.departmentApproved'),
    REJECTED: t('paymentRequests.rejectedStatus'),
    FINAL_APPROVED: t('paymentRequests.finalApprovedStatus')
  };

  const { data: requestsData, isLoading: loading, error: loadErrorObj } = useGetPaymentRequestsQuery();
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();
  const [approvePaymentRequest] = useApprovePaymentRequestMutation();
  const [finalApprovePaymentRequest] = useFinalApprovePaymentRequestMutation();
  const [rejectPaymentRequest] = useRejectPaymentRequestMutation();

  const requests = requestsData?.items || [];
  const jobs = jobsData?.items || [];
  const partners = (partnersData?.items || []).filter((partner) => partner.isActive);
  const loadError = loadErrorObj ? t('paymentRequests.loadError') : '';

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ value: job.backendId, label: `${job.job_no || job.id} - ${job.customer || ''}` })),
    [jobs]
  );

  const vendorOptions = useMemo(
    () =>
      partners
        .filter((partner) => ['VENDOR', 'BOTH'].includes(partner.partnerType))
        .map((partner) => ({ value: partner.backendId, label: `${partner.code} - ${partner.name}` })),
    [partners]
  );

  function openCreateModal() {
    form.resetFields();
    form.setFieldsValue({
      currency: 'VND'
    });
    setModalOpen(true);
  }

  async function submitEntry(values) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        amount: Number(values.amount),
        requestedPaymentDate: toDateString(values.requestedPaymentDate)
      };
      await createPaymentRequest(payload).unwrap();
      message.success(t('paymentRequests.createSuccess'));
      setModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || t('paymentRequests.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(record) {
    try {
      await approvePaymentRequest(record.backendId).unwrap();
      message.success(t('paymentRequests.approveSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('paymentRequests.approveError'));
    }
  }

  async function handleFinalApprove(record) {
    try {
      await finalApprovePaymentRequest(record.backendId).unwrap();
      message.success(t('paymentRequests.finalApproveSuccess'));
    } catch (err) {
      message.error(err?.data?.message || t('paymentRequests.finalApproveError'));
    }
  }

  function openRejectModal(record) {
    setSelectedRecord(record);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  }

  async function handleReject(values) {
    setSaving(true);
    try {
      await rejectPaymentRequest({ id: selectedRecord.backendId, reason: values.reason }).unwrap();
      message.success(t('paymentRequests.rejectSuccess'));
      setRejectModalOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      message.error(err?.data?.message || t('paymentRequests.rejectError'));
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      title: t('paymentRequests.id'),
      dataIndex: 'backendId',
      key: 'backendId',
      width: 80
    },
    {
      title: t('paymentRequests.jobVendor'),
      key: 'job_vendor',
      width: 220,
      render: (_, record) => {
        const job = jobs.find((item) => item.backendId === record.jobId);
        const vendor = partners.find((item) => item.backendId === record.vendorId);
        return (
          <div>
            {job && <div style={{ fontSize: 12, color: '#666' }}>{t('paymentRequests.jobLabel', { jobNo: job.job_no })}</div>}
            {vendor && <strong>{vendor.name}</strong>}
          </div>
        );
      }
    },
    {
      title: t('paymentRequests.amount'),
      key: 'amount',
      align: 'right',
      width: 150,
      render: (_, record) => <strong>{formatCurrency(record.amount)} {record.currency}</strong>
    },
    {
      title: t('paymentRequests.requestedDate'),
      dataIndex: 'requestedPaymentDate',
      key: 'requestedPaymentDate',
      width: 140
    },
    {
      title: t('paymentRequests.reason'),
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true
    },
    {
      title: t('paymentRequests.status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => <Tag color={statusColor[value]}>{statusLabel[value] || value}</Tag>
    },
    {
      title: t('paymentRequests.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const isPending = record.status === 'PENDING_DEPARTMENT_APPROVAL';
        const isDeptApproved = record.status === 'DEPARTMENT_APPROVED';

        return (
          <Space>
            {isPending && (
              <Popconfirm title={t('paymentRequests.approveConfirm')} onConfirm={() => handleApprove(record)}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} title={t('paymentRequests.departmentApprove')} />
              </Popconfirm>
            )}
            {isDeptApproved && (
              <Popconfirm title={t('paymentRequests.finalApproveConfirm')} onConfirm={() => handleFinalApprove(record)}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                  title={t('paymentRequests.finalApprove')}
                  style={{ backgroundColor: '#52c41a' }}
                />
              </Popconfirm>
            )}
            {(isPending || isDeptApproved) && (
              <Button danger size="small" icon={<CloseCircleOutlined />} title={t('paymentRequests.reject')} onClick={() => openRejectModal(record)} />
            )}
          </Space>
        );
      }
    }
  ];

  const totalAmount = requests.reduce((sum, request) => sum + Number(request.amount || 0), 0);
  const pendingCount = requests.filter((request) => request.status === 'PENDING_DEPARTMENT_APPROVAL').length;
  const approvedCount = requests.filter((request) => request.status === 'FINAL_APPROVED').length;
  const rejectedCount = requests.filter((request) => request.status === 'REJECTED').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('paymentRequests.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('paymentRequests.subtitle')}
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateModal}>
          {t('paymentRequests.addRequest')}
        </Button>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('paymentRequests.totalValue')} value={totalAmount} formatter={(value) => formatCurrency(value)} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('paymentRequests.pendingApproval')} value={pendingCount} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('paymentRequests.finalApproved')} value={approvedCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title={t('paymentRequests.rejected')} value={rejectedCount} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={requests}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={t('paymentRequests.modalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={submitEntry}>
          <Form.Item name="vendorId" label={t('paymentRequests.vendor')} rules={[{ required: true, message: t('paymentRequests.vendorRequired') }]}>
            <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder={t('paymentRequests.selectVendor')} />
          </Form.Item>
          <Form.Item name="jobId" label={t('paymentRequests.jobOptional')}>
            <Select showSearch allowClear optionFilterProp="label" options={jobOptions} placeholder={t('paymentRequests.selectJob')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('paymentRequests.amount')} rules={[{ required: true, message: t('paymentRequests.amountRequired') }]}>
                <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label={t('paymentRequests.currency')} rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'VND', label: 'VND' },
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="requestedPaymentDate" label={t('paymentRequests.requestedPaymentDate')}>
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label={t('paymentRequests.reason')} rules={[{ required: true, message: t('paymentRequests.reasonRequired') }]}>
            <Input.TextArea rows={3} placeholder={t('paymentRequests.provideReason')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('paymentRequests.rejectModalTitle')}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
        confirmLoading={saving}
        destroyOnHidden
        okButtonProps={{ danger: true }}
        okText={t('paymentRequests.rejectButton')}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="reason"
            label={t('paymentRequests.rejectionReason')}
            rules={[{ required: true, message: t('paymentRequests.rejectReasonRequired') }]}
          >
            <Input.TextArea rows={3} placeholder={t('paymentRequests.explainReject')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
