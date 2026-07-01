'use client';

import {
  Alert, Badge, Button, Card, Col, Empty, List,
  Popconfirm, Row, Segmented, Statistic, Tag, Tooltip, Typography, App
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation
} from '@/store/services/notificationsApi';
import { getApiError } from '@/utils/getApiError';
import { translateNotificationType } from '@/utils/notificationI18n';

const TYPE_ICON = {
  WARNING: <WarningOutlined style={{ color: '#fa8c16' }} />,
  ERROR: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
  SUCCESS: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  INFO: <InfoCircleOutlined style={{ color: '#1677ff' }} />,
  PAYMENT_REQUEST_PENDING_DEPARTMENT: <WarningOutlined style={{ color: '#fa8c16' }} />,
  PAYMENT_REQUEST_PENDING_FINAL: <WarningOutlined style={{ color: '#fa8c16' }} />,
  PAYMENT_REQUEST_FINAL_APPROVED: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  PAYMENT_REQUEST_REJECTED: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
  PAYMENT_REQUEST_PAID: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
};
const TYPE_COLOR = {
  WARNING: 'orange', ERROR: 'red', SUCCESS: 'green', INFO: 'blue',
  PAYMENT_REQUEST_PENDING_DEPARTMENT: 'orange',
  PAYMENT_REQUEST_PENDING_FINAL: 'orange',
  PAYMENT_REQUEST_FINAL_APPROVED: 'green',
  PAYMENT_REQUEST_REJECTED: 'red',
  PAYMENT_REQUEST_PAID: 'green'
};

function timeAgo(dateStr, t) {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('timeAgo.justNow');
  if (mins < 60) return t('timeAgo.minutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('timeAgo.hoursAgo', { count: hrs });
  return t('timeAgo.daysAgo', { count: Math.floor(hrs / 24) });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [filter, setFilter] = useState('all');

  const { data, isLoading, error } = useGetNotificationsQuery({ limit: 100 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();

  const notifications = data?.items ?? [];

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    if (filter === 'read') return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleOpen(item) {
    if (!item.isRead) {
      try { await markAsRead(item.backendId).unwrap(); } catch { /* navigation still works */ }
    }
    const fallback = item.entityType === 'PAYMENT_REQUEST' && item.entityId
      ? `/payment-requests?requestId=${item.entityId}`
      : null;
    const target = item.actionUrl || fallback;
    if (target) router.push(target);
  }

  async function handleMarkRead(id) {
    try { await markAsRead(id).unwrap(); }
    catch { message.error(t('notifications.markReadError')); }
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead().unwrap();
      message.success(t('notifications.allMarkedRead'));
    } catch (err) {
      message.error(getApiError(err, t, 'notifications.markReadError'));
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNotif(id).unwrap();
    }
    catch (err) {
      message.error(getApiError(err, t, 'notifications.deleteError'));
    }
  }

  const segmentOptions = [
    { label: `${t('notifications.all')} (${notifications.length})`, value: 'all' },
    {
      label: (
        <span>
          {t('notifications.unread')}
          {unreadCount > 0 && <Badge count={unreadCount} size="small" style={{ marginLeft: 6 }} />}
        </span>
      ),
      value: 'unread'
    },
    { label: t('notifications.read'), value: 'read' }
  ];

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <Typography.Title level={1} className="page-title">
            <BellOutlined style={{ marginRight: 10, color: '#0057c2' }} />
            {t('notifications.inboxTitle')}
          </Typography.Title>
          <Typography.Paragraph className="page-subtitle">
            {t('notifications.inboxSubtitle')}
          </Typography.Paragraph>
        </div>
        <Tooltip title={t('notifications.markAllRead')}>
          <Button
            icon={<CheckOutlined />}
            disabled={unreadCount === 0}
            onClick={handleMarkAll}
          >
            {t('notifications.markAllRead')}
          </Button>
        </Tooltip>
      </div>

      {error && (
        <Alert type="error" showIcon message={t('notifications.loadError')} style={{ marginBottom: 16 }} />
      )}

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('notifications.totalNotif')}
              value={notifications.length}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('notifications.unreadCount')}
              value={unreadCount}
              valueStyle={{ color: unreadCount > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Filter + List ───────────────────────────────────────────────────── */}
      <Card className="table-card">
        <div style={{ marginBottom: 16 }}>
          <Segmented options={segmentOptions} value={filter} onChange={setFilter} />
        </div>

        {filtered.length === 0 && !isLoading ? (
          <Empty description={t('notifications.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
        ) : (
          <List
            loading={isLoading}
            dataSource={filtered}
            rowKey="id"
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.isRead ? 'transparent' : '#f0f5ff',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 6,
                  border: item.isRead ? '1px solid #f0f0f0' : '1px solid #adc6ff'
                }}
                actions={[
                  (item.actionUrl || item.entityType === 'PAYMENT_REQUEST') && (
                    <Button key="open" type="link" size="small" onClick={() => handleOpen(item)}>
                      {item.actionLabel || t('notifications.viewDetail')}
                    </Button>
                  ),
                  !item.isRead && (
                    <Tooltip key="read" title={t('notifications.markRead')}>
                      <Button
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkRead(item.backendId)}
                      />
                    </Tooltip>
                  ),
                  <Popconfirm
                    key="del"
                    title={t('notifications.deleteConfirm')}
                    onConfirm={() => handleDelete(item.backendId)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ marginTop: 4, fontSize: 20 }}>
                      {TYPE_ICON[item.type] ?? TYPE_ICON.INFO}
                    </div>
                  }
                  title={
                    <span style={{ fontWeight: item.isRead ? 400 : 700 }}>
                      {item.title}
                      {item.entityType && (
                        <Tag
                          color="blue"
                          style={{ marginLeft: 8, fontSize: 11 }}
                        >
                          {item.entityType}
                          {item.entityId ? ` #${item.entityId}` : ''}
                        </Tag>
                      )}
                      <Tag
                        color={TYPE_COLOR[item.type] ?? 'default'}
                        style={{ marginLeft: 4, fontSize: 11 }}
                      >
                        {translateNotificationType(item.type, t)}
                      </Tag>
                    </span>
                  }
                  description={
                    <span style={{ color: '#555' }}>
                      {item.message}
                      <span style={{ marginLeft: 12, color: '#aaa', fontSize: 12 }}>
                        {timeAgo(item.createdAt, t)}
                      </span>
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
