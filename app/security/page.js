'use client';

import {
  Alert, Badge, Button, Card, Col, Form, Input, Modal,
  Popconfirm, Row, Select, Space, Statistic, Switch, Table, Tag, Tabs, Typography, App
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetLoginEventsQuery,
  useGetSecurityAlertsQuery,
  useGetIpRulesQuery,
  useUpdateSecurityAlertStatusMutation,
  useCreateIpRuleMutation,
  useUpdateIpRuleMutation,
  useDeleteIpRuleMutation
} from '@/store/services/securityApi';
import { getApiError } from '@/utils/getApiError';
import { formatDateTime } from '@/utils/format';

const SEVERITY_COLORS = { LOW: 'blue', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'volcano' };
const STATUS_COLORS = { SUCCESS: 'green', FAILED: 'red', BLOCKED: 'orange' };
const ALERT_STATUS_COLORS = { OPEN: 'red', ACKNOWLEDGED: 'orange', RESOLVED: 'green' };


function RiskBadge({ score }) {
  const color = score >= 75 ? '#ff4d4f' : score >= 40 ? '#fa8c16' : '#52c41a';
  return (
    <span style={{
      display: 'inline-block', minWidth: 42, textAlign: 'center',
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 20, padding: '1px 10px', fontWeight: 700, fontSize: 13
    }}>
      {score}
    </span>
  );
}

