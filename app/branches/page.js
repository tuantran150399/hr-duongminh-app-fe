'use client';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation
} from '@/store/services/adminExtApi';

export default function BranchesPage() {
  const { t } = useLanguage();
  const [modal, setModal] = useState({ open: false, record: null });
  const [form] = Form.useForm();

  const { data: branches = [], isLoading, error, refetch } = useGetBranchesQuery();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const saving = isCreating || isUpdating;
  const activeBranchCount = branches.filter((branch) => branch.isActive).length;
  const inactiveBranchCount = branches.length - activeBranchCount;

  const managementHighlights = [
    {
      key: 'multiBranch',
      icon: <BankOutlined />,
      title: t('branches.multiBranchTitle'),
      description: t('branches.multiBranchDescription')
    },
    {
      key: 'dataScope',
      icon: <SafetyCertificateOutlined />,
      title: t('branches.dataScopeTitle'),
      description: t('branches.dataScopeDescription')
    },
    {
      key: 'approvalFlow',
      icon: <CheckCircleOutlined />,
      title: t('branches.approvalFlowTitle'),
      description: t('branches.approvalFlowDescription')
    },
    {
      key: 'adminAssignment',
      icon: <UserSwitchOutlined />,
      title: t('branches.adminAssignmentTitle'),
      description: t('branches.adminAssignmentDescription')
    }
  ];

  function openModal(record = null) {
    setModal({ open: true, record });
    form.setFieldsValue(record ? { ...record.raw } : { isActive: true });
  }

  async function submit(values) {
    try {
      if (modal.record) {
        const { code, ...payload } = values;
        await updateBranch({ id: modal.record.backendId, ...payload }).unwrap();
        message.success(t('branches.updateSuccess'));
      } else {
        await createBranch(values).unwrap();
        message.success(t('branches.createSuccess'));
      }
      setModal({ open: false, record: null });
      form.resetFields();
    } catch (saveError) {
      message.error(saveError?.data?.message || t('branches.saveError'));
    }
  }

  const columns = [
    { title: t('branches.code'), dataIndex: 'code', key: 'code' },
    { title: t('branches.name'), dataIndex: 'name', key: 'name' },
    { title: t('branches.address'), dataIndex: 'address', key: 'address' },
    {
      title: t('branches.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value) => <Tag color={value ? 'green' : 'red'}>{value ? t('branches.active') : t('branches.inactive')}</Tag>
    },
    {
      title: t('branches.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" icon={<EditOutlined />} title={t('branches.edit')} onClick={() => openModal(record)} />
    }
  ];

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>{t('branches.title')}</h2>
          <p>{t('branches.subtitle')}</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refetch}>{t('branches.refresh')}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>{t('branches.createBranch')}</Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={t('branches.loadError')} style={{ marginBottom: 16 }} /> : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('branches.totalBranches')} value={branches.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('branches.activeBranches')} value={activeBranchCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title={t('branches.inactiveBranches')} value={inactiveBranchCount} valueStyle={{ color: inactiveBranchCount ? '#cf1322' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {managementHighlights.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.key}>
            <Card className="branch-management-card" style={{ height: '100%' }}>
              <Space align="start" size={12}>
                <span className="branch-management-icon">{item.icon}</span>
                <div>
                  <Typography.Title level={5} style={{ marginBottom: 6 }}>{item.title}</Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {item.description}
                  </Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Alert
        type="info"
        showIcon
        message={t('branches.scopeNoticeTitle')}
        description={t('branches.scopeNoticeDescription')}
        style={{ marginBottom: 16 }}
      />

      <Card className="table-card">
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={branches} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={modal.record ? t('branches.editBranch') : t('branches.createBranch')}
        open={modal.open}
        onCancel={() => setModal({ open: false, record: null })}
        onOk={() => form.submit()}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="code" label={t('branches.code')} rules={[{ required: !modal.record, message: t('branches.codeRequired') }]}>
            <Input disabled={Boolean(modal.record)} />
          </Form.Item>
          <Form.Item name="name" label={t('branches.name')} rules={[{ required: true, message: t('branches.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label={t('branches.address')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label={t('branches.activeLabel')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
