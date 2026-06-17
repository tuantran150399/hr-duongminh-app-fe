'use client';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
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
  App
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import {
  useGetPaymentRequestsQuery,
  useCreatePaymentRequestMutation,
  useApprovePaymentRequestMutation,
  useFinalApprovePaymentRequestMutation,
  useRejectPaymentRequestMutation,
  useUpdatePaymentRequestMutation,
  useDeletePaymentRequestMutation
} from '@/store/services/paymentRequestsApi';
import { useGetJobsQuery } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

export default function PaymentRequestsPage() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const isChargeOnBehalf = Form.useWatch('isChargeOnBehalf', form);

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

  const { data: requestsData, isLoading: loading, error: loadErrorObj } = useGetPaymentRequestsQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  const { data: jobsData } = useGetJobsQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const [createPaymentRequest] = useCreatePaymentRequestMutation();
  const [approvePaymentRequest] = useApprovePaymentRequestMutation();
  const [finalApprovePaymentRequest] = useFinalApprovePaymentRequestMutation();
  const [rejectPaymentRequest] = useRejectPaymentRequestMutation();
  const [updatePaymentRequest] = useUpdatePaymentRequestMutation();
  const [deletePaymentRequest] = useDeletePaymentRequestMutation();

  const requests = requestsData?.items || [];
  const jobs = jobsData?.items || [];
  const partners = (partnersData?.items || []).filter((partner) => partner.isActive);
  const loadError = loadErrorObj ? t('paymentRequests.loadError') : '';

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((req) => {
      const vendor = partners.find((item) => item.backendId === req.vendorId);
      const job = jobs.find((item) => item.backendId === req.jobId);
      const vendorName = vendor?.name || '';
      const jobNo = job?.job_no || '';
      
      const searchable = [vendorName, jobNo, req.reason, req.backendId].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(keyword);
    });
  }, [requests, search, partners, jobs]);

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

  const customerOptions = useMemo(
    () =>
      partners
        .filter((partner) => ['CUSTOMER', 'BOTH'].includes(partner.partnerType))
        .map((partner) => ({ value: partner.backendId, label: `${partner.code} - ${partner.name}` })),
    [partners]
  );

  function openCreateModal() {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      currency: 'VND',
      isChargeOnBehalf: false
    });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);
    form.setFieldsValue({
      vendorId: record.vendorId || record.raw?.vendorId,
      jobId: record.jobId || record.raw?.jobId,
      amount: record.amount,
      currency: record.currency || 'VND',
      isChargeOnBehalf: Boolean(record.raw?.isChargeOnBehalf),
      chargeToPartnerId: record.raw?.chargeToPartnerId,
      paymentMethod: record.raw?.paymentMethod,
      reason: record.reason || record.raw?.reason
    });
    setModalOpen(true);
  }

  async function submitEntry(values) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        isChargeOnBehalf: Boolean(values.isChargeOnBehalf),
        chargeToPartnerId: values.isChargeOnBehalf ? values.chargeToPartnerId : undefined,
        paymentMethod: values.paymentMethod || undefined,
        amount: Number(values.amount),
        requestedPaymentDate: toDateString(values.requestedPaymentDate)
      };
      if (editingRecord) {
        await updatePaymentRequest({ id: editingRecord.backendId, ...payload }).unwrap();
        message.success(t('paymentRequests.updateSuccess'));
      } else {
        await createPaymentRequest(payload).unwrap();
        message.success(t('paymentRequests.createSuccess'));
      }
      setModalOpen(false);
      setEditingRecord(null);
    } catch (err) {
      message.error(getApiError(err, t, 'paymentRequests.createError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      await deletePaymentRequest(record.backendId).unwrap();
      message.success(t('paymentRequests.deleteSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'paymentRequests.deleteError'));
    }
  }

  async function handleApprove(record) {
    try {
      await approvePaymentRequest(record.backendId).unwrap();
      message.success(t('paymentRequests.approveSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'paymentRequests.approveError'));
    }
  }

  async function handleFinalApprove(record) {
    try {
      await finalApprovePaymentRequest(record.backendId).unwrap();
      message.success(t('paymentRequests.finalApproveSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'paymentRequests.finalApproveError'));
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
      message.error(getApiError(err, t, 'paymentRequests.rejectError'));
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
            {record.raw?.isChargeOnBehalf && (
              <div style={{ marginTop: 4 }}>
                <Tag color="blue">{t('paymentRequests.chargeOnBehalf')}</Tag>
              </div>
            )}
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
      title: t('paymentRequests.paymentMethod'),
      key: 'paymentMethod',
      width: 140,
      render: (_, record) => {
        const method = record.paymentMethod || record.raw?.paymentMethod;
        if (!method) return '-';
        return <Tag color={method === 'CASH' ? 'gold' : 'cyan'}>{method === 'CASH' ? t('paymentRequests.paymentMethodCash') : t('paymentRequests.paymentMethodBank')}</Tag>;
      }
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
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const isPending = record.status === 'PENDING_DEPARTMENT_APPROVAL';
        const isDeptApproved = record.status === 'DEPARTMENT_APPROVED';

        return (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              title={t('paymentRequests.viewDetail')}
              onClick={() => setViewRecord(record)}
            />
            {isPending && (
              <>
                <Button type="text" size="small" icon={<EditOutlined />} title={t('paymentRequests.edit')} onClick={() => openEditModal(record)} />
                <Popconfirm title={t('paymentRequests.deleteConfirm')} onConfirm={() => handleDelete(record)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} title={t('paymentRequests.delete')} />
                </Popconfirm>
              </>
            )}
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
              <Button type="text" danger size="small" icon={<CloseCircleOutlined />} title={t('paymentRequests.reject')} onClick={() => openRejectModal(record)} />
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

      <FilterCard
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder={t('paymentRequests.searchPlaceholder') || 'Search...'}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all', label: t('paymentRequests.allStatuses') || 'All Statuses' },
          { value: 'PENDING_DEPARTMENT_APPROVAL', label: statusLabel.PENDING_DEPARTMENT_APPROVAL },
          { value: 'DEPARTMENT_APPROVED', label: statusLabel.DEPARTMENT_APPROVED },
          { value: 'FINAL_APPROVED', label: statusLabel.FINAL_APPROVED },
          { value: 'REJECTED', label: statusLabel.REJECTED }
        ]}
        showDateRange={false}
      />

      <Card className="table-card">
        <Table
          rowKey="backendId"
          loading={loading}
          columns={columns}
          dataSource={filteredRequests}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingRecord ? t('paymentRequests.editModalTitle') : t('paymentRequests.modalTitle')}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={submitEntry}>
          <Form.Item name="vendorId" label={t('paymentRequests.vendor')} rules={[{ required: true, message: t('paymentRequests.vendorRequired') }]}>
            <Select showSearch optionFilterProp="label" options={vendorOptions} placeholder={t('paymentRequests.selectVendor')} />
          </Form.Item>
          <Form.Item
            name="jobId"
            label={t('paymentRequests.jobOptional')}
            rules={[{ required: Boolean(isChargeOnBehalf), message: t('paymentRequests.jobRequired') }]}
          >
            <Select showSearch allowClear optionFilterProp="label" options={jobOptions} placeholder={t('paymentRequests.selectJob')} />
          </Form.Item>

          <Form.Item name="isChargeOnBehalf" valuePropName="checked" style={{ marginBottom: isChargeOnBehalf ? 12 : 24 }}>
            <Checkbox>{t('paymentRequests.chargeOnBehalf')}</Checkbox>
          </Form.Item>

          {isChargeOnBehalf && (
            <>
              <Alert type="info" showIcon message={t('paymentRequests.chargeOnBehalfHint')} style={{ marginBottom: 16 }} />
              <Form.Item
                name="chargeToPartnerId"
                label={t('paymentRequests.chargeToCustomer')}
                rules={[{ required: true, message: t('paymentRequests.customerRequired') }]}
              >
                <Select showSearch optionFilterProp="label" options={customerOptions} placeholder={t('paymentRequests.selectCustomer')} />
              </Form.Item>
            </>
          )}

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
          <Form.Item name="paymentMethod" label={t('paymentRequests.paymentMethod')}>
            <Select
              allowClear
              placeholder={t('paymentRequests.selectPaymentMethod')}
              options={[
                { value: 'CASH', label: t('paymentRequests.paymentMethodCash') },
                { value: 'BANK', label: t('paymentRequests.paymentMethodBank') }
              ]}
            />
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

      {/* View Detail Modal */}
      <Modal
        title={t('paymentRequests.viewDetail')}
        open={Boolean(viewRecord)}
        onCancel={() => setViewRecord(null)}
        footer={
          <Space>
            {viewRecord?.status === 'PENDING_DEPARTMENT_APPROVAL' && (
              <>
                <Button icon={<EditOutlined />} onClick={() => { setViewRecord(null); openEditModal(viewRecord); }}>{t('paymentRequests.edit')}</Button>
                <Popconfirm title={t('paymentRequests.approveConfirm')} onConfirm={() => { handleApprove(viewRecord); setViewRecord(null); }}>
                  <Button type="primary" icon={<CheckCircleOutlined />}>{t('paymentRequests.departmentApprove')}</Button>
                </Popconfirm>
              </>
            )}
            {viewRecord?.status === 'DEPARTMENT_APPROVED' && (
              <Popconfirm title={t('paymentRequests.finalApproveConfirm')} onConfirm={() => { handleFinalApprove(viewRecord); setViewRecord(null); }}>
                <Button type="primary" icon={<SafetyCertificateOutlined />} style={{ backgroundColor: '#52c41a' }}>{t('paymentRequests.finalApprove')}</Button>
              </Popconfirm>
            )}
            {(viewRecord?.status === 'PENDING_DEPARTMENT_APPROVAL' || viewRecord?.status === 'DEPARTMENT_APPROVED') && (
              <Button danger icon={<CloseCircleOutlined />} onClick={() => { setViewRecord(null); openRejectModal(viewRecord); }}>{t('paymentRequests.reject')}</Button>
            )}
            <Button onClick={() => setViewRecord(null)}>{t('paymentRequests.close')}</Button>
          </Space>
        }
        width={600}
      >
        {viewRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t('paymentRequests.id')}>{viewRecord.backendId}</Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.vendor')}>
              {(() => { const vendor = partners.find((p) => p.backendId === viewRecord.vendorId); return vendor ? `${vendor.code} - ${vendor.name}` : viewRecord.vendorId; })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.job')}>
              {(() => { const job = jobs.find((j) => j.backendId === viewRecord.jobId); return job ? `${job.job_no || job.id} - ${job.customer || ''}` : (viewRecord.jobId || '-'); })()}
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.amount')}>
              <strong>{formatCurrency(viewRecord.amount)} {viewRecord.currency}</strong>
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.requestedDate')}>
              {viewRecord.requestedPaymentDate || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.status')}>
              <Tag color={statusColor[viewRecord.status]}>{statusLabel[viewRecord.status] || viewRecord.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentRequests.paymentMethod')}>
              {viewRecord.raw?.paymentMethod === 'CASH' ? t('paymentRequests.paymentMethodCash') : viewRecord.raw?.paymentMethod === 'BANK' ? t('paymentRequests.paymentMethodBank') : '-'}
            </Descriptions.Item>
            {viewRecord.raw?.isChargeOnBehalf && (
              <>
                <Descriptions.Item label={t('paymentRequests.chargeOnBehalf')}>
                  <Tag color="blue">{t('paymentRequests.chargeOnBehalf')}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('paymentRequests.chargeToCustomer')}>
                  {(() => {
                    const customer = partners.find((p) => p.backendId === viewRecord.raw?.chargeToPartnerId);
                    return customer ? `${customer.code} - ${customer.name}` : viewRecord.raw?.chargeToPartnerId;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label={t('paymentRequests.receivableEntry')}>
                  {viewRecord.raw?.receivableEntryId || '-'}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label={t('paymentRequests.reason')}>
              {viewRecord.reason || viewRecord.raw?.reason || '-'}
            </Descriptions.Item>
            {(viewRecord.status === 'REJECTED' && (viewRecord.rejectionReason || viewRecord.raw?.rejectionReason)) && (
              <Descriptions.Item label={t('paymentRequests.rejectionReason')}>
                <Typography.Text type="danger">{viewRecord.rejectionReason || viewRecord.raw?.rejectionReason}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </DashboardLayout>
  );
}
