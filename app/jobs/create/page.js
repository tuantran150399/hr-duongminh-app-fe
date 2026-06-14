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
  App
} from 'antd';
import { BankOutlined, CompassOutlined, FileTextOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/components/AppProviders';
import { useCreateJobMutation } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetUsersQuery, useGetBranchesQuery } from '@/store/services/adminApi';
import { normalizePartner } from '@/utils/apiMappers';
import { cleanPayload, convertDateFields } from '@/utils/formUtils';
import { getApiError } from '@/utils/getApiError';
import {
  getJobTypeOptions,
  getShipmentModeOptions,
  getCustomsLaneOptions,
  getCargoTypeOptions,
  JOB_DATE_FIELDS
} from '@/config/jobConstants';

export default function CreateJobPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

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

  const selectedBranchId = Form.useWatch('branchId', form);

  const userOptions = useMemo(
    () =>
      (usersData || [])
        .filter((u) => {
          if (!u.isActive) return false;
          if (selectedBranchId && u.branchId && u.branchId !== selectedBranchId) return false;
          return true;
        })
        .map((item) => ({ value: item.backendId, label: item.fullName || item.username })),
    [usersData, selectedBranchId]
  );

  async function onFinish(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(convertDateFields(values, JOB_DATE_FIELDS));
      delete payload.status;
      await createJob(payload).unwrap();
      message.success(t('jobForm.createSuccess'));
      router.push('/jobs');
    } catch (err) {
      message.error(getApiError(err, t, 'jobForm.createError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader
          title={t('jobForm.createTitle')}
          breadcrumbs={[
            { label: t('jobForm.breadcrumbJobs'), path: '/jobs' },
            { label: t('jobForm.breadcrumbCreate') }
          ]}
          actions={
            <Space>
              <Button onClick={() => router.push('/jobs')}>{t('jobForm.cancel')}</Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()} style={{ padding: '0 20px', fontWeight: 500 }}>
                {t('jobForm.createJob')}
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
                <Card title={<Space><BankOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardCustomer')}</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="jobCode" label={t('jobForm.jobNo')} rules={[{ required: true, message: t('jobForm.jobNoRequired') }]}>
                        <Input placeholder={t('jobForm.jobNoPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="partnerId" label={t('jobForm.customer')} rules={[{ required: true, message: t('jobForm.customerRequired') }]}>
                        <Select loading={loadingOptions} showSearch optionFilterProp="label" options={partnerOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="branchId" label={t('jobForm.branch')}>
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={branchOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="assignedUserId" label={t('jobForm.assignedUser')}>
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={userOptions} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="shipper" label={t('jobForm.shipper')}>
                        <Input placeholder={t('jobForm.shipperPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="consignee" label={t('jobForm.consignee')}>
                        <Input placeholder={t('jobForm.consigneePlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="agentId" label={t('jobForm.agentCarrier')}>
                        <Select loading={loadingOptions} allowClear showSearch optionFilterProp="label" options={agentOptions} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={<Space><FileTextOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardDeclaration')}</Space>}>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="declarationNo" label={t('jobForm.declarationNo')}>
                        <Input placeholder={t('jobForm.declarationPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="businessType" label={t('jobForm.businessType')}>
                        <Input placeholder={t('jobForm.businessTypePlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="customsLane" label={t('jobForm.customsLane')}>
                        <Select allowClear options={getCustomsLaneOptions(t)} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoType" label={t('jobForm.cargoType')} rules={[{ required: true, message: t('jobForm.cargoTypeRequired') }]}>
                        <Select options={getCargoTypeOptions(t)} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="containerNo" label={t('jobForm.containerNo')}>
                        <Input placeholder={t('jobForm.containerPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="sealNo" label={t('jobForm.sealNo')}>
                        <Input placeholder={t('jobForm.sealPlaceholder')} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="notes" label={t('jobForm.notes')}>
                        <Input.TextArea rows={3} placeholder={t('jobForm.notesPlaceholder')} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<Space><CompassOutlined style={{ color: '#0057c2' }} />{t('jobForm.cardShipment')}</Space>}>
                <Form.Item name="jobType" label={t('jobForm.jobType')} rules={[{ required: true, message: t('jobForm.jobTypeRequired') }]}>
                  <Select options={getJobTypeOptions(t)} size="large" />
                </Form.Item>
                <Form.Item name="shipmentMode" label={t('jobForm.shipmentMode')} rules={[{ required: true, message: t('jobForm.shipmentModeRequired') }]}>
                  <Select options={getShipmentModeOptions(t)} size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="vesselName" label={t('jobForm.vessel')}>
                      <Input placeholder={t('jobForm.vessel')} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="voyageNo" label={t('jobForm.voyage')}>
                      <Input placeholder={t('jobForm.voyage')} size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="pol" label={t('jobForm.pol')}>
                      <Input placeholder={t('jobForm.polPlaceholder')} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="pod" label={t('jobForm.pod')}>
                      <Input placeholder={t('jobForm.podPlaceholder')} size="large" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="origin" label={t('jobForm.origin')}>
                  <Input placeholder={t('jobForm.origin')} size="large" />
                </Form.Item>
                <Form.Item name="destination" label={t('jobForm.destination')}>
                  <Input placeholder={t('jobForm.destination')} size="large" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="etd" label={t('jobForm.etd')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="eta" label={t('jobForm.eta')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="atd" label={t('jobForm.atd')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ata" label={t('jobForm.ata')}>
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="actualDeliveryDate" label={t('jobForm.actualDeliveryDate')}>
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
