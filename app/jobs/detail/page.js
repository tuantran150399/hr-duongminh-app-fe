'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag
} from 'antd';
import {
  BankOutlined,
  CompassOutlined,
  CopyOutlined,
  FileTextOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetJobByIdQuery,
  useGetJobDebtPreviewMutation,
  useUpdateJobMutation,
  useCopyJobMutation,
  useCancelJobMutation
} from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetUsersQuery, useGetBranchesQuery } from '@/store/services/adminApi';
import { cleanPayload, convertDateFields, decimalInputProps, toDatePickerValue } from '@/utils/formUtils';
import { getApiError } from '@/utils/getApiError';
import { formatCurrency } from '@/utils/format';
import {
  getJobTypeOptions,
  getShipmentModeOptions,
  getJobStatusOptions,
  getCustomsLaneOptions,
  getCargoTypeOptions,
  getCargoUnitOptions,
  TERMINAL_STATUSES,
  JOB_DATE_FIELDS
} from '@/config/jobConstants';

function buildCopyPayload(rawJob) {
  return {
    jobCode: `${rawJob.jobCode || 'JOB'}-COPY-${Date.now().toString().slice(-5)}`,
    jobType: rawJob.jobType,
    shipmentMode: rawJob.shipmentMode,
    partnerId: rawJob.partnerId,
    branchId: rawJob.branchId,
    assignedUserId: rawJob.assignedUserId,
    agentId: rawJob.agentId,
    debtAmount: rawJob.debtAmount,
    shipper: rawJob.shipper,
    consignee: rawJob.consignee,
    declarationNo: rawJob.declarationNo,
    businessType: rawJob.businessType,
    customsLane: rawJob.customsLane,
    cargoType: rawJob.cargoType,
    bookingRef: rawJob.bookingRef,
    vesselName: rawJob.vesselName,
    voyageNo: rawJob.voyageNo,
    hbl: rawJob.hbl,
    mbl: rawJob.mbl,
    containerNo: rawJob.containerNo,
    cargoUnit: rawJob.cargoUnit,
    cargoQuantity: rawJob.cargoQuantity,
    weightKg: rawJob.weightKg,
    volumeCbm: rawJob.volumeCbm,
    sealNo: rawJob.sealNo,
    etd: rawJob.etd,
    eta: rawJob.eta,
    atd: rawJob.atd,
    ata: rawJob.ata,
    actualDeliveryDate: rawJob.actualDeliveryDate,
    pol: rawJob.pol,
    pod: rawJob.pod,
    origin: rawJob.origin,
    destination: rawJob.destination,
    notes: rawJob.notes,
    internalNotes: rawJob.internalNotes
  };
}

