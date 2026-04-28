'use client';

import { useEffect, useState } from 'react';
import {
  BellOutlined,
  CalendarOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/AppProviders';
import AuthGuard from '@/components/AuthGuard';
import { clearAllTokens } from '@/utils/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, selectUser, selectUserPermissions } from '@/store/slices/authSlice';
import { getAuthorizedMenuItems, APP_ROUTES } from '@/config/routes';

const { Header, Content, Sider } = Layout;

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [currentDateLabel, setCurrentDateLabel] = useState('');
  const { language, setLanguage, options, t } = useLanguage();

  // Lấy user và permissions từ Redux store
  const user = useAppSelector(selectUser);
  const userPermissions = useAppSelector(selectUserPermissions);

  // Menu items được lọc theo permissions của user
  const menuItems = getAuthorizedMenuItems(userPermissions, t);

  // Xác định menu item đang active
  const selectedKey = APP_ROUTES.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
  )?.path;

  const currentSection =
    menuItems.find((item) => item.key === selectedKey)?.label ||
    t('menu.dashboard');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentDateLabel(
        new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(new Date())
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [language]);

  function handleMenuClick({ key }) {
    router.push(key);
  }

  function handleLogout() {
    dispatch(logout());
    clearAllTokens();
    router.replace('/login');
  }

  const currentLanguage = options.find((item) => item.key === language) || options[0];
  const languageMenuItems = options.map((item) => ({
    key: item.key,
    label: (
      <span className="language-menu-item">
        <span className="language-emoji">{item.emoji}</span>
        <span>{item.key === 'en' ? t('header.english') : t('header.vietnamese')}</span>
      </span>
    )
  }));

  // User dropdown menu (top-right avatar)
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <span>
          <strong>{user?.fullName || user?.username || 'User'}</strong>
          <br />
          <small style={{ color: '#888' }}>{user?.email || ''}</small>
        </span>
      ),
      disabled: true
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.signOut'),
      danger: true
    }
  ];

  return (
    <AuthGuard>
      <Layout className="dashboard-shell">
        <Sider
          width={252}
          collapsedWidth={88}
          collapsed={collapsed}
          breakpoint="lg"
          className="dashboard-sider"
          theme="light"
          trigger={null}
        >
          <div className={`sider-brand ${collapsed ? 'is-collapsed' : ''}`}>
            <div className="sider-brand-icon">HR</div>
            {!collapsed ? (
              <div className="sider-brand-copy">
                <div className="sider-brand-title">HR LOGISTIC</div>
                <div className="sider-brand-sub">MAKE IT EASY</div>
              </div>
            ) : null}
          </div>

          <div className="sider-section-label">{collapsed ? 'NAV' : t('menu.navigation')}</div>

          <Menu
            theme="light"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={menuItems}
            onClick={handleMenuClick}
            className="sider-menu"
          />

          <div className="sider-cta">
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              block
              onClick={handleLogout}
              className="sider-logout-btn"
            >
              {collapsed ? '' : t('common.signOut')}
            </Button>
          </div>
        </Sider>

        <Layout className="dashboard-main-layout">
          <Header className="dashboard-header">
            <div className="header-left">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                className="header-toggle-btn"
                onClick={() => setCollapsed((value) => !value)}
              />

              <div className="header-context">
                <span className="header-eyebrow">{t('common.workspace')}</span>
                <Typography.Title level={5} className="header-title">
                  {currentSection}
                </Typography.Title>
              </div>
            </div>

            <div className="header-actions">
              <div className="header-date-pill">
                <CalendarOutlined />
                <span suppressHydrationWarning>{currentDateLabel}</span>
              </div>

              <Dropdown
                menu={{
                  items: languageMenuItems,
                  selectable: true,
                  selectedKeys: [language],
                  onClick: ({ key }) => setLanguage(key)
                }}
                trigger={['click']}
              >
                <Button
                  type="text"
                  className="header-language-btn"
                  aria-label={t('header.language')}
                  title={t('header.language')}
                >
                  <span className="header-language-current" aria-hidden="true">
                    <span className="header-language-flag">{currentLanguage.emoji}</span>
                  </span>
                  <DownOutlined />
                </Button>
              </Dropdown>

              <Button type="text" icon={<BellOutlined />} className="header-icon-btn" />
              <Button type="text" icon={<QuestionCircleOutlined />} className="header-icon-btn" />

              <div className="header-divider" />

              {/* Avatar + User dropdown */}
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === 'logout') handleLogout();
                  }
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Tooltip
                  title={user?.fullName || user?.username || ''}
                  placement="bottomRight"
                >
                  <Avatar
                    size={34}
                    className="header-avatar"
                    src={user?.avatarUrl || null}
                    icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
                    alt={user?.fullName || 'Profile'}
                    style={{ cursor: 'pointer' }}
                  >
                    {!user?.avatarUrl && user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : undefined}
                  </Avatar>
                </Tooltip>
              </Dropdown>
            </div>
          </Header>

          <Content className="dashboard-content">{children}</Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
