'use client';

import { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  BankOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DownOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/components/AppProviders';
import AuthGuard from '@/components/AuthGuard';
import { clearToken } from '@/utils/auth';

const { Header, Content, Sider } = Layout;

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentDateLabel, setCurrentDateLabel] = useState('');
  const { language, setLanguage, options, t } = useLanguage();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    { key: '/jobs', icon: <InboxOutlined />, label: t('menu.jobs') },
    { key: '/partners', icon: <TeamOutlined />, label: t('menu.partners') },
    { key: '/accounting', icon: <BankOutlined />, label: t('menu.accounting') },
    { key: '/users', icon: <SettingOutlined />, label: t('menu.settings') }
  ];

  const selectedKey = menuItems.find(
    (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
  )?.key;

  const currentSection = menuItems.find((item) => item.key === selectedKey)?.label || t('menu.dashboard');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentDateLabel(new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date()));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [language]);

  function handleMenuClick({ key }) {
    router.push(key);
  }

  function handleLogout() {
    clearToken();
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
              <Button type="text" icon={<AppstoreOutlined />} className="header-icon-btn" />
              <div className="header-divider" />
              <Avatar
                size={34}
                className="header-avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmQyJDXTGZKm4cYD-kWQElFA-NjsBpGesN0FGAh-X8nUPa7JFLJoKcigp6Yy96GXLwJry85JotHlnFNlQPa9-t9EPYjgcNVKp-gHwVM-wsXPmhL6CtnlHwUq8b8AaaqD7BvTI1GuoFPBFyfqs1G9Y83z_VnITvM0Bl0So8zJKJGLriPijG4UDrh-mdeY609K2wStGhmifATmCUhLgm4wrqP0LAduSGqPO87jON8IgoJ5CaQb3sONBi7i8YtOkT9KAPFV6ihdfGdfsU"
                alt="Profile"
              />
            </div>
          </Header>

          <Content className="dashboard-content">{children}</Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
