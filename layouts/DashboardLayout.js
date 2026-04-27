'use client';

import { useState } from 'react';
import {
  AppstoreOutlined,
  BankOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { clearToken } from '@/utils/auth';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/jobs', icon: <InboxOutlined />, label: 'Jobs' },
  { key: '/partners', icon: <TeamOutlined />, label: 'Partners' },
  { key: '/accounting', icon: <BankOutlined />, label: 'Accounting' },
  { key: '/users', icon: <SettingOutlined />, label: 'Settings' }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = menuItems.find(
    (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
  )?.key;

  const currentSection = menuItems.find((item) => item.key === selectedKey)?.label || 'Dashboard';
  const currentDateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  function handleMenuClick({ key }) {
    router.push(key);
  }

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

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

          <div className="sider-section-label">{collapsed ? 'NAV' : 'Navigation'}</div>

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
              {collapsed ? '' : 'Sign out'}
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
                <span className="header-eyebrow">Workspace</span>
                <Typography.Title level={5} className="header-title">
                  {currentSection}
                </Typography.Title>
              </div>
            </div>

            <div className="header-actions">
              <div className="header-date-pill">
                <CalendarOutlined />
                <span>{currentDateLabel}</span>
              </div>
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