export default function SecurityPage() {
  const { t, language } = useLanguage();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('events');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm] = Form.useForm();

  const { data: eventsData, isLoading: loadingEvents, error: eventsError } = useGetLoginEventsQuery({ limit: 50 });
  const { data: alertsData, isLoading: loadingAlerts, error: alertsError } = useGetSecurityAlertsQuery({ limit: 50 });
  const { data: ipRulesData, isLoading: loadingRules, error: rulesError } = useGetIpRulesQuery({ limit: 100 });

  const [updateAlertStatus] = useUpdateSecurityAlertStatusMutation();
  const [createIpRule] = useCreateIpRuleMutation();
  const [updateIpRule] = useUpdateIpRuleMutation();
  const [deleteIpRule] = useDeleteIpRuleMutation();

  const events = useMemo(() => eventsData?.items ?? [], [eventsData]);
  const alerts = useMemo(() => alertsData?.items ?? [], [alertsData]);
  const ipRules = useMemo(() => ipRulesData?.items ?? [], [ipRulesData]);

  const hasError = eventsError || alertsError || rulesError;
  const openAlerts = alerts.filter(a => a.status === 'OPEN').length;
  const blockedLogins = events.filter(e => e.status === 'BLOCKED').length;
  const activeRules = ipRules.filter(r => r.isActive).length;

  async function handleAlertAction(id, status) {
    try {
      await updateAlertStatus({ id, status }).unwrap();
      message.success(status === 'ACKNOWLEDGED' ? t('security.acknowledgeSuccess') : t('security.resolveSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, status === 'ACKNOWLEDGED' ? 'security.acknowledgeError' : 'security.resolveError'));
    }
  }

  function openCreateRule() {
    setEditingRule(null);
    ruleForm.resetFields();
    ruleForm.setFieldsValue({ isActive: true });
    setRuleModalOpen(true);
  }

  function openEditRule(rule) {
    setEditingRule(rule);
    ruleForm.setFieldsValue({
      type: rule.type,
      ipPattern: rule.ipPattern,
      label: rule.label,
      description: rule.description === '-' ? '' : rule.description,
      isActive: rule.isActive
    });
    setRuleModalOpen(true);
  }

  async function handleRuleSave(values) {
    try {
      if (editingRule) {
        await updateIpRule({ id: editingRule.backendId, ...values }).unwrap();
      } else {
        await createIpRule(values).unwrap();
      }
      message.success(t('security.saveRuleSuccess'));
      setRuleModalOpen(false);
      ruleForm.resetFields();
    } catch (err) {
      message.error(getApiError(err, t, 'security.saveRuleError'));
    }
  }

  async function handleDeleteRule(id) {
    try {
      await deleteIpRule(id).unwrap();
      message.success(t('security.deleteRuleSuccess'));
    } catch (err) {
      message.error(getApiError(err, t, 'security.deleteRuleError'));
    }
  }

  /* ── Column definitions ─────────────────────────────────────────────────── */
  const eventColumns = [
    {
      title: t('security.username'), dataIndex: 'username', key: 'username',
      render: v => <strong>{v}</strong>
    },
    {
      title: t('security.status'), dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_COLORS[s] ?? 'default'}>{s}</Tag>
    },
    { title: t('security.ipAddress'), dataIndex: 'ipAddress', key: 'ipAddress' },
    {
      title: t('security.riskScore'), dataIndex: 'riskScore', key: 'riskScore',
      align: 'center', render: score => <RiskBadge score={score} />
    },
    {
      title: t('security.time'), dataIndex: 'createdAt', key: 'createdAt',
      render: (val) => formatDateTime(val, language)
    }
  ];

  const alertColumns = [
    {
      title: t('security.alertType'), dataIndex: 'type', key: 'type',
      render: v => <Tag icon={<WarningOutlined />}>{v?.replace(/_/g, ' ')}</Tag>
    },
    {
      title: t('security.severity'), dataIndex: 'severity', key: 'severity',
      render: s => <Tag color={SEVERITY_COLORS[s] ?? 'default'}>{s}</Tag>
    },
    { title: t('security.username'), dataIndex: 'username', key: 'username' },
    { title: t('security.message'), dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: t('security.status'), dataIndex: 'status', key: 'status',
      render: s => <Tag color={ALERT_STATUS_COLORS[s] ?? 'default'}>{s}</Tag>
    },
    { title: t('security.time'), dataIndex: 'createdAt', key: 'createdAt', render: (val) => formatDateTime(val, language) },
    {
      title: t('security.actions'), key: 'actions',
      render: (_, record) => record.status === 'OPEN' ? (
        <Space size={4}>
          <Button size="small" icon={<CheckCircleOutlined />} title={t('security.acknowledge')}
            onClick={() => handleAlertAction(record.backendId, 'ACKNOWLEDGED')} />
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} title={t('security.resolve')}
            onClick={() => handleAlertAction(record.backendId, 'RESOLVED')} />
        </Space>
      ) : record.status === 'ACKNOWLEDGED' ? (
        <Button size="small" type="primary" icon={<CheckCircleOutlined />} title={t('security.resolve')}
          onClick={() => handleAlertAction(record.backendId, 'RESOLVED')} />
      ) : <Tag color="green" icon={<CheckCircleOutlined />}>{t('security.resolved')}</Tag>
    }
  ];

  const ipRuleColumns = [
    {
      title: t('security.ruleType'), dataIndex: 'type', key: 'type',
      render: type => (
        <Tag color={type === 'ALLOW' ? 'green' : 'red'}
          icon={type === 'ALLOW' ? <CheckCircleOutlined /> : <StopOutlined />}>
          {type}
        </Tag>
      )
    },
    { title: t('security.ipPattern'), dataIndex: 'ipPattern', key: 'ipPattern', render: v => <code>{v}</code> },
    { title: t('security.label'), dataIndex: 'label', key: 'label', render: v => <strong>{v}</strong> },
    { title: t('security.description'), dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: t('security.ruleActive'), dataIndex: 'isActive', key: 'isActive',
      render: v => v
        ? <Badge status="success" text={t('security.active')} />
        : <Badge status="default" text={t('security.inactive')} />
    },
    {
      title: t('security.actions'), key: 'actions',
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} title={t('security.editRule')} onClick={() => openEditRule(record)} />
          <Popconfirm title={t('security.deleteRuleConfirm')}
            onConfirm={() => handleDeleteRule(record.backendId)}>
            <Button size="small" danger icon={<DeleteOutlined />} title={t('security.deleteRule')} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'events',
      label: <span><AuditOutlined /> {t('security.loginEventsTab')}</span>,
      children: (
        <Table
          rowKey="id"
          loading={loadingEvents}
          columns={eventColumns}
          dataSource={events}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 900 }}
        />
      )
    },
    {
      key: 'alerts',
      label: (
        <span>
          <WarningOutlined /> {t('security.alertsTab')}
          {openAlerts > 0 && <Badge count={openAlerts} style={{ marginLeft: 6 }} />}
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          loading={loadingAlerts}
          columns={alertColumns}
          dataSource={alerts}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 1100 }}
        />
      )
    },
    {
      key: 'ip-rules',
      label: <span><GlobalOutlined /> {t('security.ipRulesTab')}</span>,
      children: (
        <div>
          <div className="security-rule-toolbar">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRule}>
              {t('security.addRule')}
            </Button>
          </div>
          <Table
            rowKey="id"
            loading={loadingRules}
            columns={ipRuleColumns}
            dataSource={ipRules}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            scroll={{ x: 900 }}
          />
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">
            <SafetyCertificateOutlined style={{ marginRight: 10, color: '#0057c2' }} />
            {t('security.title')}
          </Typography.Title>
          <Typography.Paragraph className="page-subtitle">{t('security.subtitle')}</Typography.Paragraph>
        </div>
      </div>

      {hasError && (
        <Alert type="error" showIcon message={t('security.loadError')} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('security.totalEvents')}
              value={events.length}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('security.openAlerts')}
              value={openAlerts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: openAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('security.blockedLogins')}
              value={blockedLogins}
              prefix={<LockOutlined />}
              valueStyle={{ color: blockedLogins > 0 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('security.activeIpRules')}
              value={activeRules}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#0057c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* IP Rule create/edit modal */}
      <Modal
        title={editingRule ? t('security.editRuleTitle') : t('security.createRuleTitle')}
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        onOk={() => ruleForm.submit()}
        destroyOnHidden
        width={520}
      >
        <Form form={ruleForm} layout="vertical" onFinish={handleRuleSave}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="type" label={t('security.ruleTypeLabel')}
                rules={[{ required: true, message: t('security.typeRequired') }]}>
                <Select options={[
                  { value: 'ALLOW', label: <Tag color="green">ALLOW</Tag> },
                  { value: 'BLOCK', label: <Tag color="red">BLOCK</Tag> }
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="isActive" label={t('security.ruleActive')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ipPattern" label={t('security.ipPatternLabel')}
            rules={[{ required: true, message: t('security.ipPatternRequired') }]}>
            <Input placeholder={t('security.ipPatternPlaceholder')} />
          </Form.Item>
          <Form.Item name="label" label={t('security.ruleLabel')}
            rules={[{ required: true, message: t('security.labelRequired') }]}>
            <Input placeholder={t('security.ruleLabelPlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('security.ruleDescription')}>
            <Input.TextArea rows={2} placeholder={t('security.ruleDescriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardLayout>
  );
}