function JobDetailContent() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [debtPreview, setDebtPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const {
    data: jobData,
    isLoading: jobLoading,
    error: jobError,
    refetch: refetchJob
  } = useGetJobByIdQuery(jobId, { skip: !jobId });

  const { data: partnersData } = useGetPartnersQuery();
  const { data: branchesData } = useGetBranchesQuery();
  const { data: usersData } = useGetUsersQuery();

  const [fetchDebtPreview] = useGetJobDebtPreviewMutation();
  const [updateJob] = useUpdateJobMutation();
  const [copyJob] = useCopyJobMutation();
  const [cancelJob] = useCancelJobMutation();

  const partners = useMemo(() => partnersData?.items || [], [partnersData]);
  const partnerOptions = useMemo(
    () => partners.map((item) => ({ value: item.backendId, label: `${item.code} - ${item.name}` })),
    [partners]
  );

  const agentOptions = useMemo(
    () =>
      partners
        .filter((item) => ['AGENT', 'CARRIER', 'BOTH'].includes(item.partnerType))
        .map((item) => ({ value: item.backendId, label: `${item.code} - ${item.name}` })),
    [partners]
  );

  const branchOptions = useMemo(
    () =>
      (branchesData || []).map((item) => ({
        value: item.backendId,
        label: `${item.code} - ${item.name}`
      })),
    [branchesData]
  );

  const selectedBranchId = Form.useWatch('branchId', form);
  const selectedPartnerId = Form.useWatch('partnerId', form);
  const selectedDebtAmount = Form.useWatch('debtAmount', form);

  const userOptions = useMemo(
    () =>
      (usersData || [])
        .filter((u) => {
          if (!u.isActive) return false;
          if (selectedBranchId && u.branchId && u.branchId !== selectedBranchId) return false;
          return true;
        })
        .map((item) => ({
          value: item.backendId,
          label: item.fullName || item.username
        })),
    [usersData, selectedBranchId]
  );

  const raw = jobData || {};

  useEffect(() => {
    if (jobData && !formLoaded && !jobLoading) {
      form.setFieldsValue({
        jobCode: raw.jobCode || raw.job_no,
        jobType: raw.jobType,
        shipmentMode: raw.shipmentMode,
        status: raw.status,
        partnerId: raw.partnerId,
        branchId: raw.branchId,
        assignedUserId: raw.assignedUserId,
        agentId: raw.agentId,
        debtAmount: raw.debtAmount === null || raw.debtAmount === undefined ? null : Number(raw.debtAmount),
        shipper: raw.shipper,
        consignee: raw.consignee,
        declarationNo: raw.declarationNo,
        businessType: raw.businessType,
        customsLane: raw.customsLane,
        cargoType: raw.cargoType,
        containerNo: raw.containerNo,
        cargoUnit: raw.cargoUnit,
        cargoQuantity: raw.cargoQuantity === null || raw.cargoQuantity === undefined ? null : Number(raw.cargoQuantity),
        weightKg: raw.weightKg === null || raw.weightKg === undefined ? null : Number(raw.weightKg),
        volumeCbm: raw.volumeCbm === null || raw.volumeCbm === undefined ? null : Number(raw.volumeCbm),
        sealNo: raw.sealNo,
        notes: raw.notes,
        vesselName: raw.vesselName,
        voyageNo: raw.voyageNo,
        pol: raw.pol,
        pod: raw.pod,
        origin: raw.origin,
        destination: raw.destination,
        etd: toDatePickerValue(raw.etd),
        eta: toDatePickerValue(raw.eta),
        atd: toDatePickerValue(raw.atd),
        ata: toDatePickerValue(raw.ata),
        actualDeliveryDate: toDatePickerValue(raw.actualDeliveryDate)
      });
      setFormLoaded(true);
    }
  }, [jobData, formLoaded, jobLoading, form, raw]);

  useEffect(() => {
    let active = true;

    if (!selectedPartnerId || !jobId) {
      setDebtPreview(null);
      setPreviewLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await fetchDebtPreview({
          partnerId: selectedPartnerId,
          jobId: Number(jobId),
          debtAmount: Number(selectedDebtAmount || 0)
        }).unwrap();
        if (active) setDebtPreview(result);
      } catch {
        if (active) setDebtPreview(null);
      } finally {
        if (active) setPreviewLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedPartnerId, selectedDebtAmount, jobId, fetchDebtPreview]);

  const isTerminal = TERMINAL_STATUSES.includes(raw.status);

  const revenueEntries = raw.revenueEntries || raw.revenue || [];
  const costEntries = raw.costEntries || raw.cost || [];
  const revenueTotal = revenueEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const costTotal = costEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profitTotal = Number(raw.profitSummary?.profit ?? revenueTotal - costTotal);
  const paymentStatus = raw.paymentSummary?.status;
  const paymentLabels = {
    UNPAID: t('jobForm.paymentUnpaid'),
    PARTIAL: t('jobForm.paymentPartial'),
    PAID: t('jobForm.paymentPaid')
  };
  const paymentColors = { UNPAID: 'orange', PARTIAL: 'blue', PAID: 'green' };

  const entryColumns = [
    { title: t('jobForm.description'), dataIndex: 'description', key: 'description' },
    { title: t('jobForm.status'), dataIndex: 'status', key: 'status', width: 120 },
    {
      title: t('jobForm.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (value) => formatCurrency(value)
    }
  ];

  async function onFinish(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(convertDateFields(values, JOB_DATE_FIELDS));
      delete payload.jobCode;

      if (debtPreview?.hasPolicy) {
        payload.debtAmount = Number(values.debtAmount || 0);
        if (debtPreview.exceedsLimit) {
          message.error('Công nợ vượt hạn mức, không thể lưu lô hàng. Vui lòng nâng hạn mức trong Chính sách công nợ.');
          setSaving(false);
          return;
        }
      } else {
        payload.debtAmount = null;
      }

      await updateJob({ id: jobId, ...payload }).unwrap();
      message.success(t('jobForm.updateSuccess'));
      setFormLoaded(false);
      refetchJob();
    } catch (err) {
      message.error(getApiError(err, t, 'jobForm.updateError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyJob() {
    if (!jobData) return;

    try {
      await copyJob({ id: jobId, ...buildCopyPayload(raw) }).unwrap();
      message.success(t('jobForm.copySuccess'));
      router.push('/jobs');
    } catch (err) {
      message.error(getApiError(err, t, 'jobForm.copyError'));
    }
  }

  async function handleCancelJob() {
    try {
      await cancelJob(jobId).unwrap();
      message.success(t('jobForm.cancelSuccess'));
      setFormLoaded(false);
      refetchJob();
    } catch (err) {
      message.error(getApiError(err, t, 'jobForm.cancelError'));
    }
  }

  if (jobLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  const errorMessage = !jobId ? t('jobForm.missingJobId') : jobError ? t('jobForm.loadError') : '';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader
          title={t('jobForm.detailTitle', { code: raw.jobCode || raw.job_no || '' })}
          breadcrumbs={[
            { label: t('jobForm.breadcrumbJobs'), path: '/jobs' },
            { label: raw.jobCode || raw.job_no || t('jobForm.breadcrumbDetail') }
          ]}
          actions={
            <Space wrap>
              <Button onClick={() => router.push('/jobs')}>{t('jobForm.back')}</Button>
              <Popconfirm title={t('jobForm.copyConfirm')} okText={t('jobForm.copy')} onConfirm={handleCopyJob}>
                <Button icon={<CopyOutlined />}>{t('jobForm.copy')}</Button>
              </Popconfirm>
              <Popconfirm
                title={t('jobForm.cancelJobConfirm')}
                description={t('jobForm.cancelJobDescription')}
                okText={t('jobForm.cancelJob')}
                okButtonProps={{ danger: true }}
                onConfirm={handleCancelJob}
              >
                <Button danger icon={<StopOutlined />} disabled={isTerminal}>
                  {t('jobForm.cancelJob')}
                </Button>
              </Popconfirm>
              <Button type="primary" loading={saving} disabled={isTerminal} onClick={() => form.submit()}>
                {t('jobForm.save')}
              </Button>
            </Space>
          }
        />

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} /> : null}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <Card title={<Space><BankOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardCustomer')}</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="jobCode" label={t('jobForm.jobNo')}>
                        <Input disabled size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="partnerId" label={t('jobForm.customer')} rules={[{ required: true, message: t('jobForm.customerRequired') }]}>
                        <Select showSearch optionFilterProp="label" options={partnerOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    {selectedPartnerId ? (
                      <Col span={24}>
                        {previewLoading && !debtPreview ? (
                          <Alert type="info" showIcon message="Đang kiểm tra chính sách công nợ..." />
                        ) : debtPreview?.hasPolicy ? (
                          <div style={{ border: '1px solid #d9e6f7', borderRadius: 12, padding: '16px 16px 4px 16px', background: '#f7fbff', marginBottom: 8 }}>
                            {previewLoading ? (
                              <Alert
                                style={{ marginBottom: 12 }}
                                type="info"
                                showIcon
                                message="Đang cập nhật công nợ thực tế..."
                              />
                            ) : null}
                            {/* Hàng 1: input công nợ + thời gian áp dụng */}
                            <Row gutter={[16, 12]} style={{ marginBottom: 4 }}>
                              <Col xs={24} md={12}>
                                <Form.Item name="debtAmount" label="Giá trị công nợ lô hàng này" style={{ marginBottom: 0 }}>
                                  <InputNumber {...decimalInputProps} min={0} precision={2} style={{ width: '100%' }} placeholder="Nhập giá trị công nợ" size="large" disabled={isTerminal} />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Alert
                                  style={{ width: '100%' }}
                                  type="info"
                                  showIcon
                                  message={`Thời gian áp dụng: ${debtPreview.policy?.startDate || '-'} → ${debtPreview.policy?.endDate || 'Vô thời hạn'}`}
                                />
                              </Col>
                            </Row>
                            {/* Hàng 2: 3 chỉ số công nợ */}
                            <Row gutter={[16, 12]} style={{ marginTop: 12, marginBottom: 4 }}>
                              <Col xs={24} md={8}>
                                <Statistic title="Hạn mức công nợ" value={debtPreview.policy?.maxDebtAmount || 0} formatter={formatCurrency} />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic title="Số ngày nợ tối đa" value={debtPreview.policy?.maxDebtAgeDays || 0} suffix=" ngày" />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic title="Công nợ thực tế" value={debtPreview.actualDebt || 0} formatter={formatCurrency} />
                              </Col>
                            </Row>
                            {/* Hàng 3: trạng thái vượt/không vượt hạn mức */}
                            <Row style={{ marginTop: 8, marginBottom: 8 }}>
                              <Col span={24}>
                                {debtPreview.exceedsLimit ? (
                                  <Alert
                                    type="warning"
                                    showIcon
                                    message={`Công nợ thực tế ${formatCurrency(debtPreview.actualDebt)} vượt hạn mức. Không thể lưu lô hàng; vui lòng nâng hạn mức trong Chính sách công nợ.`}
                                  />
                                ) : (
                                  <Alert type="success" showIcon message="Công nợ hiện tại đang trong hạn mức." />
                                )}
                              </Col>
                            </Row>
                          </div>
                        ) : (
                          <Alert type="info" showIcon message="Khách hàng này chưa có chính sách công nợ. Hệ thống sẽ ẩn phần nhập công nợ." />
                        )}
                      </Col>
                    ) : null}
                    <Col xs={24} md={12}>
                      <Form.Item name="branchId" label={t('jobForm.branch')}>
                        <Select allowClear showSearch optionFilterProp="label" options={branchOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="assignedUserId" label={t('jobForm.assignedUser')}>
                        <Select allowClear showSearch optionFilterProp="label" options={userOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="shipper" label={t('jobForm.shipper')}>
                        <Input placeholder={t('jobForm.shipperPlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="consignee" label={t('jobForm.consignee')}>
                        <Input placeholder={t('jobForm.consigneePlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="agentId" label={t('jobForm.agentCarrier')}>
                        <Select allowClear showSearch optionFilterProp="label" options={agentOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={<Space><FileTextOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardDeclaration')}</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="declarationNo" label={t('jobForm.declarationNo')}>
                        <Input placeholder={t('jobForm.declarationPlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="businessType" label={t('jobForm.businessType')}>
                        <Input placeholder={t('jobForm.businessTypePlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="customsLane" label={t('jobForm.customsLane')}>
                        <Select allowClear options={getCustomsLaneOptions(t)} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoType" label={t('jobForm.cargoType')} rules={[{ required: true, message: t('jobForm.cargoTypeRequired') }]}>
                        <Select options={getCargoTypeOptions(t)} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="containerNo" label={t('jobForm.containerNo')}>
                        <Input placeholder={t('jobForm.containerPlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="sealNo" label={t('jobForm.sealNo')}>
                        <Input placeholder={t('jobForm.sealPlaceholder')} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoUnit" label="Don vi tinh lo hang">
                        <Select allowClear options={getCargoUnitOptions()} size="large" placeholder="Chon don vi tinh" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoQuantity" label="So luong theo don vi lo">
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder="VD: 2 cont / 1500 kg" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="weightKg" label="Trong luong (kg)">
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder="VD: 12000" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="volumeCbm" label="Khoi luong (CBM)">
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder="VD: 28.5" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="notes" label={t('jobForm.notes')}>
                        <Input.TextArea rows={3} placeholder={t('jobForm.notesPlaceholder')} disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={t('jobForm.cardAccounting')}>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}><Statistic title={t('jobForm.revenue')} value={revenueTotal} formatter={formatCurrency} /></Col>
                    <Col xs={24} md={8}><Statistic title={t('jobForm.cost')} value={costTotal} formatter={formatCurrency} /></Col>
                    <Col xs={24} md={8}><Statistic title={t('jobForm.profit')} value={profitTotal} formatter={formatCurrency} /></Col>
                  </Row>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label={t('jobForm.backendProfitStatus')}>{raw.profitSummary?.status || t('jobForm.cannotVerify')}</Descriptions.Item>
                    <Descriptions.Item label={t('jobForm.paymentStatus')}>
                      {paymentStatus ? <Tag color={paymentColors[paymentStatus]}>{paymentLabels[paymentStatus] || paymentStatus}</Tag> : t('jobForm.cannotVerify')}
                    </Descriptions.Item>
                  </Descriptions>
                  <h4 style={{ marginTop: 20 }}>{t('jobForm.revenue')}</h4>
                  <Table rowKey="id" columns={entryColumns} dataSource={revenueEntries} pagination={false} size="small" />
                  <h4 style={{ marginTop: 20 }}>{t('jobForm.cost')}</h4>
                  <Table rowKey="id" columns={entryColumns} dataSource={costEntries} pagination={false} size="small" />
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<Space><CompassOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardShipment')}</Space>}>
                <Form.Item name="jobType" label={t('jobForm.jobType')} rules={[{ required: true, message: t('jobForm.jobTypeRequired') }]}>
                  <Select options={getJobTypeOptions(t)} size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="shipmentMode" label={t('jobForm.shipmentMode')} rules={[{ required: true, message: t('jobForm.shipmentModeRequired') }]}>
                  <Select options={getShipmentModeOptions(t)} size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="status" label={t('jobForm.status')}>
                  <Select options={getJobStatusOptions(t)} size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="vesselName" label={t('jobForm.vessel')}>
                      <Input placeholder={t('jobForm.vessel')} size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="voyageNo" label={t('jobForm.voyage')}>
                      <Input placeholder={t('jobForm.voyage')} size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="pol" label={t('jobForm.pol')}>
                      <Input placeholder={t('jobForm.polPlaceholder')} size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="pod" label={t('jobForm.pod')}>
                      <Input placeholder={t('jobForm.podPlaceholder')} size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="origin" label={t('jobForm.origin')}>
                  <Input placeholder={t('jobForm.origin')} size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="destination" label={t('jobForm.destination')}>
                  <Input placeholder={t('jobForm.destination')} size="large" disabled={isTerminal} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="etd" label={t('jobForm.etd')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="eta" label={t('jobForm.eta')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="atd" label={t('jobForm.atd')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ata" label={t('jobForm.ata')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="actualDeliveryDate" label={t('jobForm.actualDeliveryDate')}>
                  <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </DashboardLayout>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
            <Spin size="large" />
          </div>
        </DashboardLayout>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
