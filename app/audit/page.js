'use client';

import { Alert, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import { useGetAuditLogsQuery } from '@/store/services/adminExtApi';
import { formatDateTime } from '@/utils/format';

const { RangePicker } = DatePicker;

function renderJson(value) {
  if (!value) return '-';
  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>;
}

function actorLabel(record) {
  const actor = record.actor;
  if (!actor) return record.userId === '-' ? 'Hệ thống' : `Người dùng #${record.userId}`;
  const name = actor.fullName || actor.username;
  const code = actor.employeeCode || actor.username;
  return code && name !== code ? `${name} (${code})` : name;
}

function translatedEntityType(record, t) {
  const key = `audit.entityTypes.${record.entityName}`;
  const translated = t(key);
  return translated !== key ? translated : record.entityName;
}

function entityLabel(record, t) {
  if (record.entity?.code) return record.entity.displayName || record.entity.code;
  return `${translatedEntityType(record, t)} #${record.entityId}`;
}

function businessLabel(record) {
  const entity = record.entity;
  if (!entity) return '-';
  const partner = entity.partnerName
    ? `${entity.partnerCode ? `${entity.partnerCode} - ` : ''}${entity.partnerName}`
    : null;
  const branch = entity.branchName
    ? `${entity.branchCode ? `${entity.branchCode} - ` : ''}${entity.branchName}`
    : null;
  return [partner, branch].filter(Boolean).join(' · ') || '-';
}

export default function AuditPage() {
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [queryParams, setQueryParams] = useState({});
  const [form] = Form.useForm();

  const { data, isLoading, error, refetch } = useGetAuditLogsQuery(queryParams);
  const logs = data?.items || [];
  const meta = data?.meta || null;

  function submitFilters(values) {
    const range = values.range || [];
    setQueryParams({
      entityName: values.entityName || undefined,
      entityId: values.entityId || undefined,
      action: values.action || undefined,
      dateFrom: range[0]?.format?.('YYYY-MM-DD'),
      dateTo: range[1]?.format?.('YYYY-MM-DD')
    });
  }

  const columns = [
    { title: t('audit.time'), dataIndex: 'createdAt', key: 'createdAt', render: (value) => formatDateTime(value, language) },
    { title: t('audit.action'), dataIndex: 'action', key: 'action', render: (value) => <Tag color="blue">{t(`audit.actionTypes.${value}`) !== `audit.actionTypes.${value}` ? t(`audit.actionTypes.${value}`) : value}</Tag> },
    { title: t('audit.entity'), dataIndex: 'entityName', key: 'entityName', render: (value) => t(`audit.entityTypes.${value}`) !== `audit.entityTypes.${value}` ? t(`audit.entityTypes.${value}`) : value },
    { title: 'Đối tượng', key: 'entityDisplay', render: (_, record) => entityLabel(record, t) },
    { title: 'Người thao tác', key: 'actor', render: (_, record) => actorLabel(record) },
    { title: 'Doanh nghiệp / Chi nhánh', key: 'business', render: (_, record) => businessLabel(record) },
    { title: 'Mã lô hàng', key: 'jobCode', render: (_, record) => record.entity?.jobCode || record.entity?.bookingRef || '-' },
    { title: t('audit.ip'), dataIndex: 'ipAddress', key: 'ipAddress' },
    {
      title: t('audit.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => <Button size="small" icon={<EyeOutlined />} title={t('audit.view')} onClick={() => setSelected(record)} />
    }
  ].filter((column) => !['entityDisplay', 'ipAddress'].includes(column.key));

  return (
    <DashboardLayout>
      <div className="shipment-page-header">
        <div>
          <h2>{t('audit.title')}</h2>
          <p>{t('audit.subtitle')}</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={refetch}>{t('audit.refresh')}</Button>
      </div>

      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={submitFilters}>
          <div className="accounting-filter-row">
            <Form.Item name="entityName" label={t('audit.entityLabel')}>
              <Input allowClear placeholder={t('audit.entityPlaceholder')} prefix={<SearchOutlined />} />
            </Form.Item>
            <Form.Item name="entityId" label={t('audit.entityIdLabel')}>
              <Input allowClear />
            </Form.Item>
            <Form.Item name="action" label={t('audit.actionLabel')}>
              <Select
                allowClear
                options={['CREATE', 'UPDATE', 'DELETE', 'POST', 'VOID', 'LOGIN', 'DEACTIVATE', 'RECORD_PAYMENT', 'CREATE_COLLECT_FROM_COB'].map((value) => ({ value, label: t(`audit.actionTypes.${value}`) !== `audit.actionTypes.${value}` ? t(`audit.actionTypes.${value}`) : value }))}
              />
            </Form.Item>
            <Form.Item name="range" label={t('audit.dateRange')}>
              <RangePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button type="primary" htmlType="submit">{t('audit.apply')}</Button>
                <Button onClick={() => { form.resetFields(); setQueryParams({}); }}>{t('audit.reset')}</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      {error ? <Alert type="error" showIcon message={t('audit.loadError')} style={{ marginBottom: 16 }} /> : null}

      <Card className="table-card">
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={logs}
          pagination={{
            pageSize: meta?.limit || 10,
            total: meta?.total || logs.length
          }}
        />
      </Card>

      <Drawer title={t('audit.detailTitle')} open={Boolean(selected)} onClose={() => setSelected(null)} width={720}>
        {selected ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t('audit.action')}>{t(`audit.actionTypes.${selected.action}`) !== `audit.actionTypes.${selected.action}` ? t(`audit.actionTypes.${selected.action}`) : selected.action}</Descriptions.Item>
            <Descriptions.Item label={t('audit.entity')}>{t(`audit.entityTypes.${selected.entityName}`) !== `audit.entityTypes.${selected.entityName}` ? t(`audit.entityTypes.${selected.entityName}`) : selected.entityName}</Descriptions.Item>
            <Descriptions.Item label="Đối tượng">{entityLabel(selected, t)}</Descriptions.Item>
            <Descriptions.Item label="Người thao tác">{actorLabel(selected)}</Descriptions.Item>
            <Descriptions.Item label="Mã nhân viên">{selected.actor?.employeeCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Phòng ban / Chức vụ">{[selected.actor?.department, selected.actor?.position].filter(Boolean).join(' - ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="Chi nhánh người dùng">{[selected.actor?.branchCode, selected.actor?.branchName].filter(Boolean).join(' - ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="Doanh nghiệp / Đối tác">{businessLabel(selected)}</Descriptions.Item>
            <Descriptions.Item label="Mã lô hàng">{selected.entity?.jobCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Booking / HBL / MBL / Container">
              {[selected.entity?.bookingRef, selected.entity?.hbl, selected.entity?.mbl, selected.entity?.containerNo].filter(Boolean).join(' · ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('audit.ipAddress')}>{selected.ipAddress}</Descriptions.Item>
            <Descriptions.Item label={t('audit.userAgent')}>{selected.userAgent}</Descriptions.Item>
            <Descriptions.Item label={t('audit.timestamp')}>{formatDateTime(selected.createdAt, language)}</Descriptions.Item>
            <Descriptions.Item label={t('audit.before')}>{renderJson(selected.oldValues)}</Descriptions.Item>
            <Descriptions.Item label={t('audit.after')}>{renderJson(selected.newValues)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </DashboardLayout>
  );
}
