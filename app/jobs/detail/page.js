'use client';

import { Suspense, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  message
} from 'antd';
import {
  BankOutlined,
  CopyOutlined,
  CompassOutlined,
  FileTextOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import {
  useGetJobByIdQuery,
  useUpdateJobMutation,
  useCopyJobMutation,
  useCancelJobMutation
} from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetUsersQuery, useGetBranchesQuery } from '@/store/services/adminApi';
import { normalizePartner } from '@/utils/apiMappers';
import { cleanPayload, convertDateFields, toDatePickerValue } from '@/utils/formUtils';
import { formatCurrency } from '@/utils/format';
import {
  jobTypeOptions,
  shipmentModeOptions,
  jobStatusOptions,
  customsLaneOptions,
  cargoTypeOptions,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('id');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  // RTK Query hooks
  const {
    data: jobData,
    isLoading: jobLoading,
    error: jobError,
    refetch: refetchJob
  } = useGetJobByIdQuery(jobId, { skip: !jobId });

  const { data: partnersData } = useGetPartnersQuery();
  const { data: branchesData } = useGetBranchesQuery();
  const { data: usersData } = useGetUsersQuery();

  const [updateJob] = useUpdateJobMutation();
  const [copyJob] = useCopyJobMutation();
  const [cancelJob] = useCancelJobMutation();

  // Build dropdown options
  const partners = useMemo(() => {
    const items = partnersData?.items || [];
    return items.map(normalizePartner).filter(Boolean);
  }, [partnersData]);

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

  const userOptions = useMemo(
    () =>
      (usersData || []).map((item) => ({
        value: item.backendId,
        label: item.fullName || item.username
      })),
    [usersData]
  );

  // Populate form when job data loads
  const raw = jobData || {};
  if (jobData && !formLoaded && !jobLoading) {
    const formValues = {
      jobCode: raw.jobCode || raw.job_no,
      jobType: raw.jobType,
      shipmentMode: raw.shipmentMode,
      status: raw.status,
      partnerId: raw.partnerId,
      branchId: raw.branchId,
      assignedUserId: raw.assignedUserId,
      agentId: raw.agentId,
      shipper: raw.shipper,
      consignee: raw.consignee,
      declarationNo: raw.declarationNo,
      businessType: raw.businessType,
      customsLane: raw.customsLane,
      cargoType: raw.cargoType,
      containerNo: raw.containerNo,
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
    };
    form.setFieldsValue(formValues);
    setFormLoaded(true);
  }

  const isTerminal = TERMINAL_STATUSES.includes(raw.status);

  const revenueEntries = raw.revenueEntries || raw.revenue || [];
  const costEntries = raw.costEntries || raw.cost || [];
  const revenueTotal = revenueEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const costTotal = costEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const profitTotal = Number(raw.profitSummary?.profit ?? revenueTotal - costTotal);

  const entryColumns = [
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
    {
      title: 'Amount',
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
      delete payload.status;
      await updateJob({ id: jobId, ...payload }).unwrap();
      message.success('Job updated.');
      setFormLoaded(false);
      refetchJob();
    } catch (err) {
      message.error(err?.data?.message || 'Unable to update job.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyJob() {
    if (!jobData) return;

    try {
      await copyJob({ id: jobId, ...buildCopyPayload(raw) }).unwrap();
      message.success('Job copied.');
      router.push('/jobs');
    } catch (err) {
      message.error(err?.data?.message || 'Unable to copy job.');
    }
  }

  async function handleCancelJob() {
    try {
      await cancelJob(jobId).unwrap();
      message.success('Job cancelled.');
      setFormLoaded(false);
      refetchJob();
    } catch (err) {
      message.error(err?.data?.message || 'Unable to cancel job.');
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

  const errorMessage = !jobId ? 'Missing job id.' : jobError ? 'Unable to load this job from the backend.' : '';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader
          title={`Job ${raw.jobCode || raw.job_no || ''}`}
          breadcrumbs={[
            { label: 'Jobs', path: '/jobs' },
            { label: raw.jobCode || raw.job_no || 'Job detail' }
          ]}
          actions={
            <Space wrap>
              <Button onClick={() => router.push('/jobs')}>Back</Button>
              <Popconfirm title="Copy this job?" okText="Copy" onConfirm={handleCopyJob}>
                <Button icon={<CopyOutlined />}>Copy</Button>
              </Popconfirm>
              <Popconfirm
                title="Cancel this job?"
                description="Cancelled jobs cannot be edited by the backend business rules."
                okText="Cancel Job"
                okButtonProps={{ danger: true }}
                onConfirm={handleCancelJob}
              >
                <Button danger icon={<StopOutlined />} disabled={isTerminal}>
                  Cancel Job
                </Button>
              </Popconfirm>
              <Button type="primary" loading={saving} disabled={isTerminal} onClick={() => form.submit()}>
                Save
              </Button>
            </Space>
          }
        />

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} /> : null}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <Card title={<Space><BankOutlined style={{ color: '#0057c2' }} />Customer and Assignment</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="jobCode" label="Job No.">
                        <Input disabled size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="partnerId" label="Customer" rules={[{ required: true, message: 'Customer is required.' }]}>
                        <Select showSearch optionFilterProp="label" options={partnerOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="branchId" label="Branch">
                        <Select allowClear showSearch optionFilterProp="label" options={branchOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="assignedUserId" label="Assigned User">
                        <Select allowClear showSearch optionFilterProp="label" options={userOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="shipper" label="Shipper">
                        <Input placeholder="Shipper name" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="consignee" label="Consignee">
                        <Input placeholder="Consignee name" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="agentId" label="Agent / Carrier">
                        <Select allowClear showSearch optionFilterProp="label" options={agentOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={<Space><FileTextOutlined style={{ color: '#0057c2' }} />Declaration and Cargo</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="declarationNo" label="Customs Declaration No.">
                        <Input placeholder="Declaration number" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="businessType" label="Business Type">
                        <Input placeholder="Business type" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="customsLane" label="Customs Lane">
                        <Select allowClear options={customsLaneOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoType" label="Cargo Type" rules={[{ required: true, message: 'Cargo type is required.' }]}>
                        <Select options={cargoTypeOptions} size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="containerNo" label="Container No.">
                        <Input placeholder="Container number" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="sealNo" label="Seal No.">
                        <Input placeholder="Seal number" size="large" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} placeholder="Operational notes" disabled={isTerminal} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Job Accounting">
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}><Statistic title="Revenue" value={revenueTotal} formatter={formatCurrency} /></Col>
                    <Col xs={24} md={8}><Statistic title="Cost" value={costTotal} formatter={formatCurrency} /></Col>
                    <Col xs={24} md={8}><Statistic title="Profit" value={profitTotal} formatter={formatCurrency} /></Col>
                  </Row>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Backend profit status">{raw.profitSummary?.status || 'Cannot verify from frontend only'}</Descriptions.Item>
                  </Descriptions>
                  <h4 style={{ marginTop: 20 }}>Revenue</h4>
                  <Table rowKey="id" columns={entryColumns} dataSource={revenueEntries} pagination={false} size="small" />
                  <h4 style={{ marginTop: 20 }}>Cost</h4>
                  <Table rowKey="id" columns={entryColumns} dataSource={costEntries} pagination={false} size="small" />
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<Space><CompassOutlined style={{ color: '#0057c2' }} />Shipment</Space>}>
                <Form.Item name="jobType" label="Job Type" rules={[{ required: true, message: 'Job type is required.' }]}>
                  <Select options={jobTypeOptions} size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="shipmentMode" label="Shipment Mode" rules={[{ required: true, message: 'Shipment mode is required.' }]}>
                  <Select options={shipmentModeOptions} size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="status" label="Status">
                  <Select options={jobStatusOptions} size="large" disabled />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="vesselName" label="Vessel">
                      <Input placeholder="Vessel" size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="voyageNo" label="Voyage">
                      <Input placeholder="Voyage" size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="pol" label="POL">
                      <Input placeholder="Loading port" size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="pod" label="POD">
                      <Input placeholder="Discharge port" size="large" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="origin" label="Origin">
                  <Input placeholder="Origin" size="large" disabled={isTerminal} />
                </Form.Item>
                <Form.Item name="destination" label="Destination">
                  <Input placeholder="Destination" size="large" disabled={isTerminal} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="etd" label="ETD">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="eta" label="ETA">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="atd" label="ATD">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ata" label="ATA">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" disabled={isTerminal} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="actualDeliveryDate" label="Actual Delivery Date">
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
