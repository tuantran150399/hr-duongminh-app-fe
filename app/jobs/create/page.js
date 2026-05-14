'use client';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  message
} from 'antd';
import { BankOutlined, CompassOutlined, FileTextOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { useCreateJobMutation } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetUsersQuery, useGetBranchesQuery } from '@/store/services/adminApi';
import { normalizePartner } from '@/utils/apiMappers';
import { cleanPayload, convertDateFields } from '@/utils/formUtils';
import {
  jobTypeOptions,
  shipmentModeOptions,
  customsLaneOptions,
  cargoTypeOptions,
  JOB_DATE_FIELDS
} from '@/config/jobConstants';

export default function CreateJobPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // RTK Query hooks
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery();
  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery();
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery();
  const [createJob] = useCreateJobMutation();

  const loadingOptions = partnersLoading || branchesLoading || usersLoading;

  // Build options từ RTK Query cache
  const partners = useMemo(() => {
    const items = partnersData?.items || [];
    return items.filter((p) => p?.isActive);
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
      (branchesData || [])
        .filter((b) => b.isActive)
        .map((item) => ({ value: item.backendId, label: `${item.code} - ${item.name}` })),
    [branchesData]
  );

  const userOptions = useMemo(
    () =>
      (usersData || [])
        .filter((u) => u.isActive)
        .map((item) => ({ value: item.backendId, label: item.fullName || item.username })),
    [usersData]
  );

  async function onFinish(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(convertDateFields(values, JOB_DATE_FIELDS));
      delete payload.status;
      await createJob(payload).unwrap();
      message.success('Job created.');
      router.push('/jobs');
    } catch (err) {
      message.error(err?.data?.message || 'Unable to create job.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader
          title="Create Job"
          breadcrumbs={[
            { label: 'Jobs', path: '/jobs' },
            { label: 'Create' }
          ]}
          actions={
            <Space>
              <Button onClick={() => router.push('/jobs')}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()} style={{ padding: '0 20px', fontWeight: 500 }}>
                Create Job
              </Button>
            </Space>
          }
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ jobType: 'IMPORT', shipmentMode: 'SEA_FCL', status: 'DRAFT' }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: '100%' }}>
                <Card title={<Space><BankOutlined style={{ color: '#0057c2' }} />Customer and Assignment</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="jobCode" label="Job No." rules={[{ required: true, message: 'Job No. is required.' }]}>
                        <Input placeholder="JOB-2026-0001" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="partnerId" label="Customer" rules={[{ required: true, message: 'Customer is required.' }]}>
                        <Select loading={loadingOptions} showSearch optionFilterProp="label" options={partnerOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="branchId" label="Branch">
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={branchOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="assignedUserId" label="Assigned User">
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={userOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="shipper" label="Shipper">
                        <Input placeholder="Shipper name" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="consignee" label="Consignee">
                        <Input placeholder="Consignee name" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="agentId" label="Agent / Carrier">
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={agentOptions} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={<Space><FileTextOutlined style={{ color: '#0057c2' }} />Declaration and Cargo</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="declarationNo" label="Customs Declaration No.">
                        <Input placeholder="Declaration number" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="businessType" label="Business Type">
                        <Input placeholder="Processing, production export, trading..." size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="customsLane" label="Customs Lane">
                        <Select allowClear options={customsLaneOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoType" label="Cargo Type" rules={[{ required: true, message: 'Cargo type is required.' }]}>
                        <Select options={cargoTypeOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="containerNo" label="Container No.">
                        <Input placeholder="Container number" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="sealNo" label="Seal No.">
                        <Input placeholder="Seal number" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} placeholder="Operational notes" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<Space><CompassOutlined style={{ color: '#0057c2' }} />Shipment</Space>}>
                <Form.Item name="jobType" label="Job Type" rules={[{ required: true, message: 'Job type is required.' }]}>
                  <Select options={jobTypeOptions} size="large" />
                </Form.Item>
                <Form.Item name="shipmentMode" label="Shipment Mode" rules={[{ required: true, message: 'Shipment mode is required.' }]}>
                  <Select options={shipmentModeOptions} size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="vesselName" label="Vessel">
                      <Input placeholder="Vessel" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="voyageNo" label="Voyage">
                      <Input placeholder="Voyage" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="pol" label="POL">
                      <Input placeholder="Loading port" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="pod" label="POD">
                      <Input placeholder="Discharge port" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="origin" label="Origin">
                  <Input placeholder="Origin" size="large" />
                </Form.Item>
                <Form.Item name="destination" label="Destination">
                  <Input placeholder="Destination" size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="etd" label="ETD">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="eta" label="ETA">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="atd" label="ATD">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ata" label="ATA">
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="actualDeliveryDate" label="Actual Delivery Date">
                  <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </DashboardLayout>
  );
}
