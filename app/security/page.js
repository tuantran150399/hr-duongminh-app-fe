'use client';

import {
  Alert, Badge, Button, Card, Col, DatePicker, Form, Input, Modal, Popconfirm,
  Row, Select, Space, Statistic, Table, Tag, Tabs, Typography, App
} from 'antd';
import {
  AuditOutlined, CheckCircleOutlined, LockOutlined, PlusOutlined,
  SafetyCertificateOutlined, StopOutlined, WarningOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import { useGetUsersQuery } from '@/store/services/adminApi';
import {
  useBlockIpMutation, useGetBlockedIpsQuery, useGetLoginEventsQuery,
  useGetSecurityAlertsQuery, useGetSecurityFeaturesQuery, useUnblockIpMutation,
  useUpdateSecurityAlertStatusMutation
} from '@/store/services/securityApi';
import { getApiError } from '@/utils/getApiError';
import { formatDateTime } from '@/utils/format';

const STATUS_COLORS = { SUCCESS: 'green', FAILED: 'red', BLOCKED: 'orange' };
const ALERT_STATUS_COLORS = { OPEN: 'red', ACKNOWLEDGED: 'orange', RESOLVED: 'green' };
const SEVERITY_COLORS = { LOW: 'blue', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'volcano' };
const EMPTY_FILTERS = { userId: undefined, ipAddress: '', status: undefined, dates: null };

function toEventParams(filters, page) {
  const params = { page, limit: 20 };
  if (filters.userId) params.userId = filters.userId;
  if (filters.ipAddress?.trim()) params.ipAddress = filters.ipAddress.trim();
  if (filters.status) params.status = filters.status;
  if (filters.dates?.[0]) params.dateFrom = filters.dates[0].startOf('day').toISOString();
  if (filters.dates?.[1]) params.dateTo = filters.dates[1].endOf('day').toISOString();
  return params;
}

export default function SecurityPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('events');
  const [eventPage, setEventPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm] = Form.useForm();

  const { data: features } = useGetSecurityFeaturesQuery();
  // Feature flag UI check: the alert tab/actions remain implemented below and
  // reappear when ENABLE_SECURITY_ALERT_RESOLUTION is enabled on the API.
  const alertResolutionEnabled = features?.alertResolutionEnabled === true;
  const { data: eventsData, isLoading: loadingEvents, error: eventsError } = useGetLoginEventsQuery(toEventParams(filters, eventPage));
  const { data: alertsData, isLoading: loadingAlerts, error: alertsError } = useGetSecurityAlertsQuery(
    { limit: 50 }, { skip: !alertResolutionEnabled }
  );
  const { data: blockedData, isLoading: loadingBlocked, error: blockedError } = useGetBlockedIpsQuery({ limit: 100 });
  const { data: users = [] } = useGetUsersQuery();

  const [updateAlertStatus] = useUpdateSecurityAlertStatusMutation();
  const [blockIp] = useBlockIpMutation();
  const [unblockIp] = useUnblockIpMutation();

  const events = eventsData?.items ?? [];
  const alerts = alertsData?.items ?? [];
  const blockedIps = blockedData?.items ?? [];
  const openAlerts = alerts.filter((item) => item.status === 'OPEN').length;
  const blockedLogins = events.filter((item) => item.status === 'BLOCKED').length;
  const hasError = eventsError || blockedError || (alertResolutionEnabled && alertsError);

  async function handleAlertAction(id, status) {
    try {
      await updateAlertStatus({ id, status }).unwrap();
      message.success(status === 'ACKNOWLEDGED' ? t('security.acknowledgeSuccess') : t('security.resolveSuccess'));
    } catch (error) {
      message.error(getApiError(error, t, 'security.resolveError'));
    }
  }

  function openBlockIp(ipAddress = '') {
    blockForm.resetFields();
    blockForm.setFieldsValue({ ipAddress: ipAddress === '-' ? '' : ipAddress });
    setBlockModalOpen(true);
  }

  async function handleBlock(values) {
    try {
      await blockIp(values).unwrap();
      message.success(t('security.blockIpSuccess'));
      setBlockModalOpen(false);
    } catch (error) {
      message.error(getApiError(error, t, 'security.blockIpError'));
    }
  }

  async function perform(action, successKey, errorKey) {
    try {
      await action().unwrap();
      message.success(t(successKey));
    } catch (error) {
      message.error(getApiError(error, t, errorKey));
    }
  }

  const eventColumns = [
    { title: t('security.time'), dataIndex: 'createdAt', render: (value) => formatDateTime(value, language) },
    { title: t('security.username'), dataIndex: 'username', render: (value) => <strong>{value}</strong> },
    { title: t('security.ipAddress'), dataIndex: 'ipAddress', render: (value) => <code>{value}</code> },
    { title: t('security.deviceBrowser'), dataIndex: 'deviceInfo', ellipsis: true },
    { title: t('security.location'), render: (_, row) => row.locationLabel !== '-' ? row.locationLabel : row.countryCode },
    { title: t('security.status'), dataIndex: 'status', render: (value) => <Tag color={STATUS_COLORS[value]}>{value}</Tag> },
    {
      title: t('security.actions'), render: (_, row) => row.ipAddress !== '-' ? (
        <Button danger size="small" icon={<StopOutlined />} onClick={() => openBlockIp(row.ipAddress)}>
          {t('security.blockIp')}
        </Button>
      ) : null
    }
  ];

  const alertColumns = [
    { title: t('security.alertType'), dataIndex: 'type', render: (value) => <Tag icon={<WarningOutlined />}>{value?.replace(/_/g, ' ')}</Tag> },
    { title: t('security.severity'), dataIndex: 'severity', render: (value) => <Tag color={SEVERITY_COLORS[value]}>{value}</Tag> },
    { title: t('security.username'), dataIndex: 'username' },
    { title: t('security.message'), dataIndex: 'message', ellipsis: true },
    { title: t('security.status'), dataIndex: 'status', render: (value) => <Tag color={ALERT_STATUS_COLORS[value]}>{value}</Tag> },
    { title: t('security.time'), dataIndex: 'createdAt', render: (value) => formatDateTime(value, language) },
    {
      title: t('security.actions'), render: (_, row) => row.status !== 'RESOLVED' ? (
        <Space>
          {row.status === 'OPEN' ? <Button size="small" onClick={() => handleAlertAction(row.backendId, 'ACKNOWLEDGED')}>{t('security.acknowledge')}</Button> : null}
          <Button size="small" type="primary" onClick={() => handleAlertAction(row.backendId, 'RESOLVED')}>{t('security.resolve')}</Button>
        </Space>
      ) : <Tag color="green" icon={<CheckCircleOutlined />}>{t('security.resolved')}</Tag>
    }
  ];

  const blockedColumns = [
    { title: t('security.ipAddress'), dataIndex: 'ipPattern', render: (value) => <code>{value}</code> },
    { title: t('security.label'), dataIndex: 'label' },
    { title: t('security.reason'), dataIndex: 'description', ellipsis: true },
    { title: t('security.blockedBy'), render: (_, row) => row.blockedByName || row.blockedByUsername || `#${row.createdBy ?? '-'}` },
    { title: t('security.blockedAt'), dataIndex: 'createdAt', render: (value) => formatDateTime(value, language) },
    {
      title: t('security.actions'), render: (_, row) => (
        <Popconfirm title={t('security.unblockConfirm')} onConfirm={() => perform(() => unblockIp(row.backendId), 'security.unblockSuccess', 'security.unblockError')}>
          <Button size="small">{t('security.unblock')}</Button>
        </Popconfirm>
      )
    }
  ];

  const tabs = [
    {
      key: 'events', label: <span><AuditOutlined /> {t('security.loginEventsTab')}</span>, children: <>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} md={5}><Typography.Text>{t('security.user')}</Typography.Text><Select allowClear showSearch optionFilterProp="label" style={{ width: '100%' }} value={draftFilters.userId} onChange={(userId) => setDraftFilters((old) => ({ ...old, userId }))} options={users.map((user) => ({ value: Number(user.id), label: user.fullName || user.username }))} /></Col>
            <Col xs={24} md={5}><Typography.Text>{t('security.ipAddress')}</Typography.Text><Input allowClear value={draftFilters.ipAddress} onChange={(e) => setDraftFilters((old) => ({ ...old, ipAddress: e.target.value }))} /></Col>
            <Col xs={24} md={4}><Typography.Text>{t('security.status')}</Typography.Text><Select allowClear style={{ width: '100%' }} value={draftFilters.status} onChange={(status) => setDraftFilters((old) => ({ ...old, status }))} options={Object.keys(STATUS_COLORS).map((value) => ({ value, label: value }))} /></Col>
            <Col xs={24} md={6}><Typography.Text>{t('security.dateRange')}</Typography.Text><DatePicker.RangePicker style={{ width: '100%' }} value={draftFilters.dates} onChange={(dates) => setDraftFilters((old) => ({ ...old, dates }))} /></Col>
            <Col xs={24} md={4}><Space><Button type="primary" onClick={() => { setEventPage(1); setFilters(draftFilters); }}>{t('security.applyFilters')}</Button><Button onClick={() => { setDraftFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setEventPage(1); }}>{t('common.reset')}</Button></Space></Col>
          </Row>
        </Card>
        <Table rowKey="id" loading={loadingEvents} columns={eventColumns} dataSource={events} scroll={{ x: 1150 }} pagination={{ current: eventPage, pageSize: 20, total: eventsData?.meta?.total ?? 0, showSizeChanger: false, onChange: setEventPage }} />
      </>
    },
    ...(alertResolutionEnabled ? [{ key: 'alerts', label: <span><WarningOutlined /> {t('security.alertsTab')} {openAlerts ? <Badge count={openAlerts} /> : null}</span>, children: <Table rowKey="id" loading={loadingAlerts} columns={alertColumns} dataSource={alerts} scroll={{ x: 1100 }} /> }] : []),
    { key: 'blocked', label: <span><StopOutlined /> {t('security.blockedIpsTab')}</span>, children: <><div className="security-rule-toolbar"><Button danger icon={<PlusOutlined />} onClick={() => openBlockIp()}>{t('security.addBlockedIp')}</Button></div><Table rowKey="id" loading={loadingBlocked} columns={blockedColumns} dataSource={blockedIps} scroll={{ x: 900 }} /></> }
  ];

  return <DashboardLayout>
    <div className="page-header"><div><Typography.Title level={1} className="page-title"><SafetyCertificateOutlined style={{ marginRight: 10, color: '#0057c2' }} />{t('security.title')}</Typography.Title><Typography.Paragraph className="page-subtitle">{t('security.subtitle')}</Typography.Paragraph></div></div>
    {hasError ? <Alert type="error" showIcon message={t('security.loadError')} style={{ marginBottom: 16 }} /> : null}
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} md={6}><Card><Statistic title={t('security.totalEvents')} value={eventsData?.meta?.total ?? 0} prefix={<AuditOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title={t('security.blockedLogins')} value={blockedLogins} prefix={<LockOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title={t('security.blockedIpsTab')} value={blockedData?.meta?.total ?? 0} prefix={<StopOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card><Statistic title={t('security.successfulLogins')} value={events.filter((row) => row.status === 'SUCCESS').length} prefix={<CheckCircleOutlined />} /></Card></Col>
    </Row>
    <Card className="table-card"><Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} /></Card>

    <Modal title={t('security.blockIpTitle')} open={blockModalOpen} onCancel={() => setBlockModalOpen(false)} onOk={() => blockForm.submit()} destroyOnHidden>
      <Form form={blockForm} layout="vertical" onFinish={handleBlock}>
        <Form.Item name="ipAddress" label={t('security.ipAddress')} rules={[{ required: true, message: t('security.ipRequired') }]}><Input placeholder="203.0.113.10" /></Form.Item>
        <Form.Item name="label" label={t('security.label')}><Input /></Form.Item>
        <Form.Item name="reason" label={t('security.reason')}><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Modal>
  </DashboardLayout>;
}
