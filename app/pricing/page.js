'use client';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Form,
  Alert,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Statistic,
  Upload,
  App
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RiseOutlined,
  SearchOutlined,
  TagOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import FilterCard from '@/components/FilterCard';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/getApiError';
import { decimalInputProps } from '@/utils/formUtils';
import { useGetServicePricesQuery, useCreateServicePriceMutation, useImportServicePricesMutation, useUpdateServicePriceMutation, useDeleteServicePriceMutation } from '@/store/services/pricingApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';

export default function PricingPage() {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: pricingData, isLoading: loading, error: loadErrorObj } = useGetServicePricesQuery({
    serviceType: typeFilter !== 'all' ? typeFilter : undefined
  });
  const { data: partnersData } = useGetPartnersQuery();
  const [createServicePrice] = useCreateServicePriceMutation();
  const [importServicePrices] = useImportServicePricesMutation();
  const [updateServicePrice] = useUpdateServicePriceMutation();
  const [deleteServicePrice] = useDeleteServicePriceMutation();
  const [editingRecord, setEditingRecord] = useState(null);

  const data = useMemo(() => pricingData?.items || [], [pricingData]);
  const partners = useMemo(() => (partnersData?.items || []).filter(p => p.isActive), [partnersData]);
  const loadError = loadErrorObj ? t('pricing.loadError') : '';

  const serviceTypeOptions = [
    { label: t('pricing.customs'), value: 'CUSTOMS' },
    { label: t('pricing.trucking'), value: 'TRUCKING' },
    { label: t('pricing.seaFreight'), value: 'SEA_FREIGHT' },
    { label: t('pricing.airFreight'), value: 'AIR_FREIGHT' },
    { label: t('pricing.localCharge'), value: 'LOCAL_CHARGE' },
    { label: t('pricing.lcl'), value: 'LCL' },
    { label: t('pricing.other'), value: 'OTHER' }
  ];

  const pricingCategoryOptions = [
    { label: t('pricing.categoryFcl'), value: 'FCL' },
    { label: t('pricing.categoryLcl'), value: 'LCL' },
    { label: t('pricing.categoryWaitingFee'), value: 'WAITING_FEE' },
    { label: t('pricing.categoryDocumentProcedure'), value: 'DOCUMENT_PROCEDURE' },
    { label: t('pricing.categoryOther'), value: 'OTHER' }
  ];

  const calculationTypeOptions = [
    { label: t('pricing.calculationFixed'), value: 'FIXED' },
    { label: t('pricing.calculationPercent'), value: 'PERCENT' }
  ];

  const directionOptions = [
    { label: t('pricing.directionImport'), value: 'IMPORT' },
    { label: t('pricing.directionExport'), value: 'EXPORT' },
    { label: t('pricing.directionBoth'), value: 'BOTH' }
  ];

  const containerSizeOptions = ['20', '40', '45'].map((size) => ({ label: `${size}'`, value: size }));
  const vehicleTypeOptions = ['TRUCK', 'CONTAINER', '1-3 TON', '3-5 TON', '5-8 TON', '8-10 TON'].map((value) => ({ label: value, value }));

  const partnerMap = useMemo(
    () => partners.reduce((result, partner) => {
      result[partner.backendId] = partner;
      return result;
    }, {}),
    [partners]
  );

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((item) => {
      const searchable = [
        partnerMap[item.partnerId]?.name,
        item.pricingCategory,
        item.chargeName,
        item.serviceType,
        item.shipmentMode,
        item.direction,
        item.containerSize,
        item.vehicleType,
        item.routeFrom,
        item.routeTo,
        item.unit,
        item.notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !keyword || searchable.includes(keyword);
    });
  }, [data, partnerMap, search]);

  async function handleSave(values) {
    setSaving(true);

    try {
      const payload = {
        ...values,
        amount: Number(values.amount),
        minQuantity: values.minQuantity === undefined ? undefined : Number(values.minQuantity),
        maxQuantity: values.maxQuantity === undefined ? undefined : Number(values.maxQuantity),
        effectiveFrom: values.effectiveFrom?.format('YYYY-MM-DD'),
        effectiveTo: values.effectiveTo?.format('YYYY-MM-DD')
      };

      if (editingRecord) {
        await updateServicePrice({ id: editingRecord.id, ...payload }).unwrap();
        message.success(t('pricing.updateSuccess'));
      } else {
        await createServicePrice(payload).unwrap();
        message.success(t('pricing.createSuccess'));
      }

      setModalOpen(false);
      setEditingRecord(null);
      form.resetFields();

    } catch (err) {
      message.error(getApiError(err, t, 'pricing.createError'));
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(record) {
    setEditingRecord(record);
    form.setFieldsValue({
      partnerId: record.partnerId,
      pricingCategory: record.pricingCategory,
      chargeName: record.chargeName,
      serviceType: record.serviceType,
      shipmentMode: record.shipmentMode,
      direction: record.direction,
      containerSize: record.containerSize,
      vehicleType: record.vehicleType,
      routeFrom: record.routeFrom,
      routeTo: record.routeTo,
      unit: record.unit,
      currency: record.currency || 'VND',
      calculationType: record.calculationType || 'FIXED',
      amount: record.amount,
      minQuantity: record.minQuantity,
      maxQuantity: record.maxQuantity,
      notes: record.notes
    });
    setModalOpen(true);
  }

  async function handleDelete(record) {
    try {
      await deleteServicePrice(record.id).unwrap();
      message.success(t('pricing.deleteSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'pricing.deleteError'));
    }
  }

  async function handleImport(options) {
    const { file, onError, onSuccess } = options;

    try {
      const result = await importServicePrices(file).unwrap();
      const errorSuffix = result.errorCount ? t('pricing.rowsFailed', { count: result.errorCount }) : '';
      message.success(t('pricing.importSuccess', { created: result.createdCount || 0, updated: result.updatedCount || 0, errorSuffix }));

      onSuccess?.(result);
    } catch (err) {
      const errorMessage = getApiError(err, t, 'pricing.importError');
      message.error(errorMessage);
      onError?.(err);
    }
  }

  const activeTariffs = data.filter((item) => item.isActive !== false).length;
  const averageRate = data.length
    ? Math.round(data.reduce((sum, item) => sum + Number(item.amount || 0), 0) / data.length)
    : 0;
  const coveredRoutes = new Set(data.map((item) => `${item.routeFrom || ''}-${item.routeTo || ''}`)).size;

  const validateQuantityRange = (_, value) => {
    const minQuantity = form.getFieldValue('minQuantity');
    const maxQuantity = value ?? form.getFieldValue('maxQuantity');

    if (
      minQuantity !== undefined &&
      minQuantity !== null &&
      maxQuantity !== undefined &&
      maxQuantity !== null &&
      Number(minQuantity) > Number(maxQuantity)
    ) {
      return Promise.reject(new Error(t('pricing.quantityRangeError')));
    }

    return Promise.resolve();
  };

  const columns = [
    { title: t('pricing.partner'), dataIndex: 'partnerId', key: 'partnerId', render: value => partnerMap[value]?.name || t('pricing.generalTariff') },
    {
      title: t('pricing.category'),
      dataIndex: 'pricingCategory',
      key: 'pricingCategory',
      render: value => {
        const option = pricingCategoryOptions.find(opt => opt.value === value);
        return value ? <Tag color="geekblue">{option?.label || value}</Tag> : '-';
      }
    },
    { title: t('pricing.chargeName'), dataIndex: 'chargeName', key: 'chargeName', render: value => value || '-' },
    { title: t('pricing.serviceType'), dataIndex: 'serviceType', key: 'serviceType', render: value => {
      const option = serviceTypeOptions.find(opt => opt.value === value);
      return <Tag color="blue">{option ? option.label : value}</Tag>;
    } },
    {
      title: t('pricing.priceAttributes'),
      key: 'priceAttributes',
      render: (_, record) => [record.shipmentMode, record.direction, record.containerSize ? `${record.containerSize}'` : null, record.vehicleType]
        .filter(Boolean)
        .join(' / ') || '-'
    },
    {
      title: t('pricing.route'),
      key: 'route',
      render: (_, record) => <strong>{[record.routeFrom, record.routeTo].filter(Boolean).join(' -> ') || '-'}</strong>
    },
    { title: t('pricing.unit'), dataIndex: 'unit', key: 'unit', render: value => value || '-' },
    {
      title: t('pricing.rate'),
      dataIndex: 'amount',
      key: 'rate',
      align: 'right',
      render: (val, record) => (
        <span style={{ fontWeight: 600, color: '#0057c2' }}>
          {record.calculationType === 'PERCENT' ? `${Number(val || 0)}%` : `${formatCurrency(val)} ${record.currency || 'VND'}`}
        </span>
      )
    },
    { title: t('pricing.effectiveTo'), dataIndex: 'effectiveTo', key: 'effectiveTo', render: value => value || '-' },
    {
      title: t('pricing.status'),
      dataIndex: 'isActive',
      key: 'status',
      render: value => <Tag color={value === false ? 'red' : 'green'}>{value === false ? t('pricing.inactive') : t('pricing.active')}</Tag>
    },
    {
      title: t('pricing.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} title={t('pricing.edit')} onClick={() => openEditModal(record)} />
          <Popconfirm title={t('pricing.deleteConfirm')} onConfirm={() => handleDelete(record)}>
            <Button size="small" danger icon={<DeleteOutlined />} title={t('pricing.delete')} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">{t('pricing.title')}</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('pricing.subtitle')}
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} customRequest={handleImport}>
            <Button icon={<CloudUploadOutlined />}>{t('pricing.importExcel')}</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>
            {t('pricing.addTariff')}
          </Button>
        </Space>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('pricing.activeTariffs')} value={activeTariffs} prefix={<TagOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('pricing.averageRate')} value={averageRate} formatter={formatCurrency} prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('pricing.routesCovered')} value={coveredRoutes} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
      </Row>

      <FilterCard
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder={t('pricing.searchPlaceholder')}
        statusValue={typeFilter}
        onStatusChange={setTypeFilter}
        statusOptions={[
          { value: 'all', label: t('pricing.allTypes') },
          ...serviceTypeOptions
        ]}
        showDateRange={false}
      />

      <Card className="table-card">
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description={t('pricing.noRecords')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title={editingRecord ? t('pricing.editTariffTitle') : t('pricing.addTariffTitle')}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="partnerId" label={t('pricing.partner')}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={partners.map((partner) => ({
                value: partner.backendId,
                label: `${partner.code} - ${partner.name}`
              }))}
              placeholder={t('pricing.partnerPlaceholder')}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pricingCategory" label={t('pricing.category')}>
                <Select allowClear options={pricingCategoryOptions} placeholder={t('pricing.categoryPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chargeName" label={t('pricing.chargeName')}>
                <Input placeholder={t('pricing.chargeNamePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serviceType" label={t('pricing.serviceType')} rules={[{ required: true, message: t('pricing.serviceTypeRequired') }]}>
                <Select options={serviceTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shipmentMode" label={t('pricing.shipmentMode')}>
                <Input placeholder={t('pricing.shipmentModePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="direction" label={t('pricing.direction')}>
                <Select allowClear options={directionOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="containerSize" label={t('pricing.containerSize')}>
                <Select allowClear options={containerSizeOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vehicleType" label={t('pricing.vehicleType')}>
                <Select allowClear showSearch optionFilterProp="label" options={vehicleTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="routeFrom" label={t('pricing.routeFrom')}>
                <Input placeholder={t('pricing.routeFromPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="routeTo" label={t('pricing.routeTo')}>
                <Input placeholder={t('pricing.routeToPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit" label={t('pricing.unit')}>
                <Input placeholder={t('pricing.unitPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label={t('pricing.currency')} initialValue="VND">
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('pricing.rate')} rules={[{ required: true, message: t('pricing.rateRequired') }]}>
                <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calculationType" label={t('pricing.calculationType')} initialValue="FIXED">
                <Select options={calculationTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="minQuantity"
                label={t('pricing.minQuantity')}
                dependencies={['maxQuantity']}
                rules={[{ validator: validateQuantityRange }]}
              >
                <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxQuantity"
                label={t('pricing.maxQuantity')}
                dependencies={['minQuantity']}
                rules={[{ validator: validateQuantityRange }]}
              >
                <InputNumber {...decimalInputProps} style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="effectiveFrom" label={t('pricing.effectiveFrom')}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="effectiveTo" label={t('pricing.effectiveTo')}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={t('pricing.notes')}>
            <Input.TextArea rows={3} placeholder={t('pricing.notes')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
