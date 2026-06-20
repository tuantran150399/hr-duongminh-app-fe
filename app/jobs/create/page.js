'use client';

import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic
} from 'antd';
import { BankOutlined, CompassOutlined, FileTextOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/layouts/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/components/AppProviders';
import { useCreateJobMutation, useGetJobDebtPreviewMutation } from '@/store/services/jobsApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';
import { useGetUsersQuery, useGetBranchesQuery } from '@/store/services/adminApi';
import { cleanPayload, convertDateFields, decimalInputProps } from '@/utils/formUtils';
import { getApiError } from '@/utils/getApiError';
import { formatCurrency } from '@/utils/format';
import {
  getJobTypeOptions,
  getShipmentModeOptions,
  getCustomsLaneOptions,
  getCargoTypeOptions,
  getCargoUnitOptions,
  JOB_DATE_FIELDS
} from '@/config/jobConstants';

export default function CreateJobPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [debtPreview, setDebtPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { message } = App.useApp();

  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery();
  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery();
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery();
  const [createJob] = useCreateJobMutation();
  const [fetchDebtPreview] = useGetJobDebtPreviewMutation();

  const loadingOptions = partnersLoading || branchesLoading || usersLoading;
  const partners = useMemo(() => (partnersData?.items || []).filter((p) => p?.isActive), [partnersData]);
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
        .map((item) => ({ value: item.backendId, label: item.fullName || item.username })),
    [usersData, selectedBranchId]
  );

  useEffect(() => {
    let active = true;

    if (!selectedPartnerId) {
      setDebtPreview(null);
      setPreviewLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await fetchDebtPreview({
          partnerId: selectedPartnerId,
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
  }, [selectedPartnerId, selectedDebtAmount, fetchDebtPreview]);

  async function onFinish(values) {
    setSaving(true);

    try {
      const payload = cleanPayload(convertDateFields(values, JOB_DATE_FIELDS));
      delete payload.status;

      if (debtPreview?.hasPolicy) {
        payload.debtAmount = Number(values.debtAmount || 0);
        if (debtPreview.exceedsLimit) {
          message.error(t('jobForm.debtLimitExceededCreate'));
          setSaving(false);
          return;
        }
      } else {
        payload.debtAmount = null;
      }

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
                    {selectedPartnerId ? (
                      <Col span={24}>
                        {previewLoading && !debtPreview ? (
                          <Alert type="info" showIcon message={t('jobForm.checkingDebtPolicy')} />
                        ) : debtPreview?.hasPolicy ? (
                          <div style={{ border: '1px solid #d9e6f7', borderRadius: 12, padding: '16px 16px 4px 16px', background: '#f7fbff', marginBottom: 8 }}>
                            {previewLoading ? (
                              <Alert
                                style={{ marginBottom: 12 }}
                                type="info"
                                showIcon
                                message={t('jobForm.updatingActualDebt')}
                              />
                            ) : null}
                            {/* Hàng 1: input công nợ + thời gian áp dụng */}
                            <Row gutter={[16, 12]} style={{ marginBottom: 4 }}>
                              <Col xs={24} md={12}>
                                <Form.Item name="debtAmount" label={t('jobForm.thisJobDebtAmount')} style={{ marginBottom: 0 }}>
                                  <InputNumber {...decimalInputProps} min={0} precision={2} style={{ width: '100%' }} placeholder={t('jobForm.thisJobDebtAmountPlaceholder')} size="large" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Alert
                                  style={{ width: '100%' }}
                                  type="info"
                                  showIcon
                                  message={t('jobForm.policyEffectiveTime', { start: debtPreview.policy?.startDate || '-', end: debtPreview.policy?.endDate || t('jobForm.indefinite') })}
                                />
                              </Col>
                            </Row>
                            {/* Hàng 2: 3 chỉ số công nợ */}
                            <Row gutter={[16, 12]} style={{ marginTop: 12, marginBottom: 4 }}>
                              <Col xs={24} md={8}>
                                <Statistic title={t('jobForm.debtLimit')} value={debtPreview.policy?.maxDebtAmount || 0} formatter={formatCurrency} />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic title={t('jobForm.maxDebtAge')} value={debtPreview.policy?.maxDebtAgeDays || 0} suffix={t('jobForm.daysSuffix')} />
                              </Col>
                              <Col xs={24} md={8}>
                                <Statistic title={t('jobForm.actualDebtAmount')} value={debtPreview.actualDebt || 0} formatter={formatCurrency} />
                              </Col>
                            </Row>
                            {/* Hàng 3: trạng thái vượt/không vượt hạn mức */}
                            <Row style={{ marginTop: 8, marginBottom: 8 }}>
                              <Col span={24}>
                                {debtPreview.exceedsLimit ? (
                                  <Alert
                                    type="warning"
                                    showIcon
                                    message={t('jobForm.actualDebtExceedsLimitCreate', { amount: formatCurrency(debtPreview.actualDebt) })}
                                  />
                                ) : (
                                  <Alert type="success" showIcon message={t('jobForm.debtWithinLimit')} />
                                )}
                              </Col>
                            </Row>
                          </div>
                        ) : (
                          <Alert type="info" showIcon message={t('jobForm.noDebtPolicyMessage')} />
                        )}
                      </Col>
                    ) : null}
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
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoUnit" label={t('jobForm.cargoUnit')}>
                        <Select allowClear options={getCargoUnitOptions(t)} size="large" placeholder={t('jobForm.cargoUnitPlaceholder')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="cargoQuantity" label={t('jobForm.cargoQuantity')}>
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder={t('jobForm.cargoQuantityPlaceholder')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="weightKg" label={t('jobForm.weightKg')}>
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder={t('jobForm.weightKgPlaceholder')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="volumeCbm" label={t('jobForm.volumeCbm')}>
                        <InputNumber {...decimalInputProps} min={0} precision={4} style={{ width: '100%' }} size="large" placeholder={t('jobForm.volumeCbmPlaceholder')} />
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
