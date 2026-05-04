'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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
  Typography,
  message
} from 'antd';
import {
  BankOutlined,
  CopyOutlined,
  CompassOutlined,
  FileTextOutlined,
  RightOutlined,
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import { cancelJob, copyJob, getJobById, updateJob } from '@/services/jobService';
import { getPartners } from '@/services/partnerService';
import { getBranches, getUsers } from '@/services/adminService';
import { formatCurrency } from '@/utils/format';

const { Title } = Typography;

const jobTypeOptions = [
  { value: 'IMPORT', label: 'Import' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'DOMESTIC', label: 'Domestic' }
];

const shipmentModeOptions = [
  { value: 'SEA_FCL', label: 'Sea FCL' },
  { value: 'SEA_LCL', label: 'Sea LCL' },
  { value: 'AIR', label: 'Air' },
  { value: 'ROAD', label: 'Road' },
  { value: 'RAIL', label: 'Rail' }
];

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const customsLaneOptions = [
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
  { value: 'RED', label: 'Red' }
];

const cargoTypeOptions = [
  { value: 'FCL', label: 'FCL' },
  { value: 'LCL', label: 'LCL' },
  { value: 'AIR', label: 'Air' },
  { value: 'BULK', label: 'Bulk cargo' }
];

function toDateString(value) {
  return value?.format ? value.format('YYYY-MM-DD') : value || undefined;
}

function toDatePickerValue(value) {
  if (!value) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function cleanPayload(values) {
  const payload = {
    ...values,
    etd: toDateString(values.etd),
    eta: toDateString(values.eta),
    atd: toDateString(values.atd),
    ata: toDateString(values.ata),
    actualDeliveryDate: toDateString(values.actualDeliveryDate)
  };

  delete payload.jobCode;

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

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
  const [job, setJob] = useState(null);
  const [partners, setPartners] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadJob() {
    if (!jobId) {
      setError('Missing job id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [jobData, partnerItems, branchItems, userItems] = await Promise.all([
        getJobById(jobId),
        getPartners(),
        getBranches(),
        getUsers()
      ]);
      const raw = jobData.raw || {};
      setJob(jobData);
      setPartners(partnerItems);
      setBranches(branchItems);
      setUsers(userItems);
      form.setFieldsValue({
        jobCode: raw.jobCode || jobData.job_no,
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
      });
    } catch {
      setError('Unable to load this job from the backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJob();
    }, 0);

    return () => clearTimeout(timer);
    // loadJob intentionally stays outside the dependency list because it is reused by save/cancel handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

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
    () => branches.map((item) => ({ value: item.backendId, label: `${item.code} - ${item.name}` })),
    [branches]
  );

  const userOptions = useMemo(
    () => users.map((item) => ({ value: item.backendId, label: item.fullName || item.username })),
    [users]
  );

  async function onFinish(values) {
    setSaving(true);

    try {
      await updateJob(jobId, cleanPayload(values));
      message.success('Job updated.');
      await loadJob();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to update job.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyJob() {
    if (!job?.raw) return;

    try {
      await copyJob(jobId, buildCopyPayload(job.raw));
      message.success('Job copied.');
      router.push('/jobs');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to copy job.');
    }
  }

  async function handleCancelJob() {
    try {
      await cancelJob(jobId);
      message.success('Job cancelled.');
      await loadJob();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Unable to cancel job.');
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    );
  }

  const revenueTotal = (job?.revenue || []).reduce((total, item) => total + Number(item.amount || 0), 0);
  const costTotal = (job?.cost || []).reduce((total, item) => total + Number(item.amount || 0), 0);
  const profitTotal = Number(job?.profitSummary?.profit ?? revenueTotal - costTotal);
  const isTerminal = ['CLOSED', 'CANCELLED'].includes(job?.raw?.status);

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

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#414755', fontSize: 12, marginBottom: 4 }}>
              <a onClick={() => router.push('/jobs')} style={{ color: 'inherit', cursor: 'pointer' }}>Jobs</a>
              <RightOutlined style={{ fontSize: 10 }} />
              <span style={{ color: '#1b1b1b' }}>{job?.job_no || 'Job detail'}</span>
            </div>
            <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1b1b1b' }}>
              Job {job?.job_no || ''}
            </Title>
          </div>
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
        </div>

        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

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
                    <Descriptions.Item label="Backend profit status">{job?.profitSummary?.status || 'Cannot verify from frontend only'}</Descriptions.Item>
                  </Descriptions>
                  <Title level={5} style={{ marginTop: 20 }}>Revenue</Title>
                  <Table rowKey="id" columns={entryColumns} dataSource={job?.revenue || []} pagination={false} size="small" />
                  <Title level={5} style={{ marginTop: 20 }}>Cost</Title>
                  <Table rowKey="id" columns={entryColumns} dataSource={job?.cost || []} pagination={false} size="small" />
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
                  <Select options={statusOptions} size="large" disabled={isTerminal} />
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
