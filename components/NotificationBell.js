'use client';

import {
  Badge,
  Button,
  Drawer,
  Empty,
  List,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/AppProviders';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation
} from '@/store/services/notificationsApi';

const typeConfig = {
  PAYMENT_APPROVED: { color: 'green', icon: <CheckCircleOutlined /> },
  PAYMENT_REJECTED: { color: 'red', icon: <CloseCircleOutlined /> },
  PAYMENT_PENDING: { color: 'orange', icon: <WarningOutlined /> },
  ADVANCE_APPROVED: { color: 'green', icon: <CheckCircleOutlined /> },
  ADVANCE_REJECTED: { color: 'red', icon: <CloseCircleOutlined /> },
  COB_CREATED: { color: 'blue', icon: <InfoCircleOutlined /> },
  DEBIT_NOTE_POSTED: { color: 'blue', icon: <InfoCircleOutlined /> },
  INFO: { color: 'default', icon: <InfoCircleOutlined /> },
  WARNING: { color: 'orange', icon: <WarningOutlined /> },
  ERROR: { color: 'red', icon: <CloseCircleOutlined /> }
};

function entityLink(notification) {
  const { entityType, entityId } = notification;
  if (!entityType || !entityId) return null;

  const map = {
    PAYMENT_REQUEST: '/payment-requests',
    ADVANCE: '/advances',
    DEBIT_NOTE: '/debit-notes',
    JOB: '/jobs',
    COB: '/cob'
  };

  return map[entityType] || null;
}

function formatTimeAgo(dateString, t) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('timeAgo.justNow');
  if (minutes < 60) return t('timeAgo.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('timeAgo.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('timeAgo.daysAgo', { count: days });
}

export default function NotificationBell() {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: notifData, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000 // Poll every 60s
  });
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = notifData?.items || [];
  const unreadCount = unreadData?.count ?? unreadData ?? notifications.filter((n) => !n.isRead).length;

  async function handleRead(item) {
    if (!item.isRead) {
      try {
        await markAsRead(item.backendId).unwrap();
      } catch (err) {
        // Silently ignore read errors
      }
    }

    const link = entityLink(item);
    if (link) {
      router.push(link);
      setOpen(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead().unwrap();
      message.success(t('notifications.allMarkedRead'));
    } catch (err) {
      message.error(t('notifications.markReadError'));
    }
  }

  async function handleDelete(event, item) {
    event.stopPropagation();
    try {
      await deleteNotification(item.backendId).unwrap();
    } catch (err) {
      message.error(t('notifications.deleteError'));
    }
  }

  return (
    <>
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          className="header-icon-btn"
          onClick={() => setOpen(true)}
        />
      </Badge>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('notifications.title')}</span>
            {notifications.length > 0 && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllRead}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
        }
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        width={400}
        styles={{ body: { padding: 0 } }}
      >
        {notifications.length === 0 && !isLoading ? (
          <Empty
            description={t('notifications.empty')}
            style={{ marginTop: 60 }}
          />
        ) : (
          <List
            loading={isLoading}
            dataSource={notifications}
            renderItem={(item) => {
              const config = typeConfig[item.type] || typeConfig.INFO;
              return (
                <List.Item
                  onClick={() => handleRead(item)}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    backgroundColor: item.isRead ? 'transparent' : '#f0f5ff',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(event) => handleDelete(event, item)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: item.isRead ? '#f5f5f5' : '#e6f4ff',
                        fontSize: 16,
                        color: item.isRead ? '#8c8c8c' : '#1677ff'
                      }}>
                        {config.icon}
                      </div>
                    }
                    title={
                      <Space size={4}>
                        <Typography.Text strong={!item.isRead} style={{ fontSize: 13 }}>
                          {item.title}
                        </Typography.Text>
                        <Tag color={config.color} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                          {item.type?.replace(/_/g, ' ')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {item.message}
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {formatTimeAgo(item.createdAt, t)}
                        </Typography.Text>
                      </>
                    }
                  />
                  {!item.isRead && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#1677ff',
                      flexShrink: 0,
                      marginLeft: 8
                    }} />
                  )}
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </>
  );
}
