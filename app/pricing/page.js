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
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Statistic,
  Upload
} from 'antd';
import {
  CloudUploadOutlined,
  PlusOutlined,
  RiseOutlined,
  SearchOutlined,
  TagOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { formatCurrency } from '@/utils/format';
import { useGetServicePricesQuery, useCreateServicePriceMutation, useImportServicePricesMutation } from '@/store/services/pricingApi';
import { useGetPartnersQuery } from '@/store/services/partnersApi';

const serviceTypeOptions = [
  { label: 'Customs', value: 'CUSTOMS' },
  { label: 'Trucking', value: 'TRUCKING' },
  { label: 'Sea Freight', value: 'SEA_FREIGHT' },
  { label: 'Air Freight', value: 'AIR_FREIGHT' },
  { label: 'Local Charge', value: 'LOCAL_CHARGE' },
  { label: 'LCL', value: 'LCL' },
  { label: 'Other', value: 'OTHER' }
];

export default function PricingPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const { data: pricingData, isLoading: loading, error: loadErrorObj } = useGetServicePricesQuery();
  const { data: partnersData } = useGetPartnersQuery();
  const [createServicePrice] = useCreateServicePriceMutation();
  const [importServicePrices] = useImportServicePricesMutation();

  const data = pricingData?.items || [];
  const partners = (partnersData?.items || []).filter(p => p.isActive);
  const loadError = loadErrorObj ? 'Unable to load pricing data from the backend.' : '';

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
        item.serviceType,
        item.shipmentMode,
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
      await createServicePrice({
        ...values,
        amount: Number(values.amount),
        minQuantity: values.minQuantity === undefined ? undefined : Number(values.minQuantity),
        maxQuantity: values.maxQuantity === undefined ? undefined : Number(values.maxQuantity),
        effectiveFrom: values.effectiveFrom?.format('YYYY-MM-DD'),
        effectiveTo: values.effectiveTo?.format('YYYY-MM-DD')
      }).unwrap();
      message.success('New tariff added successfully');

      setModalOpen(false);
      form.resetFields();
      
    } catch (err) {
      message.error(err?.data?.message || 'Unable to create service price.');
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(options) {
    const { file, onError, onSuccess } = options;

    try {
      const result = await importServicePrices(file).unwrap();
      const errorSuffix = result.errorCount ? ` ${result.errorCount} row(s) failed.` : '';
      message.success(`Imported ${result.createdCount || 0} new tariff(s), updated ${result.updatedCount || 0}.${errorSuffix}`);
      
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err?.data?.message || 'Unable to import pricing file.';
      message.error(errorMessage);
      onError?.(err);
    }
  }

  const activeTariffs = data.filter((item) => item.isActive !== false).length;
  const averageRate = data.length
    ? Math.round(data.reduce((sum, item) => sum + Number(item.amount || 0), 0) / data.length)
    : 0;
  const coveredRoutes = new Set(data.map((item) => `${item.routeFrom || ''}-${item.routeTo || ''}`)).size;

  const columns = [
    { title: 'Partner', dataIndex: 'partnerId', key: 'partnerId', render: value => partnerMap[value]?.name || 'General tariff' },
    { title: 'Service Type', dataIndex: 'serviceType', key: 'serviceType', render: value => <Tag color="blue">{value}</Tag> },
    { title: 'Shipment', dataIndex: 'shipmentMode', key: 'shipmentMode', render: value => value || '-' },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => <strong>{[record.routeFrom, record.routeTo].filter(Boolean).join(' -> ') || '-'}</strong>
    },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: value => value || '-' },
    { 
      title: 'Rate',
      dataIndex: 'amount',
      key: 'rate',
      align: 'right',
      render: (val, record) => <span style={{ fontWeight: 600, color: '#0057c2' }}>{Number(val || 0).toLocaleString()} {record.currency || 'VND'}</span>
    },
    { title: 'Effective To', dataIndex: 'effectiveTo', key: 'effectiveTo', render: value => value || '-' },
    { 
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: value => <Tag color={value === false ? 'red' : 'green'}>{value === false ? 'Inactive' : 'Active'}</Tag>
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">Pricing & Tariffs</Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            Manage standard rates, carrier tariffs, and bulk Excel imports.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} customRequest={handleImport}>
            <Button icon={<CloudUploadOutlined />}>Import Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Add Tariff
          </Button>
        </Space>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} /> : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active Tariffs" value={activeTariffs} prefix={<TagOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Average Rate" value={averageRate} formatter={formatCurrency} prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Routes Covered" value={coveredRoutes} prefix={<GlobalOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by route or carrier..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="No pricing records found." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title="Add New Tariff"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="partnerId" label="Partner">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={partners.map((partner) => ({
                value: partner.backendId,
                label: `${partner.code} - ${partner.name}`
              }))}
              placeholder="Optional customer/vendor specific tariff"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serviceType" label="Service Type" rules={[{ required: true, message: 'Service type is required.' }]}>
                <Select options={serviceTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shipmentMode" label="Shipment Mode">
                <Input placeholder="e.g. SEA_FCL, AIR, ROAD" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="routeFrom" label="Route From">
                <Input placeholder="Origin / port of loading" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="routeTo" label="Route To">
                <Input placeholder="Destination / port of discharge" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit" label="Unit">
                <Input placeholder="e.g. Container, KG, CBM" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="Currency" initialValue="VND">
                <Select options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Rate" rules={[{ required: true, message: 'Rate is required.' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minQuantity" label="Min Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maxQuantity" label="Max Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveFrom" label="Effective From">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="effectiveTo" label="Effective To">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Notes" />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
